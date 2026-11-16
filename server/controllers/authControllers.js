import User from "../models/User.js";
import bcrypt from "bcryptjs";

// REGISTER USER
export const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        // 1. Check whether all fields are provided

        if (!name || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });

        }

        // 2. Validate name

        if (name.trim().length < 2) {

            return res.status(400).json({
                success: false,
                message: "Name must contain at least 2 characters"
            });

        }

        // 3. Validate email

        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });

        }

        // 4. Validate password

        if (password.length < 8) {

            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });

        }

        // 5. Check whether user already exists

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });

        }

        // 6. Hash password

        const hashedPassword = await bcrypt.hash(password, 12);

        // 7. Create new user

        const newUser = await User.create({

            name: name.trim(),

            email: normalizedEmail,

            password: hashedPassword

        });

        // 8. Return success response

        return res.status(201).json({

            success: true,

            message: "Account created successfully!",

            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                storageUsed: newUser.storageUsed,
                storageLimit: newUser.storageLimit,
                createdAt: newUser.createdAt
            }

        });

    } catch (error) {

        console.error("Registration Error:", error);

        // Handle duplicate email race conditions

        if (error.code === 11000) {

            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });

        }

        return res.status(500).json({

            success: false,

            message: "Internal server error"

        });

    }

};