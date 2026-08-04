'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Try to get super admin user ID to associate creation
    let createdBy = null;
    try {
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email IN ('superadmin@cblapp.com', 'admin@cbl.com') LIMIT 1;`
      );
      if (users[0] && users[0].length > 0) {
        createdBy = users[0][0].id;
      }
    } catch (e) {
      // Ignore if table doesn't exist or query fails
    }

    // Skip if plants already seeded
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM plants WHERE code IN ('PLANT-A', 'PLANT-B') LIMIT 1;`
    );
    if (existing && existing.length > 0) return;

    const plants = [
      {
        id: uuidv4(),
        name: 'CBL Plant Alpha',
        code: 'PLANT-A',
        location: 'Karachi, Sindh',
        country: 'Pakistan',
        is_active: true,
        created_by: createdBy,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'CBL Plant Beta',
        code: 'PLANT-B',
        location: 'Lahore, Punjab',
        country: 'Pakistan',
        is_active: true,
        created_by: createdBy,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('plants', plants, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('plants', null, {});
  }
};
