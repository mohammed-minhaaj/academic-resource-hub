const fs = require("fs");
const path = require("path");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const Resource = require("../models/resource");
const User = require("../models/user");
const { s3 } = require("../utils/s3Config");

/**
 * Discovery: Fetch 'APPROVED' resources matching req.user.branch.
 * Resources uploaded by Admins or marked as 'ALL'/'ADMIN' are accessible to all branches.
 */
module.exports.index = async (req, res) => {
    // Admins view all resources across all branches by default.
    // Regular students default to their specific department branch.
    const isAdmin = req.user && req.user.role === "ADMIN";
    const userBranch = (!isAdmin && req.user) ? req.user.branch : null;
    const filterBranch = req.query.branch || userBranch;

    const query = { status: "APPROVED" };

    if (filterBranch && filterBranch.toUpperCase() !== "ALL") {
        // Collect all admin IDs so files uploaded by admins are accessible to all departments
        const adminUsers = await User.find({ role: "ADMIN" }).select("_id");
        const adminIds = adminUsers.map((u) => u._id);

        query.$or = [
            { branch: filterBranch.toUpperCase() },
            { branch: "ALL" },
            { branch: "ADMIN" },
            { uploader: { $in: adminIds } },
        ];
    }

    if (req.query.subject) {
        query.subject = new RegExp(req.query.subject.trim(), "i");
    }

    if (req.query.resourceType) {
        query.resourceType = req.query.resourceType.toUpperCase();
    }

    const resources = await Resource.find(query)
        .populate("uploader", "email role branch")
        .sort({ createdAt: -1 });

    res.render("resources/index", {
        resources,
        currentBranch: filterBranch,
        searchQuery: req.query.subject || "",
        selectedType: req.query.resourceType || "",
    });
};

/**
 * Manage Own Resources: Fetch all resources uploaded by the authenticated user.
 */
module.exports.myResources = async (req, res) => {
    const resources = await Resource.find({ uploader: req.user._id })
        .populate("uploader", "email role branch")
        .sort({ createdAt: -1 });

    res.render("resources/myResources", { resources });
};

/**
 * Render the form to upload a new resource
 */
module.exports.renderNewForm = (req, res) => {
    res.render("resources/new");
};

/**
 * Create a new resource with Multer S3 file upload.
 * Sets the resource's branch to req.user.branch and status to PENDING.
 */
module.exports.createResource = async (req, res) => {
    if (!req.file || !req.file.location) {
        req.flash("error", "A file must be attached when uploading a resource.");
        return res.redirect("/resources/new");
    }

    const payload = req.body.resource || req.body;
    const isAdmin = req.user && req.user.role === "ADMIN";

    // If uploaded by an Admin: default to "ALL" (accessible to all departments)
    // Regular student: locked to their own department branch
    let targetBranch;
    if (isAdmin) {
        targetBranch = (payload.branch && payload.branch.trim()) ? payload.branch.trim().toUpperCase() : "ALL";
    } else {
        targetBranch = req.user.branch || payload.branch;
    }

    const newResource = new Resource({
        title: payload.title,
        description: payload.description,
        subject: payload.subject,
        resourceType: payload.resourceType.toUpperCase(),
        branch: targetBranch,
        uploader: req.user._id,
        status: isAdmin ? "APPROVED" : "PENDING", // Admin uploads are auto-approved
        fileUrl: req.file.location,
        fileKey: req.file.key,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        semester: payload.semester ? parseInt(payload.semester, 10) : undefined,
    });

    await newResource.save();

    req.flash("success", "Resource uploaded successfully!");
    res.redirect(`/resources/${newResource._id}`);
};

/**
 * Show a single resource's details
 */
module.exports.showResource = async (req, res) => {
    const { id } = req.params;
    const resource = await Resource.findById(id).populate(
        "uploader",
        "email role branch"
    );

    if (!resource) {
        req.flash("error", "Cannot find that resource.");
        return res.redirect("/resources");
    }

    res.render("resources/show", { resource });
};

/**
 * Render the form to edit an existing resource
 */
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
        req.flash("error", "Cannot find that resource.");
        return res.redirect("/resources");
    }

    res.render("resources/edit", { resource });
};

/**
 * Update an existing resource (PUT route protected by isOwner)
 */
module.exports.updateResource = async (req, res) => {
    const { id } = req.params;
    const payload = req.body.resource || req.body;

    const existingResource = await Resource.findById(id);
    if (!existingResource) {
        req.flash("error", "Resource not found.");
        return res.redirect("/resources");
    }

    const updateData = {
        title: payload.title,
        description: payload.description,
        subject: payload.subject,
        resourceType: payload.resourceType.toUpperCase(),
        semester: payload.semester ? parseInt(payload.semester, 10) : undefined,
    };

    // If a new file is uploaded, replace the file and remove the old S3 object
    if (req.file && req.file.location) {
        if (existingResource.fileKey) {
            if (process.env.STORAGE_TYPE !== "s3") {
                const localPath = path.join(__dirname, "../public/uploads/resources", existingResource.fileKey);
                if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
            } else {
                try {
                    await s3.send(
                        new DeleteObjectCommand({
                            Bucket: process.env.AWS_BUCKET_NAME || "academic-resources",
                            Key: existingResource.fileKey,
                        })
                    );
                } catch (s3Err) {
                    console.error("Warning: Failed to delete old file from S3:", s3Err);
                }
            }
        }
        updateData.fileUrl = req.file.location;
        updateData.fileKey = req.file.key;
        updateData.fileSize = req.file.size;
        updateData.mimeType = req.file.mimetype;
    }

    await Resource.findByIdAndUpdate(id, updateData, { runValidators: true });

    req.flash("success", "Resource updated successfully!");
    res.redirect(`/resources/${id}`);
};

/**
 * Delete a resource (DELETE route protected by isOwner)
 */
module.exports.deleteResource = async (req, res) => {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
        req.flash("error", "Resource not found.");
        return res.redirect("/resources");
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

    req.flash("success", "Resource deleted successfully!");
    res.redirect("/resources");
};

/**
 * Report a resource: Increment reportCount on the resource
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

