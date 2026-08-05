const Joi = require('joi');
const { MODULES } = require('./log-sheet.mapper');

const moduleParam = Joi.string().valid(...MODULES).required();

const createRecordSchema = Joi.object().unknown(true).min(1);

const updateRecordSchema = Joi.object().unknown(true).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().optional(),
  status_id: Joi.string().optional(),
}).or('status', 'status_id');

const bulkSchema = Joi.object({
  records: Joi.array().items(Joi.object().unknown(true)).min(1).required(),
  skipInvalid: Joi.boolean().optional(),
});

const parseSchema = Joi.object({
  rows: Joi.array().items(Joi.array()).min(1).required(),
  headerRowIndex: Joi.number().integer().min(0).default(0),
});

module.exports = {
  moduleParam,
  createRecordSchema,
  updateRecordSchema,
  updateStatusSchema,
  bulkSchema,
  parseSchema,
  MODULES,
};
