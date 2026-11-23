const errorMiddleware = (err, req, res, next) => {
    console.error("Server Error:", err);

    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: statusCode === 500
            ? "Internal server error. Please try again later."
            : err.message
    });
};

export default errorMiddleware;