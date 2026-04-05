const ApiError = require('../utils/apiError');

function requirePermission(permissionCode) {
  return (req, res, next) => {
    void res;

    if (!req.auth) {
      return next(ApiError.unauthorized('Authentication is required.'));
    }

    if (!req.auth.permissions.includes(permissionCode)) {
      return next(ApiError.forbidden(`Missing required permission: ${permissionCode}.`));
    }

    return next();
  };
}

module.exports = requirePermission;
