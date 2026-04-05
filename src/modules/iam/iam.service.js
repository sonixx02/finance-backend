const ApiError = require('../../utils/apiError');

const iamRepository = require('./iam.repository');
const usersRepository = require('../users/users.repository');

function normalizeRoleCodes(roleCodes) {
  return [...new Set(roleCodes.map((code) => code.trim().toLowerCase()))];
}

function formatAccessContext(row) {
  return {
    email: row.email,
    fullName: row.full_name,
    id: row.id,
    permissions: row.permission_codes ?? [],
    publicId: row.public_id,
    roles: (row.role_codes ?? []).map((code) => ({ code })),
    status: {
      code: row.status_code,
      name: row.status_name,
    },
    tokenVersion: row.token_version,
  };
}

async function getUserAccessContextByPublicId(publicId, client) {
  const row = await iamRepository.findUserAccessContextByPublicId(publicId, client);

  if (!row) {
    throw ApiError.notFound('User not found.');
  }

  return formatAccessContext(row);
}

async function replaceUserRoles({ userId, roleCodes, assignedBy, bumpTokenVersion = true, client }) {
  const normalizedCodes = normalizeRoleCodes(roleCodes);
  const roles = await iamRepository.findRolesByCodes(normalizedCodes, client);

  if (roles.length !== normalizedCodes.length) {
    const foundCodes = new Set(roles.map((role) => role.code));
    const missingCodes = normalizedCodes.filter((code) => !foundCodes.has(code));
    throw ApiError.badRequest(`Unknown role code(s): ${missingCodes.join(', ')}.`);
  }

  await iamRepository.revokeUserRolesNotIn(
    userId,
    roles.map((role) => role.id),
    client
  );

  for (const role of roles) {
    await iamRepository.upsertUserRole(userId, role.id, assignedBy, client);
  }

  if (bumpTokenVersion) {
    await usersRepository.incrementTokenVersion(userId, client);
  }

  return roles.map((role) => ({ code: role.code, name: role.name }));
}

async function writeAuditLog(payload, client) {
  return iamRepository.insertAuditLog(payload, client);
}

module.exports = {
  getUserAccessContextByPublicId,
  replaceUserRoles,
  writeAuditLog,
};
