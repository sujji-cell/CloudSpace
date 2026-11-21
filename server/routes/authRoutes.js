import express from "express";

import {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    verifyEmail,
    resendOtp,
    updateProfile,
    changePassword,
    getNotificationPreferences,
    updateNotificationPreferences,
    getAppearancePreferences,
    updateAppearancePreferences,

    // Two-Factor Authentication
    verifyLoginOtp,
    resendLoginOtp,
    updateTwoFactorSettings

} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register
router.post("/register", registerUser);

// Verify Email
router.post("/verify-email", verifyEmail);

// Resend Email OTP
router.post("/resend-otp", resendOtp);

// Login
router.post("/login", loginUser);

// Logout
router.post("/logout", authMiddleware, logoutUser);

// ==========================================
// TWO-FACTOR AUTHENTICATION ROUTES
// ==========================================

// Verify Login OTP
router.post("/verify-login-otp", verifyLoginOtp);

// Resend Login OTP
router.post("/resend-login-otp", resendLoginOtp);

// Enable / Disable Two-Factor Authentication
router.put(
    "/two-factor",
    authMiddleware,
    updateTwoFactorSettings
);


// ==========================================
// USER PROFILE ROUTES
// ==========================================

// Get Current User (Protected)
router.get("/me", authMiddleware, getCurrentUser);

// Update User Profile (Protected)
router.put("/update-profile", authMiddleware, updateProfile);

// Change Password (Protected)
router.put("/change-password", authMiddleware, changePassword);


// ==========================================
// NOTIFICATION PREFERENCES ROUTES
// ==========================================

// Get Notification Preferences
router.get(
    "/notification-preferences",
    authMiddleware,
    getNotificationPreferences
);

// Update Notification Preferences
router.put(
    "/notification-preferences",
    authMiddleware,
    updateNotificationPreferences
);


// ==========================================
// APPEARANCE PREFERENCES ROUTES
// ==========================================

// Get Appearance Preferences
router.get(
    "/appearance-preferences",
    authMiddleware,
    getAppearancePreferences
);

// Update Appearance Preferences
router.put(
    "/appearance-preferences",
    authMiddleware,
    updateAppearancePreferences
);


export default router;
