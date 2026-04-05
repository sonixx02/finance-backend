const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const env = require('../../config/env');
const ApiError = require('../../utils/apiError');
const iamService = require('../iam/iam.service');
const authRepository = require('./auth.repository');

async function login(credentials) {
  const email = credentials.email.trim().toLowerCase();
  const user = await authRepository.findUserByEmailForLogin(email);

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (user.status_code !== 'active') {
    throw ApiError.forbidden('User account is not active.');
  }

  const passwordMatches = await bcrypt.compare(credentials.password, user.password_hash);

  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const session = await iamService.getUserAccessContextByPublicId(user.public_id);
  const accessToken = jwt.sign(
    {
      sub: session.publicId,
      tokenVersion: session.tokenVersion,
      roles: session.roles.map((role) => role.code),
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    accessToken,
    expiresIn: env.jwtExpiresIn,
    user: {
      email: session.email,
      fullName: session.fullName,
      permissions: session.permissions,
      publicId: session.publicId,
      roles: session.roles,
      status: session.status,
    },
  };
}

async function getSessionContext(publicId) {
  return iamService.getUserAccessContextByPublicId(publicId);
}

module.exports = {
  getSessionContext,
  login,
};

