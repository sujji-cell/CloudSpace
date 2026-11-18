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

        // Cloudinary resource type (image, video, raw)
        resourceType: {
            type: String,
            default: "image"
        },

        // File size in bytes
        size: {
            type: Number,
            required: true
        },

        // MIME type (image/png, application/pdf, etc.)
        mimeType: {
            type: String,
            required: true
        },

        // File format (pdf, png, jpg, etc.)
        format: {
            type: String,
            default: ""
        },

        // File owner
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const File = mongoose.model("File", fileSchema);

export default File;