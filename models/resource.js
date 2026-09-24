const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Resource title is required"],
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
        },
        description: {
            type: String,
            required: [true, "Resource description is required"],
            trim: true,
        },
        subject: {
            type: String,
            required: [true, "Subject name is required"],
            trim: true,
        },
        resourceType: {
            type: String,
            required: [true, "Resource type is required"],
            enum: {
                values: [
                    "NOTES",
                    "PYQ",
                    "SYLLABUS",
                    "ASSIGNMENT",
                    "LAB_MANUAL",
                    "REFERENCE_BOOK",
                    "OTHER",
                ],
                message: "{VALUE} is not a supported resource type",
            },
            uppercase: true,
            trim: true,
        },
        branch: {
            type: String,
            required: [true, "Branch is required"],
            trim: true,
            uppercase: true,
        },
        uploader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Uploader user reference is required"],
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
            uppercase: true,
        },
        fileUrl: {
            type: String,
            required: [true, "Resource file URL is required"],
            trim: true,
        },
        // Optional metadata for cloud storage management
        fileKey: {
            type: String,
            trim: true,
        },
        fileSize: {
            type: Number,
        },
        mimeType: {
            type: String,
        },
        semester: {
            type: Number,
            min: 1,
            max: 8,
        },
        reportCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for high-performance querying and filtering
resourceSchema.index({ branch: 1, subject: 1, resourceType: 1 });
resourceSchema.index({ status: 1 });
resourceSchema.index({ uploader: 1 });
resourceSchema.index({ reportCount: -1 });

module.exports = mongoose.model("Resource", resourceSchema);
