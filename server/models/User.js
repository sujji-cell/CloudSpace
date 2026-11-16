import mongoose from "mongoose";

const userSchema = new mongoose.Schema(

    {
        // User's Full Name
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