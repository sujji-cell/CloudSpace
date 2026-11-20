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
    updateAppearancePreferences
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", registerUser);

// Verify Email
router.post("/verify-email", verifyEmail);

// Resend Email OTP
router.post("/resend-otp", resendOtp);

// Login
router.post("/login", loginUser);

// Get Current User (Protected)
router.get("/me", authMiddleware, getCurrentUser);

// Update User Profile (Protected)
router.put("/update-profile", authMiddleware, updateProfile);

// Change Password (Protected)
router.put("/change-password", authMiddleware, changePassword);

// Get Notification Preferences (Protected)
router.get(
    "/notification-preferences",
    authMiddleware,
    getNotificationPreferences
);

// Get Appearance Preferences (Protected)
router.get(
    "/appearance-preferences",
    authMiddleware,
    getAppearancePreferences
);

// Update Appearance Preferences (Protected)
router.put(
    "/appearance-preferences",
    authMiddleware,
    updateAppearancePreferences
);

// Update Notification Preferences (Protected)
router.put(
    "/notification-preferences",
    authMiddleware,
    updateNotificationPreferences
);

// Logout
router.post("/logout", logoutUser);

export default router;