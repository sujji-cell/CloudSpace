import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { createSession } from "../utils/sessionUtils.js";

import {
    createSecurityNotification,
    createSuspiciousLoginNotification
} from "../utils/securityNotificationUtils.js";

import Session from "../models/Session.js";
import LoginActivity from "../models/LoginActivity.js";


// ============================================
// HELPER: ESCAPE HTML
// ============================================

const escapeHtml = (value = "") => {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
};


// ============================================
// HELPER: GET CLIENT IP ADDRESS
// ============================================

const getClientIp = (req) => {
    return (
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "Unknown"
    );
};


// ============================================
// HELPER: CHECK LOGIN LOCKOUT
// ============================================

const isLoginLocked = async (user, req) => {
    try {
        const ipAddress = getClientIp(req);

        const fifteenMinutesAgo = new Date(
            Date.now() - 15 * 60 * 1000
        );

        const failedCount = await LoginActivity.countDocuments({
            userId: user._id,
            event: "login_failed",
            ipAddress,
            createdAt: {
                $gte: fifteenMinutesAgo
            }
        });

        return failedCount >= 5;

    } catch (error) {
        console.error("Login lockout check error:", error);
        throw error;
    }
};


// ============================================
// HELPER: RECORD FAILED LOGIN ATTEMPTS
// ============================================

