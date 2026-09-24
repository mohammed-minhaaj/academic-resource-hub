const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const fs = require("fs");

/**
 * Configure AWS S3 Client.
 * Configured for compatibility with local S3-compatible storage (e.g. MinIO)
 * as well as production AWS S3.
 */
const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT || "http://localhost:9000",
    forcePathStyle: true, // Crucial for MinIO and local S3 emulation
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "minioadmin",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "minioadmin",
    },
});

/**
 * Allowed MIME types for academic resource uploads
 */
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
    "image/jpeg",
    "image/png",
];

/**
 * File filter to ensure only safe academic documents are uploaded
 */
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, ZIP, JPG, and PNG files are allowed."
            ),
            false
        );
    }
};

/**
 * Determine storage engine:
 * If STORAGE_TYPE is 's3', use multer-s3 (requires MinIO or AWS S3).
 * Otherwise, default to local disk storage ('local') for frictionless development.
 */
const isS3Storage = process.env.STORAGE_TYPE === "s3";

let storageEngine;

if (isS3Storage) {
    storageEngine = multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME || "academic-resources",
        acl: "public-read",
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname,
                originalName: file.originalname,
            });
        },
        key: function (req, file, cb) {
            const fileExtension = path.extname(file.originalname);
            const sanitizedBaseName = path
                .basename(file.originalname, fileExtension)
                .replace(/[^a-zA-Z0-9]/g, "_")
                .toLowerCase();
            const uniqueFilename = `resources/${Date.now()}-${sanitizedBaseName}${fileExtension}`;
            cb(null, uniqueFilename);
        },
    });
} else {
    // Local disk storage inside public/uploads/resources
    const uploadDir = path.join(__dirname, "../public/uploads/resources");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storageEngine = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const fileExtension = path.extname(file.originalname);
            const sanitizedBaseName = path
                .basename(file.originalname, fileExtension)
                .replace(/[^a-zA-Z0-9]/g, "_")
                .toLowerCase();
            const uniqueFilename = `${Date.now()}-${sanitizedBaseName}${fileExtension}`;
            cb(null, uniqueFilename);
        },
    });
}

const rawUpload = multer({
    storage: storageEngine,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file limit
    },
});

/**
 * Normalizes req.file across local disk storage and Multer-S3 so that
 * req.file.location and req.file.key are always defined.
 */
const upload = {
    single: (fieldName) => {
        const middleware = rawUpload.single(fieldName);
        return (req, res, next) => {
            middleware(req, res, (err) => {
                if (err) return next(err);
                if (req.file && !req.file.location) {
                    req.file.location = `/uploads/resources/${req.file.filename}`;
                    req.file.key = req.file.filename;
                }
                next();
            });
        };
    },
    array: (fieldName, maxCount) => rawUpload.array(fieldName, maxCount),
};

module.exports = {
    s3,
    upload,
};
