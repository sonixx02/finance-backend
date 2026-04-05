const ApiError = require('../utils/apiError');

function notFoundMiddleware(req, res, next) {
  void req;
  void res;
  next(ApiError.notFound('Route not found.'));
}

module.exports = notFoundMiddleware;
