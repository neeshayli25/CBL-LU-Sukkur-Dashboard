'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hse_log_records', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      module: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'Schema id: hazard-reporting, near-miss, incident-log, etc.',
      },
      external_ref: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'S# / Sr# from source log sheet',
      },
      record_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      department_code: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      status_code: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      category_code: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
      linked_ref: {
        type: Sequelize.STRING(128),
        allowNull: true,
        comment: 'CAPA linked hazard/incident external ref',
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Full log-sheet field map matching sectionSchemas keys',
      },
      import_batch_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      validation_warnings: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('hse_log_records', ['module'], { name: 'hse_log_records_module_idx' });
    await queryInterface.addIndex('hse_log_records', ['record_date'], { name: 'hse_log_records_record_date_idx' });
    await queryInterface.addIndex('hse_log_records', ['department_code'], { name: 'hse_log_records_department_code_idx' });
    await queryInterface.addIndex('hse_log_records', ['status_code'], { name: 'hse_log_records_status_code_idx' });
    await queryInterface.addIndex('hse_log_records', ['module', 'external_ref'], { name: 'hse_log_records_module_ext_idx' });
    await queryInterface.addIndex('hse_log_records', ['import_batch_id'], { name: 'hse_log_records_batch_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hse_log_records');
  },
};
