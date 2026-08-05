const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

/**
 * Plant log-sheet record — stores Excel/UI field payloads for the 7 HSE modules
 * (plus critical-audit-plan) using sectionSchemas field keys.
 */
const HseLogRecord = sequelize.define('HseLogRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  module: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  externalRef: {
    type: DataTypes.STRING(64),
    allowNull: true,
    field: 'external_ref',
  },
  recordDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'record_date',
  },
  departmentCode: {
    type: DataTypes.STRING(64),
    allowNull: true,
    field: 'department_code',
  },
  statusCode: {
    type: DataTypes.STRING(64),
    allowNull: true,
    field: 'status_code',
  },
  categoryCode: {
    type: DataTypes.STRING(128),
    allowNull: true,
    field: 'category_code',
  },
  linkedRef: {
    type: DataTypes.STRING(128),
    allowNull: true,
    field: 'linked_ref',
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  importBatchId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'import_batch_id',
  },
  validationWarnings: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'validation_warnings',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'updated_by',
  },
}, {
  tableName: 'hse_log_records',
  paranoid: true,
  underscored: true,
  indexes: [
    { fields: ['module'], name: 'hse_log_records_module_idx' },
    { fields: ['record_date'], name: 'hse_log_records_record_date_idx' },
    { fields: ['department_code'], name: 'hse_log_records_department_code_idx' },
    { fields: ['status_code'], name: 'hse_log_records_status_code_idx' },
  ],
});

module.exports = HseLogRecord;
