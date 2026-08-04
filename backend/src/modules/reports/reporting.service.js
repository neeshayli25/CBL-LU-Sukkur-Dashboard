'use strict';

const { withTransaction } = require('../../shared/utils/transaction');
const ApiError = require('../../shared/utils/ApiError');
const repositories = require('./reporting.repository');
const { emitter, EVENTS } = require('../../core/events/emitter');

const auditData = (userId) => ({ createdBy: userId, updatedBy: userId });

/**
 * The ra_* reporting tables live in database/schema (enterprise SQL) and are
 * not part of the Sequelize migration path. When those tables are absent,
 * return a clear 501 instead of an unhandled 500.
 */
const mapReportingError = (err, resource) => {
  const msg = err?.message || '';
  if (
    err?.name === 'SequelizeDatabaseError'
    || /doesn't exist/i.test(msg)
    || /ER_NO_SUCH_TABLE/i.test(msg)
    || err?.parent?.code === 'ER_NO_SUCH_TABLE'
  ) {
    return new ApiError(
      `Reporting resource "${resource}" is not available — ra_* tables are not in the Sequelize schema. Apply database/schema scripts or treat as TODO.`,
      501,
    );
  }
  return err;
};

class ReportingService {
  async list(resource, query, options = {}) {
    try {
      return await repositories[resource].list(query, options);
    } catch (err) {
      throw mapReportingError(err, resource);
    }
  }

  async getById(resource, id, options = {}) {
    try {
      const record = await repositories[resource].findById(id, options);
      if (!record) throw ApiError.notFound(`${resource} record not found`);
      return record;
    } catch (err) {
      throw mapReportingError(err, resource);
    }
  }

  async create(resource, data, userId, options = {}) {
    try {
      return await withTransaction(async (transaction) => {
        const record = await repositories[resource].create({ ...data, ...auditData(userId) }, { transaction });
        if (resource === 'reports') emitter.emit(EVENTS.DASHBOARD_UPDATED, { resource, id: record.get('reportId'), userId });
        return record;
      }, options.transaction);
    } catch (err) {
      throw mapReportingError(err, resource);
    }
  }

  async update(resource, id, data, userId, options = {}) {
    try {
      const repository = repositories[resource];
      const record = await repository.findById(id, { transaction: options.transaction });
      if (!record) throw ApiError.notFound(`${resource} record not found`);
      await record.update({ ...data, updatedBy: userId }, { transaction: options.transaction });
      return record;
    } catch (err) {
      throw mapReportingError(err, resource);
    }
  }

  async remove(resource, id, userId, options = {}) {
    try {
      const repository = repositories[resource];
      const record = await repository.findById(id, { transaction: options.transaction });
      if (!record) throw ApiError.notFound(`${resource} record not found`);
      await record.update({ updatedBy: userId }, { transaction: options.transaction });
      await record.destroy({ transaction: options.transaction });
      return { id, deleted: true };
    } catch (err) {
      throw mapReportingError(err, resource);
    }
  }

  async restore(resource, id, options = {}) {
    try {
      const repository = repositories[resource];
      const count = await repository.restoreById(id, options);
      if (!count) throw ApiError.notFound(`${resource} deleted record not found`);
      return repository.findById(id, { paranoid: false, transaction: options.transaction });
    } catch (err) {
      throw mapReportingError(err, resource);
    }
  }

  async bulkCreate(resource, rows, userId, options = {}) {
    if (!Array.isArray(rows) || rows.length === 0) throw ApiError.unprocessable('At least one record is required');
    try {
      return await withTransaction((transaction) => repositories[resource].bulkCreate(rows.map((row) => ({ ...row, ...auditData(userId) })), { transaction }), options.transaction);
    } catch (err) {
      throw mapReportingError(err, resource);
    }
  }
}

module.exports = new ReportingService();