const recordFailedLogin = async (user, req) => {
    try {
        const ipAddress = getClientIp(req);

        const userAgent =
            req.headers["user-agent"] || "Unknown";

        // Record failed login attempt
        await LoginActivity.create({
            userId: user._id,
            sessionId: null,
            event: "login_failed",
            ipAddress,
            userAgent,
            details: "Incorrect password entered during login."
        });

        // Calculate 15-minute detection window
        const fifteenMinutesAgo = new Date(
            Date.now() - 15 * 60 * 1000
        );

        // Count failed attempts
        const failedCount = await LoginActivity.countDocuments({
            userId: user._id,
            event: "login_failed",
            ipAddress,
            createdAt: {
                $gte: fifteenMinutesAgo
            }
        });

        console.log(`Failed login attempts: ${failedCount}`);

        if (failedCount < 5) {
            return;
        }

        // Check 30-minute alert cooldown
        const thirtyMinutesAgo = new Date(
            Date.now() - 30 * 60 * 1000
        );

        const existingAlert = await LoginActivity.findOne({
            userId: user._id,
            event: "suspicious_login_alert",
            ipAddress,
            createdAt: {
                $gte: thirtyMinutesAgo
            }
        });

        if (existingAlert) {
            return;
        }

        // Record suspicious activity
        await LoginActivity.create({
            userId: user._id,
            sessionId: null,
            event: "suspicious_login_alert",
            ipAddress,
            userAgent,
            details: `Suspicious login detected after ${failedCount} failed attempts.`
        });

        // Send security notifications
        await createSuspiciousLoginNotification(
            user,
            ipAddress,
            failedCount
        );

    } catch (error) {
        console.error(
            "Failed login activity recording error:",
            error
        );
    }
};


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
        } = req.body || {};

        // Validate input types first
        if (
            typeof firstName !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            (middleName !== undefined && typeof middleName !== "string") ||
            (lastName !== undefined && typeof lastName !== "string")
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration input."
            });
        }

        // Validate first name
        if (!firstName.trim()) {
            return res.status(400).json({
                success: false,
                message: "First name is required."
            });
        }

        // Validate email
        if (!email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        // Validate name lengths
        if (
            firstName.trim().length > 50 ||
            (middleName?.trim().length || 0) > 50 ||
            (lastName?.trim().length || 0) > 50
        ) {
            return res.status(400).json({
                success: false,
                message: "Name fields cannot exceed 50 characters."
            });
        }

        // Validate full name length
        const fullName = [
            firstName.trim(),
            middleName?.trim() || "",
            lastName?.trim() || ""
        ].filter(Boolean).join(" ");

        if (fullName.length > 160) {
            return res.status(400).json({
                success: false,
                message: "Full name cannot exceed 160 characters."
            });
        }

        // Validate email format and length
        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            normalizedEmail.length > 254 ||
            !emailRegex.test(normalizedEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Validate password
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        // Clean name fields
        const cleanFirstName = firstName.trim();
        const cleanMiddleName = middleName?.trim() || "";
        const cleanLastName = lastName?.trim() || "";

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

        // Generate OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Hash OTP
        const otpHash = crypto
            .createHmac("sha256", process.env.JWT_SECRET)
            .update(otp)
            .digest("hex");

        // OTP expiry: 5 minutes
        const otpExpiry = new Date(
            Date.now() + 5 * 60 * 1000
        );

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

                        <p>Hello ${escapeHtml(cleanFirstName)},</p>

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

        // Handle duplicate email race condition
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

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
        const { email, otp } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof otp !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid email verification input."
            });
        }

        if (!email.trim() || !otp) {
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

        // Hash entered OTP
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
// RESEND EMAIL VERIFICATION OTP
// ==========================================

export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body || {};

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address."
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
        user.emailOtpExpiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );
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

                        <p>Hello ${escapeHtml(user.firstName)},</p>

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
        const { email, password } = req.body || {};

        // Validate input types
        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid login input."
            });
        }

        if (!email.trim() || !password) {
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

        // Check temporary lockout
        const isLocked = await isLoginLocked(user, req);

        if (isLocked) {
            return res.status(429).json({
                success: false,
                message: "Too many failed login attempts. Please try again later."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            await recordFailedLogin(user, req);

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

        // ======================================
        // TWO-FACTOR AUTHENTICATION
        // ======================================

        if (user.twoFactorEnabled) {

            // Prevent repeated login OTP emails
            if (user.loginOtpLastSentAt) {
                const timePassed =
                    Date.now() - user.loginOtpLastSentAt.getTime();

                if (timePassed < 60000) {
                    return res.status(429).json({
                        success: false,
                        message: "Please wait before requesting another login OTP."
                    });
                }
            }

            // Generate secure OTP
            const otp = crypto.randomInt(100000, 1000000).toString();

            // Hash OTP
            const otpHash = crypto
                .createHmac("sha256", process.env.JWT_SECRET)
                .update(otp)
                .digest("hex");

            // Save OTP details
            user.loginOtpHash = otpHash;
            user.loginOtpExpiresAt = new Date(
                Date.now() + 5 * 60 * 1000
            );

            // Reset attempts for a fresh password-authenticated challenge
            user.loginOtpAttempts = 0;
            user.loginOtpLastSentAt = new Date();

            await user.save();

            // Send login OTP
            try {
                await sendEmail(
                    user.email,
                    "Your CloudSpace Login Verification Code",
                    `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>CloudSpace Login Verification</h2>

                            <p>Hello ${escapeHtml(user.firstName)},</p>

                            <p>
                                Someone is attempting to log in to your
                                CloudSpace account.
                            </p>

                            <p>Your login verification code is:</p>

                            <h1 style="
                                letter-spacing: 8px;
                                color: #4169e1;
                            ">
                                ${otp}
                            </h1>

                            <p>This code expires in 5 minutes.</p>

                            <p>
                                If you did not attempt to log in,
                                please secure your account.
                            </p>

                            <br />

                            <p>Team CloudSpace</p>
                        </div>
                    `
                );

            } catch (emailError) {

                user.loginOtpHash = undefined;
                user.loginOtpExpiresAt = undefined;
                user.loginOtpAttempts = 0;
                user.loginOtpLastSentAt = undefined;

                await user.save();

                console.error("Login OTP email error:", emailError);

                return res.status(500).json({
                    success: false,
                    message: "Unable to send login verification code."
                });
            }

            return res.status(200).json({
                success: true,
                requiresTwoFactor: true,
                message: "A verification code has been sent to your email.",
                email: user.email
            });
        }

        // ======================================
        // NORMAL LOGIN (2FA DISABLED)
        // ======================================

        const session = await createSession(user._id, req);

        // Security notification should not interrupt login
        try {
            await createSecurityNotification(user, session);
        } catch (notificationError) {
            console.error(
                "Security notification failed:",
                notificationError.message
            );
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                sessionId: session.sessionId
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Store JWT in HTTP-only cookie
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
                storageLimit: user.storageLimit,
                twoFactorEnabled: user.twoFactorEnabled
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
// VERIFY LOGIN OTP
// ==========================================

export const verifyLoginOtp = async (req, res) => {
    try {
        const { email, otp } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof otp !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid login OTP input."
            });
        }

        if (!email.trim() || !otp) {
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
        }).select("+loginOtpHash");

        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification request."
            });
        }

        if (!user.loginOtpHash || !user.loginOtpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "Please request a new login OTP."
            });
        }

        if (user.loginOtpExpiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please log in again."
            });
        }

        if (user.loginOtpAttempts >= 5) {
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please log in again."
            });
        }

        // Hash entered OTP
        const enteredOtpHash = crypto
            .createHmac("sha256", process.env.JWT_SECRET)
            .update(otp)
            .digest("hex");

        const storedHash = Buffer.from(user.loginOtpHash, "hex");
        const enteredHash = Buffer.from(enteredOtpHash, "hex");

        const isOtpValid =
            storedHash.length === enteredHash.length &&
            crypto.timingSafeEqual(storedHash, enteredHash);

        if (!isOtpValid) {
            user.loginOtpAttempts += 1;
            await user.save();

            return res.status(400).json({
                success: false,
                message: "Incorrect OTP. Please try again."
            });
        }

        // Clear OTP details
        user.loginOtpHash = undefined;
        user.loginOtpExpiresAt = undefined;
        user.loginOtpAttempts = 0;
        user.loginOtpLastSentAt = undefined;

        await user.save();

        // Create session after successful OTP verification
        const session = await createSession(user._id, req);

        // Security notification should not interrupt login
        try {
            await createSecurityNotification(user, session);
        } catch (notificationError) {
            console.error(
                "Security notification failed:",
                notificationError.message
            );
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                sessionId: session.sessionId
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Store JWT in HTTP-only cookie
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
                storageLimit: user.storageLimit,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });

    } catch (error) {
        console.error("Login OTP verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify login OTP."
        });
    }
};


