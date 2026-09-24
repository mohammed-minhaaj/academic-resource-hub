const Joi = require("joi");

/**
 * Strict Joi validation schema for Resource creation and updates.
 * Ensures all required fields are provided and non-empty.
 */
const resourceSchema = Joi.object({
    title: Joi.string().trim().min(3).max(150).required().messages({
        "string.base": "Title must be a text value.",
        "string.empty": "Title is required and cannot be empty.",
        "string.min": "Title must be at least {#limit} characters long.",
        "string.max": "Title cannot exceed {#limit} characters.",
        "any.required": "Title is a required field.",
    }),
    description: Joi.string().trim().min(10).max(3000).required().messages({
        "string.base": "Description must be a text value.",
        "string.empty": "Description is required and cannot be empty.",
        "string.min": "Description must be at least {#limit} characters long.",
        "string.max": "Description cannot exceed {#limit} characters.",
        "any.required": "Description is a required field.",
    }),
    subject: Joi.string().trim().min(2).max(100).required().messages({
        "string.base": "Subject must be a text value.",
        "string.empty": "Subject is required and cannot be empty.",
        "string.min": "Subject must be at least {#limit} characters long.",
        "string.max": "Subject cannot exceed {#limit} characters.",
        "any.required": "Subject is a required field.",
    }),
    resourceType: Joi.string()
        .trim()
        .uppercase()
        .valid(
            "NOTES",
            "PYQ",
            "SYLLABUS",
            "ASSIGNMENT",
            "LAB_MANUAL",
            "REFERENCE_BOOK",
            "OTHER"
        )
        .required()
        .messages({
            "any.only":
                "Resource type must be one of: NOTES, PYQ, SYLLABUS, ASSIGNMENT, LAB_MANUAL, REFERENCE_BOOK, OTHER.",
            "string.empty": "Resource type cannot be empty.",
            "any.required": "Resource type is a required field.",
        }),
    branch: Joi.string()
        .trim()
        .uppercase()
        .min(2)
        .max(10)
        .required()
        .messages({
            "string.base": "Branch must be a text value.",
            "string.empty": "Branch cannot be empty.",
            "string.min": "Branch must be at least {#limit} characters long.",
            "any.required": "Branch is a required field.",
        }),
    semester: Joi.number().integer().min(1).max(8).optional().messages({
        "number.base": "Semester must be a valid number.",
        "number.min": "Semester must be between 1 and 8.",
        "number.max": "Semester must be between 1 and 8.",
    }),
    fileUrl: Joi.string()
        .uri({ allowRelative: true })
        .optional()
        .allow("", null)
        .messages({
            "string.uri": "File URL must be a valid web URL or file path.",
        }),
    fileKey: Joi.string().optional().allow("", null),
    fileSize: Joi.number().optional(),
    mimeType: Joi.string().optional().allow("", null),
    status: Joi.string()
        .trim()
        .uppercase()
        .valid("PENDING", "APPROVED", "REJECTED")
        .default("PENDING")
        .optional(),
}).unknown(true);

/**
 * Nested schema to support standard form submissions structured as `resource[field]`
 */
const nestedResourceSchema = Joi.object({
    resource: resourceSchema.required().messages({
        "any.required": "Resource payload is required.",
    }),
}).unknown(true);

module.exports = {
    resourceSchema,
    nestedResourceSchema,
};
