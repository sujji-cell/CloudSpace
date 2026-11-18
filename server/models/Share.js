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

        // Whether access is currently active
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Prevent duplicate sharing records for the same file and recipient
shareSchema.index(
    { file: 1, recipient: 1 },
    { unique: true }
);

const Share = mongoose.model("Share", shareSchema);

export default Share;