import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {
        // Get token from cookies
        const token = req.cookies.token;

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login first."
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store user ID in request
        req.userId = decoded.userId;

        // Continue to next middleware or controller
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please login again."
        });
    }
};

export default authMiddleware;