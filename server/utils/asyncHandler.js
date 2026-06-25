/**
 * Async handler wrapper to avoid try-catch in every controller
 * Wraps async route handlers and passes errors to Express error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;