import express from "express";

import {
    shareFile,
    getSharedWithMe,
    getSharedByMe,
    revokeShare,
    removeSharedFile
} from "../controllers/shareController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Share a file with another user
router.post("/", authMiddleware, shareFile);

// Get files shared with the logged-in user
router.get("/with-me", authMiddleware, getSharedWithMe);

// Get files shared by the logged-in user
router.get("/by-me", authMiddleware, getSharedByMe);

// Remove a file shared with the logged-in user
router.delete("/remove/:shareId", authMiddleware, removeSharedFile);

// Revoke access to a shared file (owner only)
router.delete("/:shareId", authMiddleware, revokeShare);

export default router;