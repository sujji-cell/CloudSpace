import mongoose from "mongoose";

const loginActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        sessionId: {
            type: String,
            default: null
        },

        event: {
            type: String,
            enum: [
                "login",
                "logout",
                "session_revoked",
                "login_failed",
                "suspicious_login_alert"
            ],
            required: true
        },

        ipAddress: {
            type: String,
            default: "Unknown"
        },

        userAgent: {
            type: String,
            default: "Unknown"
        },

        device: {
            type: String,
            default: "Unknown"
        },

        browser: {
            type: String,
            default: "Unknown"
        },

        operatingSystem: {
            type: String,
            default: "Unknown"
        },

        details: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

loginActivitySchema.index({
    userId: 1,
    createdAt: -1
});

const LoginActivity = mongoose.model(
    "LoginActivity",
    loginActivitySchema
);

export default LoginActivity;