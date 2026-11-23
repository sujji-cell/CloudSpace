import jwt from "jsonwebtoken";
import Session from "../models/Session.js";

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Get token from cookies
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login first."
            });
        }

        // 2. Check JWT configuration
        if (!process.env.JWT_SECRET) {
            return next(new Error("JWT_SECRET is not configured."));
        }

        // 3. Verify JWT
        let decoded;

        try {
            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.name === "TokenExpiredError"
                    ? "Token expired. Please login again."
                    : "Invalid token. Please login again."
            });
        }

        if (!decoded.userId || !decoded.sessionId) {
            return res.status(401).json({
                success: false,
                message: "Invalid session. Please login again."
            });
        }

        // 4. Atomically validate session and update activity
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
                returnDocument: "after"
            }
        );

        // 5. Reject expired or revoked sessions
        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session expired or revoked. Please login again."
            });
        }

        // 6. Attach authenticated user and session
        req.userId = decoded.userId;
        req.sessionId = decoded.sessionId;

        next();

    } catch (error) {
        // Pass unexpected errors to global error middleware
        next(error);
    }
};

export default authMiddleware;