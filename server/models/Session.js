import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        // User associated with this session
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // Unique session identifier
        sessionId: {
            type: String,
            required: true,
            unique: true
        },

        // Browser information
        userAgent: {
            type: String,
            default: "Unknown"
        },

        // IP address
        ipAddress: {
            type: String,
            default: "Unknown"
        },

        // Device information
        device: {
            type: String,
            default: "Unknown"
        },

        // Browser name
        browser: {
            type: String,
            default: "Unknown"
        },

        // Operating system
        operatingSystem: {
            type: String,
            default: "Unknown"
        },

        // Last activity
        lastActiveAt: {
            type: Date,
            default: Date.now
        },

        // Session expiration
        expiresAt: {
            type: Date,
            required: true
        },

        // Session revocation
        isRevoked: {
            type: Boolean,
            default: false
        },

        revokedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Find sessions belonging to a user
sessionSchema.index({
    userId: 1,
    isRevoked: 1
});

// Export Session Model
const Session = mongoose.model("Session", sessionSchema);

export default Session;