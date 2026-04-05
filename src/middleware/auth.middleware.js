const jwt = require('jsonwebtoken');

const env = require('../config/env');
const authService = require('../modules/auth/auth.service');
const ApiError = require('../utils/apiError');

async function authMiddleware(req, res, next) {
  void res;

  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return next(ApiError.unauthorized('Authorization header is required.'));
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(ApiError.unauthorized('Bearer token is required.'));
    }

    const payload = jwt.verify(token, env.jwtSecret);

    if (!payload.sub || typeof payload.tokenVersion !== 'number') {
      return next(ApiError.unauthorized('Authentication token is malformed.'));
    }

    const session = await authService.getSessionContext(payload.sub);

    if (session.status.code !== 'active') {
      return next(ApiError.forbidden('User account is not active.'));
    }

    if (session.tokenVersion !== payload.tokenVersion) {
      return next(ApiError.unauthorized('Authentication token is no longer valid.'));
    }

    req.auth = {
      email: session.email,
      fullName: session.fullName,
      permissions: session.permissions,
      publicId: session.publicId,
      roles: session.roles,
      status: session.status.code,
      tokenVersion: session.tokenVersion,
      userId: session.id,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authMiddleware;