// ==========================================
// RESEND LOGIN OTP
// ==========================================

export const resendLoginOtp = async (req, res) => {
    try {
        const { email } = req.body || {};

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+loginOtpHash");

        if (
            !user ||
            !user.twoFactorEnabled ||
            !user.loginOtpHash
        ) {
            return res.status(400).json({
                success: false,
                message: "No pending login verification request."
            });
        }

        // 60-second resend cooldown
        if (user.loginOtpLastSentAt) {
            const timePassed =
                Date.now() - user.loginOtpLastSentAt.getTime();

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

        // Update OTP details
        user.loginOtpHash = otpHash;
        user.loginOtpExpiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        // Do not reset loginOtpAttempts here.
        // Resending must not grant another five guessing attempts.

        user.loginOtpLastSentAt = new Date();

        await user.save();

        try {
            await sendEmail(
                user.email,
                "Your New CloudSpace Login OTP",
                `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>CloudSpace Login Verification</h2>

                        <p>Hello ${escapeHtml(user.firstName)},</p>

                        <p>Your new login verification code is:</p>

                        <h1 style="
                            letter-spacing: 8px;
                            color: #4169e1;
                        ">
                            ${otp}
                        </h1>

                        <p>This code expires in 5 minutes.</p>

                        <p>Team CloudSpace</p>
                    </div>
                `
            );

        } catch (emailError) {

            user.loginOtpHash = undefined;
            user.loginOtpExpiresAt = undefined;
            user.loginOtpLastSentAt = undefined;

            await user.save();

            console.error("Resend login OTP error:", emailError);

            return res.status(500).json({
                success: false,
                message: "Unable to send a new OTP."
            });
        }

        return res.status(200).json({
            success: true,
            message: "A new login OTP has been sent."
        });

    } catch (error) {
        console.error("Resend login OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to resend login OTP."
        });
    }
};


