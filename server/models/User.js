import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        // First Name - Required
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true
        },

        // Middle Name - Optional
        middleName: {
            type: String,
            trim: true,
            default: ""
        },

        // Last Name - Optional
        lastName: {
            type: String,
            trim: true,
            default: ""
        },

        // Full Name
        name: {
            type: String,
            required: true,
            trim: true
        },

        // User's Email
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // Hashed Password
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        // Email Verification Status
        isVerified: {
            type: Boolean,
            default: false
        },

        // Hashed Email OTP (not the original OTP)
        emailOtpHash: {
            type: String,
            select: false
        },

        // OTP Expiration Time
        emailOtpExpiresAt: {
            type: Date
        },

        // Number of Incorrect OTP Attempts
        emailOtpAttempts: {
            type: Number,
            default: 0
        },

        // Last OTP Sent Time (for resend cooldown)
        emailOtpLastSentAt: {
            type: Date
        },

        // Total Storage Used (Bytes)
        storageUsed: {
            type: Number,
            default: 0
        },

        // Maximum Storage Limit (10 GB)
        storageLimit: {
            type: Number,
            default: 10 * 1024 * 1024 * 1024
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;