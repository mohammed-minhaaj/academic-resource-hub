const jwt = require("jsonwebtoken");
const Resource = require("./models/resource");
const ExpressError = require("./utils/expressError");
const { resourceSchema, nestedResourceSchema } = require("./schema");

/**
 * Middleware: isLoggedIn
 * Verifies the JWT from the HTTP-only cookie and assigns
 * the decoded payload to req.user and res.locals.currUser.
 */
const isLoggedIn = (req, res, next) => {
    const token = req.cookies && req.cookies.token;

    if (!token) {
        req.session.returnTo = req.originalUrl;
        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "academic_jwt_secret_default"
        );
        req.user = decoded;
        res.locals.currUser = decoded;
        next();
    } catch (err) {
        res.clearCookie("token");
        req.flash("error", "Session expired or invalid. Please sign in again.");
        return res.redirect("/login");
    }
};

/**
 * Middleware: isOwner
 * Checks if req.user._id matches the resource's uploader ID.
 * If not, triggers req.flash('error', 'You are not authorized') and redirects.
 */
const isOwner = async (req, res, next) => {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
        req.flash("error", "Resource not found.");
        return res.redirect("/resources");
    }

    const uploaderId = resource.uploader._id
        ? resource.uploader._id.toString()
        : resource.uploader.toString();
    const currentUserId = req.user && req.user._id ? req.user._id.toString() : "";

    if (uploaderId !== currentUserId) {
        req.flash("error", "You are not authorized");
        return res.redirect(`/resources/${id}`);
    }

    // Attach resource to res.locals for potential downstream controller use
    res.locals.resource = resource;
    next();
};

/**
 * Middleware: isAdmin
 * Ensures req.user exists and has role === 'ADMIN'.
 */
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "ADMIN") {
        req.flash("error", "Access denied. Administrator privileges required.");
        return res.redirect("/resources");
    }
    next();
};

/**
 * Middleware: validateResource
 * Passes req.body through the Joi schema from schema.js.
 * If validation fails, throws an ExpressError.
 */
const validateResource = (req, res, next) => {
    // If a file was uploaded through Multer-S3, populate fileUrl from req.file.location
    if (req.file && req.file.location) {
        if (req.body.resource && typeof req.body.resource === "object") {
            req.body.resource.fileUrl = req.file.location;
            req.body.resource.fileKey = req.file.key;
        } else {
            req.body.fileUrl = req.file.location;
            req.body.fileKey = req.file.key;
        }
    }

    // Set branch from authenticated user's branch if not supplied in body
    if (req.user && req.user.branch) {
        if (req.body.resource && typeof req.body.resource === "object") {
            if (!req.body.resource.branch) {
                req.body.resource.branch = req.user.branch;
            }
        } else {
            if (!req.body.branch) {
                req.body.branch = req.user.branch;
            }
        }
    }

    const schemaToValidate = req.body.resource ? nestedResourceSchema : resourceSchema;
    const { error } = schemaToValidate.validate(req.body);

    if (error) {
        const errorMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, errorMsg);
    }

    next();
};

module.exports = {
    isLoggedIn,
    isOwner,
    isAdmin,
    validateResource,
};
