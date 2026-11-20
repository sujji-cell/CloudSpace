import express from "express";

import {
    getRecycleBinFiles,
    restoreFile,
    permanentlyDeleteFile
} from "../controllers/recycleBinController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get deleted files
router.get("/", authMiddleware, getRecycleBinFiles);

// Restore deleted file
router.put("/restore/:fileId", authMiddleware, restoreFile);

// Permanently delete file
router.delete("/permanent/:fileId", authMiddleware, permanentlyDeleteFile);

export default router;