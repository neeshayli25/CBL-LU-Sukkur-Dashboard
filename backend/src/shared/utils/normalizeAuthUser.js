'use strict';

/**
 * Normalize a Sequelize User (with role/permissions/employeeProfile)
 * into the shape expected by the frontend authClient / useAuth hook.
 *
 * {
 *   id, name, email, firstName, lastName,
 *   role, roles: string[], permissions: string[],
 *   department_id, plant_id, departmentId, plantId
 * }
 */
function normalizeAuthUser(user) {
  if (!user) return null;

  const plain = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  const role = plain.role || null;
  const roleName = role?.name || role?.displayName || null;
  const permissions = Array.isArray(role?.permissions)
    ? role.permissions.map((p) => p.key).filter(Boolean)
    : [];

  const employee = plain.employeeProfile || plain.employee || null;
  const departmentId = employee?.departmentId || employee?.department_id || null;
  const plantId = employee?.plantId || employee?.plant_id || null;

  const firstName = plain.firstName || plain.first_name || '';
  const lastName = plain.lastName || plain.last_name || '';
  const name = [firstName, lastName].filter(Boolean).join(' ').trim() || plain.email;

  return {
    id: String(plain.id),
    email: plain.email,
    name,
    firstName,
    lastName,
    role: roleName,
    roles: roleName ? [roleName] : [],
    permissions,
    department_id: departmentId != null ? String(departmentId) : null,
    plant_id: plantId != null ? String(plantId) : null,
    departmentId: departmentId != null ? String(departmentId) : null,
    plantId: plantId != null ? String(plantId) : null,
    status: plain.status,
    isEmailVerified: plain.isEmailVerified,
  };
}

module.exports = { normalizeAuthUser };