// ==========================================
// UPDATE TWO-FACTOR AUTHENTICATION SETTINGS
// ==========================================

export const updateTwoFactorSettings = async (req, res) => {
    try {
        const { enabled, currentPassword } = req.body || {};

        if (
            typeof currentPassword !== "string" ||
            !currentPassword.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide your current password."
            });
        }

        if (typeof enabled !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "A valid two-factor authentication setting is required."
            });
        }

        const user = await User.findById(req.userId)
            .select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Confirm current password
        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first."
            });
        }

        // Update 2FA setting
        user.twoFactorEnabled = enabled;

        // Clear pending login OTP
        user.loginOtpHash = undefined;
        user.loginOtpExpiresAt = undefined;
        user.loginOtpAttempts = 0;
        user.loginOtpLastSentAt = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: enabled
                ? "Two-factor authentication enabled successfully."
                : "Two-factor authentication disabled successfully.",
            twoFactorEnabled: user.twoFactorEnabled
        });

    } catch (error) {
        console.error("Update 2FA settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update two-factor authentication settings."
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
                createdAt: user.createdAt,
                twoFactorEnabled: user.twoFactorEnabled
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
// UPDATE USER PROFILE
// ==========================================

export const updateProfile = async (req, res) => {
    try {
        const {
            firstName,
            middleName,
            lastName
        } = req.body || {};

        // Validate input types
        if (
            typeof firstName !== "string" ||
            (middleName !== undefined && typeof middleName !== "string") ||
            (lastName !== undefined && typeof lastName !== "string")
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid profile information."
            });
        }

        // Validate first name
        if (!firstName.trim()) {
            return res.status(400).json({
                success: false,
                message: "First name is required."
            });
        }

        // Validate name lengths
        if (
            firstName.trim().length > 50 ||
            (middleName?.trim().length || 0) > 50 ||
            (lastName?.trim().length || 0) > 50
        ) {
            return res.status(400).json({
                success: false,
                message: "Name fields cannot exceed 50 characters."
            });
        }

        const cleanFirstName = firstName.trim();
        const cleanMiddleName = middleName?.trim() || "";
        const cleanLastName = lastName?.trim() || "";

        const fullName = [
            cleanFirstName,
            cleanMiddleName,
            cleanLastName
        ].filter(Boolean).join(" ");

        if (fullName.length > 160) {
            return res.status(400).json({
                success: false,
                message: "Full name cannot exceed 160 characters."
            });
        }

        // Find authenticated user
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Update user details
        user.firstName = cleanFirstName;
        user.middleName = cleanMiddleName;
        user.lastName = cleanLastName;
        user.name = fullName;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
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
        console.error("Update profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update profile."
        });
    }
};


// ==========================================
// CHANGE USER PASSWORD
// ==========================================

export const changePassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body || {};

        // Validate input types
        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid password input."
            });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 8 characters."
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from your current password."
            });
        }

        // Retrieve user with hashed password
        const user = await User.findById(req.userId)
            .select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Verify current password
        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        user.password = hashedPassword;

await user.save();

// Revoke all other active sessions
await Session.updateMany(
    {
        userId: user._id,
        sessionId: { $ne: req.sessionId },
        isRevoked: false
    },
    {
        $set: {
            isRevoked: true,
            revokedAt: new Date()
        }
    }
);

        return res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to change password. Please try again."
        });
    }
};


