const logger = require('../config/logger');
const ApiError = require('../utils/apiError');

function errorMiddleware(error, req, res, next) {
  void req;
  void next;

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired.',
      code: 'TOKEN_EXPIRED',
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is invalid.',
      code: 'INVALID_TOKEN',
    });
  }

  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this unique value already exists.',
      code: 'UNIQUE_CONSTRAINT_VIOLATION',
      details: error.detail,
    });
  }

  if (error.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'A referenced record does not exist.',
      code: 'FOREIGN_KEY_VIOLATION',
      details: error.detail,
    });
  }

  const normalizedError =
    error instanceof ApiError
      ? error
      : new ApiError(500, 'Internal server error.', 'INTERNAL_SERVER_ERROR');

  if (normalizedError.statusCode >= 500) {
    logger.error(normalizedError.message, error.stack ?? error.message);
  }

  return res.status(normalizedError.statusCode).json({
    success: false,
    message: normalizedError.message,
    code: normalizedError.code,
    ...(normalizedError.details ? { details: normalizedError.details } : {}),
  });
}

module.exports = errorMiddleware;
