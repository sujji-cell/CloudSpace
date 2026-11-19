import express from "express";

import {
    addFavorite,
    getFavorites,
    removeFavorite
} from "../controllers/favoriteController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all favourites
router.get(
    "/",
    authMiddleware,
    getFavorites
);

// Add a file to favourites
router.post(
    "/:fileId",
    authMiddleware,
    addFavorite
);

// Remove a file from favourites
router.delete(
    "/:fileId",
    authMiddleware,
    removeFavorite
);

export default router;