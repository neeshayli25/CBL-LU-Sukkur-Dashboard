'use strict';

/**
 * Add or update a user for Microsoft SSO.
 * Email must match the Microsoft account User Principal Name exactly.
 *
 * Usage:
 *   node scripts/add-sso-user.js you@yourcompany.com
 *   node scripts/add-sso-user.js you@yourcompany.com "First" "Last" super_admin
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  const firstName = process.argv[3] || 'User';
  const lastName = process.argv[4] || 'SSO';
  const roleName = process.argv[5] || 'super_admin';

  if (!email || !email.includes('@')) {
    console.error('Usage: node scripts/add-sso-user.js <microsoft-email> [first] [last] [role]');
    process.exit(1);
  }

  const { sequelize } = require('../src/database/connection');
  await sequelize.authenticate();
  require('../src/database/models');
  const User = require('../src/modules/users/user.model');
  const Role = require('../src/modules/users/role.model');

  const role = await Role.findOne({ where: { name: roleName } });
  if (!role) {
    console.error(`Role not found: ${roleName}. Run setup-embedded first.`);
    process.exit(1);
  }

  let user = await User.unscoped().findOne({ where: { email } });
  if (user) {
    await user.update({
      status: true,
      isEmailVerified: true,
      roleId: role.id,
      firstName,
      lastName,
    });
    console.log(`Updated existing user for SSO: ${email} (role=${roleName})`);
  } else {
    user = await User.create({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(`TempPass@${Date.now()}!`, 12),
      status: true,
      isEmailVerified: true,
      roleId: role.id,
    });
    console.log(`Created user for SSO: ${email} (role=${roleName})`);
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
