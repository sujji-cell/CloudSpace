import multer from "multer";

const uploadErrorMiddleware = (err, req, res, next) => {

    // File size or other Multer errors
    if (err instanceof multer.MulterError) {

        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File size exceeds the maximum allowed limit of 10 MB."
            });
        }

        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Unsupported file type
    if (err.message === "This file type is not supported.") {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Pass other errors to the next error handler
    next(err);
};

export default uploadErrorMiddleware;