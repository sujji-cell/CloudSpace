import express from "express";

import {
    uploadFile,
    getUserFiles,
    deleteFile,
    moveFile
} from "../controllers/fileController.js";

import {
    uploadNewVersion,
    getVersionHistory,
    restoreVersion
} from "../controllers/versionController.js";

import { getFileAccessUrl } from "../controllers/fileAccessController.js";
import { getStorageOverview } from "../controllers/storageController.js";

import upload from "../middleware/uploadMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload a new file
router.post(
    "/upload",
    authMiddleware,
    upload.single("file"),
    uploadFile
);

// Upload a new version of an existing file
router.post(
    "/:fileId/versions",
    authMiddleware,
    upload.single("file"),
    uploadNewVersion
);

// Get file version history
router.get(
    "/:fileId/versions",
    authMiddleware,
    getVersionHistory
);

// Restore a previous file version
router.post(
    "/:fileId/versions/:versionNumber/restore",
    authMiddleware,
    restoreVersion
);

// Get all user files
router.get("/", authMiddleware, getUserFiles);

// Get storage overview
router.get("/storage", authMiddleware, getStorageOverview);

// Move a file
router.put("/:fileId/move", authMiddleware, moveFile);

// Get file access URL
router.get("/:fileId/access", authMiddleware, getFileAccessUrl);

// Delete a file
router.delete("/:fileId", authMiddleware, deleteFile);

export default router;