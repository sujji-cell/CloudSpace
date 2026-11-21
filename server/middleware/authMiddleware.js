import jwt from "jsonwebtoken";
import Session from "../models/Session.js";

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Get token from cookies
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login first."
            });
        }

        // 2. Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.sessionId) {
            return res.status(401).json({
                success: false,
                message: "Invalid session. Please login again."
            });
        }

        // 3. Atomically validate session and update activity
        const session = await Session.findOneAndUpdate(
            {
                userId: decoded.userId,
                sessionId: decoded.sessionId,
                isRevoked: false,
                expiresAt: { $gt: new Date() }
            },
            {
                $set: {
                    lastActiveAt: new Date()
                }
            },
            {
                new: true
            }
        );

        // 4. Reject expired or revoked sessions
        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session expired or revoked. Please login again."
            });
        }

        // 5. Attach authenticated user and session
        req.userId = decoded.userId;
        req.sessionId = decoded.sessionId;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please login again."
        });
    }
};

export default authMiddleware;