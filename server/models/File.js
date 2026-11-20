import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
    {
        // Original file name
        originalName: {
            type: String,
            required: true,
            trim: true
        },

        // File URL from Cloudinary
        fileUrl: {
            type: String,
            required: true
        },

        // Cloudinary public ID
        cloudinaryId: {
            type: String,
            required: true
        },

        // Cloudinary resource type
        resourceType: {
            type: String,
            default: "image"
        },

        // Delivery type
        deliveryType: {
            type: String,
            enum: ["upload", "private", "authenticated"],
            default: "upload"
        },

        // File size in bytes
        size: {
            type: Number,
            required: true
        },

        // MIME type
        mimeType: {
            type: String,
            required: true
        },

        // File format
        format: {
            type: String,
            default: ""
        },

        // File owner
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Folder containing this file
        // Null means the file is in the root directory
        folder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Folder",
            default: null
        },

        // Last time the file was accessed
        lastAccessedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const File = mongoose.model("File", fileSchema);

export default File;