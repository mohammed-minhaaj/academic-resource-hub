/**
 * Higher-order utility function to wrap asynchronous route handlers
 * and catch unhandled promise rejections, passing them to next().
 *
 * @param {Function} fn - Asynchronous route handler or middleware
 * @returns {Function} Express middleware function
 */
const wrapAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = wrapAsync;
