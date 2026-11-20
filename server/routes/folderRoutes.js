import express from "express";

import {
    createFolder,
    getUserFolders,
    renameFolder,
    deleteFolder
} from "../controllers/folderController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new folder
router.post(
    "/",
    authMiddleware,
    createFolder
);

// Get all folders belonging to the logged-in user
router.get(
    "/",
    authMiddleware,
    getUserFolders
);

// Rename a folder
router.put(
    "/:folderId",
    authMiddleware,
    renameFolder
);

// Delete a folder
router.delete(
    "/:folderId",
    authMiddleware,
    deleteFolder
);

export default router;