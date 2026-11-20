import express from "express";

import {
    uploadFile,
    getUserFiles,
    deleteFile,
    moveFile
} from "../controllers/fileController.js";

import {
    getFileAccessUrl
} from "../controllers/fileAccessController.js";

import upload from "../middleware/uploadMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload a file
router.post(
    "/upload",
    authMiddleware,
    upload.single("file"),
    uploadFile
);

// Get user's files
router.get(
    "/",
    authMiddleware,
    getUserFiles
);

// Move a file
router.put(
    "/:fileId/move",
    authMiddleware,
    moveFile
);

// Get authorized file access URL
router.get(
    "/:fileId/access",
    authMiddleware,
    getFileAccessUrl
);

// Delete a file
router.delete(
    "/:fileId",
    authMiddleware,
    deleteFile
);

export default router;