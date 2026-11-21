import mongoose from "mongoose";

// Notification Preferences Schema
const notificationPreferencesSchema = new mongoose.Schema(
    {
        email: {
            fileSharing: {
                type: Boolean,
                default: true
            },
            fileUploads: {
                type: Boolean,
                default: true
            },
            securityAlerts: {
                type: Boolean,
                default: true
            }
        },

        inApp: {
            sharedFileUpdates: {
                type: Boolean,
                default: true
            },
            storageAlerts: {
                type: Boolean,
                default: true
            },
            accountActivity: {
                type: Boolean,
                default: true
            }
        }
    },
    {
        _id: false
    }
);

// Appearance Preferences Schema
const appearancePreferencesSchema = new mongoose.Schema(
    {
        theme: {
            type: String,
            enum: ["light", "dark", "system"],
            default: "light"
        },

        accentColor: {
            type: String,
            enum: ["blue", "purple", "green", "orange"],
            default: "blue"
        },

        sidebar: {
            type: String,
            enum: ["expanded", "collapsed"],
            default: "expanded"
        },

        density: {
            type: String,
            enum: ["comfortable", "compact"],
            default: "comfortable"
        }
    },
    {
        _id: false
    }
);

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

        // ======================================
        // EMAIL VERIFICATION OTP
        // ======================================

        emailOtpHash: {
            type: String,
            select: false
        },

        emailOtpExpiresAt: {
            type: Date
        },

        emailOtpAttempts: {
            type: Number,
            default: 0
        },

        emailOtpLastSentAt: {
            type: Date
        },

        // ======================================
        // TWO-FACTOR AUTHENTICATION (2FA)
        // ======================================

        // Whether the user has enabled 2FA
        twoFactorEnabled: {
            type: Boolean,
            default: false
        },

        // Hashed Login OTP
        loginOtpHash: {
            type: String,
            select: false
        },

        // Login OTP Expiration Time
        loginOtpExpiresAt: {
            type: Date
        },

        // Number of Incorrect Login OTP Attempts
        loginOtpAttempts: {
            type: Number,
            default: 0
        },

        // Last Login OTP Sent Time
        loginOtpLastSentAt: {
            type: Date
        },

        // ======================================
        // USER PREFERENCES
        // ======================================

        notificationPreferences: {
            type: notificationPreferencesSchema,
            default: () => ({})
        },

        appearancePreferences: {
            type: appearancePreferencesSchema,
            default: () => ({})
        },

        // ======================================
        // STORAGE INFORMATION
        // ======================================

        storageUsed: {
            type: Number,
            default: 0
        },

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