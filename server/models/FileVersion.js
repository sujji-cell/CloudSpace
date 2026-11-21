import mongoose from "mongoose";

const fileVersionSchema = new mongoose.Schema(
    {
        // Original file reference
        file: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
            required: true,
            index: true
        },

        // Version number
        versionNumber: {
            type: Number,
            required: true
        },

        // Original Number
        originalName: {
            type: String,
            required: true
        },

        // Cloudinary file URL
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
            default: "raw"
        },

        // Delivery type
        deliveryType: {
            type: String,
            enum: ["upload", "private", "authenticated"],
            default: "authenticated"
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

        // User who uploaded this version
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Whether this is the current version
        isCurrent: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate version numbers for the same file
fileVersionSchema.index(
    {
        file: 1,
        versionNumber: 1
    },
    {
        unique: true
    }
);

const FileVersion = mongoose.model(
    "FileVersion",
    fileVersionSchema
);

export default FileVersion;