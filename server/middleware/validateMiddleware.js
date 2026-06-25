const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware to check express-validator results
 * Call this AFTER your validation rules in the route
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field:   err.path || err.param,
      message: err.msg,
    }));

    return ApiResponse.error(res, 400, 'Validation failed', formattedErrors);
  }

  next();
};

module.exports = validate;