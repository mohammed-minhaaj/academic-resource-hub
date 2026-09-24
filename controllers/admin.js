const fs = require("fs");
const path = require("path");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const Resource = require("../models/resource");
const { s3 } = require("../utils/s3Config");

/**
 * Admin Dashboard:
 * Fetches all resources across all branches and statuses.
 * Provides moderation filters (status, branch, reported) and statistics.
 */
module.exports.dashboard = async (req, res) => {
    const { status, branch, reported } = req.query;

    const filter = {};
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status.toUpperCase())) {
        filter.status = status.toUpperCase();
    }
    if (branch) {
        filter.branch = branch.toUpperCase();
    }
    if (reported === "true") {
        filter.reportCount = { $gt: 0 };
    }

    const resources = await Resource.find(filter)
        .populate("uploader", "email role branch")
        .sort({ reportCount: -1, createdAt: -1 });

    // Aggregate status statistics for admin KPI summary
    const [totalCount, pendingCount, approvedCount, rejectedCount, reportedCount] =
        await Promise.all([
            Resource.countDocuments(),
            Resource.countDocuments({ status: "PENDING" }),
            Resource.countDocuments({ status: "APPROVED" }),
            Resource.countDocuments({ status: "REJECTED" }),
            Resource.countDocuments({ reportCount: { $gt: 0 } }),
        ]);

    res.render("admin/dashboard", {
        resources,
        filterStatus: status || "ALL",
        filterBranch: branch || "",
        filterReported: reported === "true",
        stats: {
            total: totalCount,
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            reported: reportedCount,
        },
    });
};

/**
 * Moderate:
 * PATCH route to change a resource's status to 'APPROVED' or 'REJECTED'.
 * Triggers req.flash('success', 'Resource status updated')
 */
module.exports.moderateResource = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["APPROVED", "REJECTED", "PENDING"].includes(status.toUpperCase())) {
        req.flash("error", "Invalid moderation status provided.");
        return res.redirect("/admin/dashboard");
    }

    const resource = await Resource.findByIdAndUpdate(
        id,
        { status: status.toUpperCase() },
        { runValidators: true, new: true }
    );

    if (!resource) {
        req.flash("error", "Resource not found.");
        return res.redirect("/admin/dashboard");
    }

    req.flash("success", "Resource status updated");
    res.redirect("/admin/dashboard");
};

/**
 * Delete:
 * Admin DELETE route to remove inappropriate resources.
 * Deletes from S3 cloud storage and removes database record.
 */
module.exports.deleteResource = async (req, res) => {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
        req.flash("error", "Resource not found.");
        return res.redirect("/admin/dashboard");
    }

    // Clean up file from local disk or S3
    if (resource.fileKey) {
        if (process.env.STORAGE_TYPE !== "s3") {
            const localPath = path.join(__dirname, "../public/uploads/resources", resource.fileKey);
            if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        } else {
            try {
                await s3.send(
                    new DeleteObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME || "academic-resources",
                        Key: resource.fileKey,
                    })
                );
            } catch (s3Err) {
                console.error("Warning: Failed to delete file from S3:", s3Err);
            }
        }
    }

    await Resource.findByIdAndDelete(id);

    req.flash("success", "Resource removed successfully.");
    res.redirect("/admin/dashboard");
};

/**
 * Reporting:
 * POST route accessible by regular users to increment reportCount.
 * Triggers req.flash('success', 'Resource reported to admins')
 */
module.exports.reportResource = async (req, res) => {
    const { id } = req.params;
    const resource = await Resource.findByIdAndUpdate(
        id,
        { $inc: { reportCount: 1 } },
        { new: true }
    );

    if (!resource) {
        req.flash("error", "Resource not found.");
        return res.redirect("/resources");
    }

    req.flash("success", "Resource reported to admins");
    res.redirect(`/resources/${id}`);
};
