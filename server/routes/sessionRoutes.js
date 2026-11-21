import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    getLoginHistory,
    getActiveSessions,
    revokeSession,
    revokeAllOtherSessions
} from "../controllers/sessionController.js";

const router = express.Router();

// Get login history
router.get(
    "/history",
    authMiddleware,
    getLoginHistory
);

// Get active sessions
router.get(
    "/active",
    authMiddleware,
    getActiveSessions
);

// Revoke all other sessions
router.delete(
    "/revoke-others",
    authMiddleware,
    revokeAllOtherSessions
);

// Revoke individual session
router.delete(
    "/:sessionId",
    authMiddleware,
    revokeSession
);

export default router;