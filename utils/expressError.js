/**
 * Custom Error class for handling operational HTTP errors.
 * Extends the native JavaScript Error class with an HTTP status code.
 */
class ExpressError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ExpressError;
