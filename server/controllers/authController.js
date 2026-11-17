import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";


// ==========================================
// REGISTER USER
// ==========================================

export const registerUser = async (req, res) => {
    try {
        const {
            firstName,
            middleName,
            lastName,
            email,
            password
        } = req.body;

        // Validate first name
        if (!firstName || !firstName.trim()) {
            return res.status(400).json({
                success: false,
                message: "First name is required."
            });
        }

        // Validate email
        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        // Validate password
        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        // Clean name fields
        const cleanFirstName = firstName.trim();
        const cleanMiddleName = middleName?.trim() || "";
        const cleanLastName = lastName?.trim() || "";

        // Create full name
        const fullName = [
            cleanFirstName,
            cleanMiddleName,
            cleanLastName
        ].filter(Boolean).join(" ");

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Check existing user
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Hash OTP using HMAC
        const otpHash = crypto
            .createHmac("sha256", process.env.JWT_SECRET)
            .update(otp)
            .digest("hex");

        // OTP expiry: 5 minutes
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        // Create user
        const user = await User.create({
            firstName: cleanFirstName,
            middleName: cleanMiddleName,
            lastName: cleanLastName,
            name: fullName,
            email: normalizedEmail,
            password: hashedPassword,
            isVerified: false,
            emailOtpHash: otpHash,
            emailOtpExpiresAt: otpExpiry,
            emailOtpAttempts: 0,
            emailOtpLastSentAt: new Date()
        });

        // Send verification email
        try {
            await sendEmail(
                normalizedEmail,
                "Verify Your CloudSpace Account",
                `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Welcome to CloudSpace!</h2>

                        <p>Hello ${cleanFirstName},</p>

                        <p>
                            Thank you for registering with CloudSpace.
                            Use the OTP below to verify your email address.
                        </p>

                        <h1 style="
                            letter-spacing: 8px;
                            color: #4169e1;
                        ">
                            ${otp}
                        </h1>

                        <p>This OTP expires in 5 minutes.</p>

                        <p>
                            If you did not create this account,
                            you can ignore this email.
                        </p>

                        <br />

                        <p>Team CloudSpace</p>
                    </div>
                `
            );

        } catch (emailError) {

            // Delete account if email sending fails
            await User.findByIdAndDelete(user._id);

            console.error("Email sending error:", emailError);

            return res.status(500).json({
                success: false,
                message: "Unable to send verification email. Please try again."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Registration successful. Please verify your email.",
            user: {
                id: user._id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again."
        });
    }
};


// ==========================================
// VERIFY EMAIL
// ==========================================

export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required."
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 6-digit OTP."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+emailOtpHash");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified."
            });
        }

        if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "Please request a new OTP."
            });
        }

        if (user.emailOtpExpiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        if (user.emailOtpAttempts >= 5) {
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please request a new OTP."
            });
        }

        const enteredOtpHash = crypto
            .createHmac("sha256", process.env.JWT_SECRET)
            .update(otp)
            .digest("hex");

        const storedHash = Buffer.from(user.emailOtpHash, "hex");
        const enteredHash = Buffer.from(enteredOtpHash, "hex");

        const isOtpValid =
            storedHash.length === enteredHash.length &&
            crypto.timingSafeEqual(storedHash, enteredHash);

        if (!isOtpValid) {

            user.emailOtpAttempts += 1;
            await user.save();

            return res.status(400).json({
                success: false,
                message: "Incorrect OTP. Please try again."
            });
        }

        // Verify account
        user.isVerified = true;

        // Clear OTP details
        user.emailOtpHash = undefined;
        user.emailOtpExpiresAt = undefined;
        user.emailOtpAttempts = 0;
        user.emailOtpLastSentAt = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in."
        });

    } catch (error) {
        console.error("Email verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Email verification failed."
        });
    }
};


// ==========================================
// RESEND OTP
// ==========================================

export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified."
            });
        }

        // 60-second resend cooldown
        if (user.emailOtpLastSentAt) {

            const timePassed =
                Date.now() - user.emailOtpLastSentAt.getTime();

            if (timePassed < 60000) {
                return res.status(429).json({
                    success: false,
                    message: "Please wait before requesting another OTP."
                });
            }
        }

        // Generate new OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpHash = crypto
            .createHmac("sha256", process.env.JWT_SECRET)
            .update(otp)
            .digest("hex");

        user.emailOtpHash = otpHash;
        user.emailOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        user.emailOtpAttempts = 0;
        user.emailOtpLastSentAt = new Date();

        await user.save();

        try {

            await sendEmail(
                user.email,
                "Your New CloudSpace Verification OTP",
                `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>CloudSpace Email Verification</h2>

                        <p>Hello ${user.firstName},</p>

                        <p>Your new verification OTP is:</p>

                        <h1 style="
                            letter-spacing: 8px;
                            color: #4169e1;
                        ">
                            ${otp}
                        </h1>

                        <p>This OTP expires in 5 minutes.</p>
                    </div>
                `
            );

        } catch (emailError) {

            user.emailOtpHash = undefined;
            user.emailOtpExpiresAt = undefined;
            user.emailOtpLastSentAt = undefined;

            await user.save();

            console.error("Resend email error:", emailError);

            return res.status(500).json({
                success: false,
                message: "Unable to send OTP. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "A new verification OTP has been sent."
        });

    } catch (error) {
        console.error("Resend OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to resend OTP."
        });
    }
};


// ==========================================
// LOGIN USER
// ==========================================

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in."
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Set HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                id: user._id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                name: user.name,
                email: user.email,
                storageUsed: user.storageUsed,
                storageLimit: user.storageLimit
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
};


// ==========================================
// GET CURRENT USER
// ==========================================

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                name: user.name,
                email: user.email,
                storageUsed: user.storageUsed,
                storageLimit: user.storageLimit,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error("Get current user error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch user details."
        });
    }
};


// ==========================================
// LOGOUT USER
// ==========================================

export const logoutUser = (req, res) => {

    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully."
    });
};