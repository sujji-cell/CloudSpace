import multer from "multer";

// Store uploaded files temporarily in memory
const storage = multer.memoryStorage();

// Configure Multer
const upload = multer({
    storage: storage,

    // Maximum file size: 10 MB
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

export default upload;