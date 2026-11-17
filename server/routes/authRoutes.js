import express from "express";

import {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    verifyEmail,
    resendOtp
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

// Logout
router.post("/logout", logoutUser);

export default router;