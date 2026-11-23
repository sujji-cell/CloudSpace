import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
    {
        originalName: {
            type: String,
            required: true,
            trim: true
        },

        fileUrl: {
            type: String,
            required: true
        },

        cloudinaryId: {
            type: String,
            required: true
        },

        resourceType: {
            type: String,
            default: "image"
        },

        deliveryType: {
            type: String,
            enum: ["upload", "private", "authenticated"],
            default: "upload"
        },

        size: {
            type: Number,
            required: true
        },

        mimeType: {
            type: String,
            required: true
        },

        format: {
            type: String,
            default: ""
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        folder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Folder",
            default: null
        },

        // Tracks the latest version of this file
        currentVersion: {
            type: Number,
            default: 1
        },

        lastAccessedAt: {
            type: Date,
            default: null
        },

        isDeleted: {
    type: Boolean,
    default: false
},

// Prevents simultaneous permanent deletion requests
isDeleting: {
    type: Boolean,
    default: false
},

        deletedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

const File = mongoose.model("File", fileSchema);

export default File;