import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
    {
        // File being shared
        file: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
            required: true
        },

        // User who owns and shares the file
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // User receiving access
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Recipient's access permission
        permission: {
            type: String,
            enum: ["viewer", "editor"],
            default: "viewer",
            required: true
        },

        // Whether access is currently active
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Prevent duplicate sharing records
shareSchema.index(
    { file: 1, recipient: 1 },
    { unique: true }
);

// Improve sharing queries
shareSchema.index({ recipient: 1, isActive: 1 });
shareSchema.index({ owner: 1, isActive: 1 });

const Share = mongoose.model("Share", shareSchema);

export default Share;