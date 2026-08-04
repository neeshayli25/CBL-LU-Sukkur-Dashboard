'use strict';

const { ROLES } = require('../../shared/constants/roles');

/**
 * Assign permissions to system roles.
 * - super_admin / admin → all permissions
 * - manager → view + manage HSE + user view
 * - user → basic view / report permissions
 *
 * Idempotent: clears existing role_permissions for these roles, then re-inserts.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const sequelize = queryInterface.sequelize;

    const [roles] = await sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('${ROLES.SUPER_ADMIN}', '${ROLES.ADMIN}', '${ROLES.MANAGER}', '${ROLES.USER}')`,
    );
    const [permissions] = await sequelize.query('SELECT id, `key` FROM permissions');

    if (!roles.length || !permissions.length) {
      throw new Error('Roles or permissions missing. Run 01-roles and 02-permissions seeders first.');
    }

    const byName = Object.fromEntries(roles.map((r) => [r.name, r.id]));
    const allPermIds = permissions.map((p) => p.id);

    const managerKeys = new Set([
      'user:view',
      'user:read',
      'notification:view',
      'plant:view',
      'department:view',
      'employee:view',
      'hazard:view',
      'hazard:create',
      'hazard:manage',
      'near_miss:view',
      'near_miss:create',
      'incident:view',
      'incident:create',
      'incident:manage',
      'training:view',
      'training:manage',
      'hse_audit:view',
      'inspection:view',
      'corrective_action:view',
      'corrective_action:create',
      'attachment:view',
      'attachment:create',
      'dashboard:view',
      'report:view',
      'report:export',
      'hse:manage_plants',
      'hse:view_dashboard',
      'hse:manage_incidents',
      'hse:view_reports',
      'hse:report_hazard',
      'hse:manage_audits',
      'hse:report_incident',
      'hse:manage_inspections',
      'hse:manage_training',
    ]);

    const userKeys = new Set([
      'notification:view',
      'hazard:view',
      'hazard:create',
      'near_miss:view',
      'near_miss:create',
      'incident:view',
      'incident:create',
      'training:view',
      'dashboard:view',
      'hse:view_dashboard',
      'hse:view_reports',
      'hse:report_hazard',
      'hse:report_incident',
      'attachment:view',
      'attachment:create',
    ]);

    const rolePermMap = {
      [ROLES.SUPER_ADMIN]: allPermIds,
      [ROLES.ADMIN]: allPermIds,
      [ROLES.MANAGER]: permissions.filter((p) => managerKeys.has(p.key)).map((p) => p.id),
      [ROLES.USER]: permissions.filter((p) => userKeys.has(p.key)).map((p) => p.id),
    };

    const roleIds = Object.values(byName);
    if (roleIds.length) {
      await sequelize.query(
        `DELETE FROM role_permissions WHERE role_id IN (${roleIds.map((id) => `'${id}'`).join(',')})`,
      );
    }

    const rows = [];
    for (const [roleName, permIds] of Object.entries(rolePermMap)) {
      const roleId = byName[roleName];
      if (!roleId) continue;
      for (const permissionId of permIds) {
        rows.push({
          role_id: roleId,
          permission_id: permissionId,
          created_at: now,
          updated_at: now,
        });
      }
    }

    if (rows.length) {
      await queryInterface.bulkInsert('role_permissions', rows);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('role_permissions', null, {});
  },
};