// ==========================================
// LOGOUT USER
// ==========================================

export const logoutUser = async (req, res) => {
    try {
        // Revoke current session
        const session = await Session.findOneAndUpdate(
            {
                userId: req.userId,
                sessionId: req.sessionId,
                isRevoked: false
            },
            {
                isRevoked: true,
                revokedAt: new Date()
            },
            {
                returnDocument: "after"
            }
        );

        // Record logout activity
        if (session) {
            await LoginActivity.create({
                userId: req.userId,
                sessionId: req.sessionId,
                event: "logout",
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                device: session.device,
                browser: session.browser,
                operatingSystem: session.operatingSystem,
                details: "User logged out successfully."
            });
        }

        // Clear authentication cookie
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });

    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong during logout."
        });
    }
};


// ==========================================
// GET NOTIFICATION PREFERENCES
// ==========================================

export const getNotificationPreferences = async (req, res) => {
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
            message: "Notification preferences fetched successfully.",
            preferences: user.notificationPreferences
        });

    } catch (error) {
        console.error("Get Notification Preferences Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch notification preferences."
        });
    }
};


// ==========================================
// UPDATE NOTIFICATION PREFERENCES
// ==========================================

export const updateNotificationPreferences = async (req, res) => {
    try {
        const { email, inApp } = req.body || {};

        // Validate object types
        if (
            !email ||
            typeof email !== "object" ||
            Array.isArray(email) ||
            !inApp ||
            typeof inApp !== "object" ||
            Array.isArray(inApp)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification preferences."
            });
        }

        const preferenceValues = [
            email.fileSharing,
            email.fileUploads,
            email.securityAlerts,
            inApp.sharedFileUpdates,
            inApp.storageAlerts,
            inApp.accountActivity
        ];

        if (!preferenceValues.every(value => typeof value === "boolean")) {
            return res.status(400).json({
                success: false,
                message: "All notification preferences must be boolean values."
            });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        user.notificationPreferences = {
            email: {
                fileSharing: email.fileSharing,
                fileUploads: email.fileUploads,
                securityAlerts: email.securityAlerts
            },
            inApp: {
                sharedFileUpdates: inApp.sharedFileUpdates,
                storageAlerts: inApp.storageAlerts,
                accountActivity: inApp.accountActivity
            }
        };

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Notification preferences updated successfully.",
            preferences: user.notificationPreferences
        });

    } catch (error) {
        console.error("Update Notification Preferences Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update notification preferences."
        });
    }
};


// ==========================================
// GET APPEARANCE PREFERENCES
// ==========================================

export const getAppearancePreferences = async (req, res) => {
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
            message: "Appearance preferences fetched successfully.",
            preferences: user.appearancePreferences
        });

    } catch (error) {
        console.error("Get Appearance Preferences Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch appearance preferences."
        });
    }
};


// ==========================================
// UPDATE APPEARANCE PREFERENCES
// ==========================================

export const updateAppearancePreferences = async (req, res) => {
    try {
        const {
            theme,
            accentColor,
            sidebar,
            density
        } = req.body || {};

        const allowedValues = {
            theme: ["light", "dark", "system"],
            accentColor: ["blue", "purple", "green", "orange"],
            sidebar: ["expanded", "collapsed"],
            density: ["comfortable", "compact"]
        };

        // Validate all preferences
        if (
            !allowedValues.theme.includes(theme) ||
            !allowedValues.accentColor.includes(accentColor) ||
            !allowedValues.sidebar.includes(sidebar) ||
            !allowedValues.density.includes(density)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid appearance preferences."
            });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        user.appearancePreferences = {
            theme,
            accentColor,
            sidebar,
            density
        };

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Appearance preferences updated successfully.",
            preferences: user.appearancePreferences
        });

    } catch (error) {
        console.error("Update Appearance Preferences Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update appearance preferences."
        });
    }
};