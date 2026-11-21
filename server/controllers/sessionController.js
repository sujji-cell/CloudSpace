import LoginActivity from "../models/LoginActivity.js";
import Session from "../models/Session.js";
// ============================================
// 1. GET LOGIN HISTORY
// ============================================

export const getLoginHistory = async (req, res) => {
    try {
        const userId = req.userId;

        // Get pagination parameters
        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const skip = (page - 1) * limit;

        // Fetch login activities
        const activities = await LoginActivity.find({
            userId
        })
            .select(
                "sessionId event ipAddress device browser operatingSystem details createdAt"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Count total activities
        const totalActivities = await LoginActivity.countDocuments({
            userId
        });

        return res.status(200).json({
            success: true,
            message: "Login history fetched successfully.",

            activities,

            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalActivities / limit),
                totalActivities,
                limit,
                hasNextPage: page * limit < totalActivities,
                hasPreviousPage: page > 1
            }
        });

    } catch (error) {
        console.error("Get login history error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch login history."
        });
    }
};


// ============================================
// 2. GET ACTIVE SESSIONS
// ============================================

export const getActiveSessions = async (req, res) => {
    try {
        const userId = req.userId;

        // Find all active, non-expired sessions
        const sessions = await Session.find({
            userId,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        })
            .select(
                "sessionId userAgent ipAddress device browser operatingSystem lastActiveAt createdAt expiresAt"
            )
            .sort({ lastActiveAt: -1 })
            .lean();

        // Identify the current session
        const activeSessions = sessions.map((session) => ({
            ...session,
            isCurrent: session.sessionId === req.sessionId
        }));

        return res.status(200).json({
            success: true,
            message: "Active sessions fetched successfully.",
            sessions: activeSessions,
            totalSessions: activeSessions.length
        });

    } catch (error) {
        console.error("Get active sessions error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch active sessions."
        });
    }
};

// ============================================
// 3. REVOKE INDIVIDUAL SESSION
// ============================================

export const revokeSession = async (req, res) => {
    try {
        const userId = req.userId;
        const { sessionId } = req.params;

        // 1. Atomically revoke the selected active session
        const session = await Session.findOneAndUpdate(
            {
                userId,
                sessionId,
                isRevoked: false,
                expiresAt: { $gt: new Date() }
            },
            {
                $set: {
                    isRevoked: true,
                    revokedAt: new Date()
                }
            },
            {
                returnDocument: "after"
            }
        );

        // 2. Check whether the session was found and revoked
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Active session not found."
            });
        }

        // 3. Record the revocation in login history
        await LoginActivity.create({
            userId,
            sessionId,
            event: "session_revoked",
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            device: session.device,
            browser: session.browser,
            operatingSystem: session.operatingSystem,
            details: "Session revoked by the account owner."
        });

        // 4. Clear cookie if the current session was revoked
        if (sessionId === req.sessionId) {
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Session revoked successfully."
        });

    } catch (error) {
        console.error("Revoke session error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to revoke session."
        });
    }
};
// ============================================
// 4. REVOKE ALL OTHER SESSIONS
// ============================================

export const revokeAllOtherSessions = async (req, res) => {
    try {
        const userId = req.userId;
        const currentSessionId = req.sessionId;

        // Find all other active sessions
        const otherSessions = await Session.find({
            userId,
            sessionId: { $ne: currentSessionId },
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        });

        if (otherSessions.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No other active sessions found.",
                revokedCount: 0
            });
        }

        // Revoke all other sessions
        await Session.updateMany(
            {
                userId,
                sessionId: { $ne: currentSessionId },
                isRevoked: false,
                expiresAt: { $gt: new Date() }
            },
            {
                $set: {
                    isRevoked: true,
                    revokedAt: new Date()
                }
            }
        );

        // Record revocation activity for each session
        const activities = otherSessions.map((session) => ({
            userId,
            sessionId: session.sessionId,
            event: "session_revoked",
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            device: session.device,
            browser: session.browser,
            operatingSystem: session.operatingSystem,
            details: "Session revoked using log out from all other devices."
        }));

        await LoginActivity.insertMany(activities);

        return res.status(200).json({
            success: true,
            message: "All other sessions have been revoked successfully.",
            revokedCount: otherSessions.length
        });

    } catch (error) {
        console.error("Revoke all other sessions error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to revoke other sessions."
        });
    }
};