import express from "express";

import {
    shareFile,
    getSharedWithMe,
    getSharedByMe,
    revokeShare
} from "../controllers/shareController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Share a file with another user
router.post("/", authMiddleware, shareFile);

// Get files shared with the logged-in user
router.get("/with-me", authMiddleware, getSharedWithMe);

// Get files shared by the logged-in user
router.get("/by-me", authMiddleware, getSharedByMe);

// Revoke access to a shared file
router.delete("/:shareId", authMiddleware, revokeShare);

export default router;