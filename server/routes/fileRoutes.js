import express from "express";

import {
    uploadFile,
    getUserFiles,
    deleteFile
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

// Get files belonging to the logged-in user
router.get(
    "/",
    authMiddleware,
    getUserFiles
);

// Get secure access URL for a file
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