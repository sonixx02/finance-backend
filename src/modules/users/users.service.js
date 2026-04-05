const bcrypt = require('bcryptjs');

const env = require('../../config/env');
const { withTransaction } = require('../../config/db');
const ApiError = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');
const iamService = require('../iam/iam.service');
const usersRepository = require('./users.repository');

function formatUser(row) {
  return {
    createdAt: row.created_at,
    email: row.email,
    fullName: row.full_name,
    publicId: row.public_id,
    roles: row.roles ?? [],
    status: {
      code: row.status_code,
      name: row.status_name,
    },
    tokenVersion: row.token_version,
    updatedAt: row.updated_at,
  };
}

async function createUser(payload, actor) {
  return withTransaction(async (client) => {
    const status = await usersRepository.findStatusByCode(payload.statusCode.toLowerCase(), client);

    if (!status) {
      throw ApiError.badRequest(`Unknown status code: ${payload.statusCode}.`);
    }

    const passwordHash = await bcrypt.hash(payload.password, env.bcryptRounds);
    const createdUser = await usersRepository.createUser(
      {
        email: payload.email.trim().toLowerCase(),
        fullName: payload.fullName.trim(),
        passwordHash,
        statusId: status.id,
      },
      client
    );

    const roles = await iamService.replaceUserRoles({
      userId: createdUser.id,
      roleCodes: payload.roleCodes,
      assignedBy: actor?.userId ?? null,
      bumpTokenVersion: false,
      client,
    });

    await iamService.writeAuditLog(
      {
        action: 'create',
        actorUserId: actor?.userId ?? null,
        entityId: createdUser.id,
        entityName: 'users',
        ipAddress: actor?.ipAddress ?? null,
        newValues: {
          email: createdUser.email,
          fullName: createdUser.full_name,
          publicId: createdUser.public_id,
          roleCodes: roles.map((role) => role.code),
          statusCode: status.code,
        },
        oldValues: null,
        userAgent: actor?.userAgent ?? null,
      },
      client
    );

    const hydratedUser = await usersRepository.getUserDetailsByPublicId(createdUser.public_id, client);
    return formatUser(hydratedUser);
  });
}

async function listUsers(filters) {
  const pagination = getPagination(filters, { defaultLimit: 20, maxLimit: 100 });
  const result = await usersRepository.listUsers(filters, pagination);

  return {
    items: result.rows.map(formatUser),
    pagination: {
      limit: pagination.limit,
      page: pagination.page,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pagination.limit)),
    },
  };
}

async function updateUserStatus(publicId, payload, actor) {
  return withTransaction(async (client) => {
    const user = await usersRepository.findUserByPublicId(publicId, client);

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const nextStatus = await usersRepository.findStatusByCode(payload.statusCode.toLowerCase(), client);

    if (!nextStatus) {
      throw ApiError.badRequest(`Unknown status code: ${payload.statusCode}.`);
    }

    const previousStatusCode = user.status_code;

    if (previousStatusCode !== nextStatus.code) {
      await usersRepository.updateUserStatus(user.id, nextStatus.id, client);
      await usersRepository.incrementTokenVersion(user.id, client);

      await iamService.writeAuditLog(
        {
          action: 'status_updated',
          actorUserId: actor.userId,
          entityId: user.id,
          entityName: 'users',
          ipAddress: actor.ipAddress,
          newValues: { statusCode: nextStatus.code },
          oldValues: { statusCode: previousStatusCode },
          userAgent: actor.userAgent,
        },
        client
      );
    }

    const hydratedUser = await usersRepository.getUserDetailsByPublicId(publicId, client);
    return formatUser(hydratedUser);
  });
}

async function updateUserRoles(publicId, payload, actor) {
  return withTransaction(async (client) => {
    const user = await usersRepository.getUserDetailsByPublicId(publicId, client);

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const previousRoleCodes = (user.roles ?? []).map((role) => role.code).sort();
    const nextRoles = await iamService.replaceUserRoles({
      userId: user.id,
      roleCodes: payload.roleCodes,
      assignedBy: actor.userId,
      bumpTokenVersion: true,
      client,
    });

    await iamService.writeAuditLog(
      {
        action: 'roles_updated',
        actorUserId: actor.userId,
        entityId: user.id,
        entityName: 'users',
        ipAddress: actor.ipAddress,
        newValues: { roleCodes: nextRoles.map((role) => role.code) },
        oldValues: { roleCodes: previousRoleCodes },
        userAgent: actor.userAgent,
      },
      client
    );

    const hydratedUser = await usersRepository.getUserDetailsByPublicId(publicId, client);
    return formatUser(hydratedUser);
  });
}

module.exports = {
  createUser,
  listUsers,
  updateUserRoles,
  updateUserStatus,
};
