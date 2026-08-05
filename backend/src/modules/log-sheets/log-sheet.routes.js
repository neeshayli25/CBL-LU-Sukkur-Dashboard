const express = require('express');
const multer = require('multer');

const router = express.Router();
const controller = require('./log-sheet.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { PERMISSIONS } = require('../../shared/constants/permissions');
const {
  createRecordSchema,
  updateRecordSchema,
  updateStatusSchema,
  bulkSchema,
  parseSchema,
} = require('./log-sheet.schema');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.use(authenticate);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  controller.listModules,
);

router.get(
  '/kpi-bundle',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  controller.kpiBundle,
);

router.get(
  '/:module',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  controller.listRecords,
);

router.get(
  '/:module/export',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  controller.exportRecords,
);

router.post(
  '/:module/bulk',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(bulkSchema),
  controller.bulkCreate,
);

router.post(
  '/:module/parse',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(parseSchema),
  controller.parsePreview,
);

router.post(
  '/:module/import',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  upload.single('file'),
  controller.importUpload,
);

router.post(
  '/:module',
  requirePermissions([PERMISSIONS.HSE_REPORT_HAZARD]),
  validate(createRecordSchema),
  controller.createRecord,
);

router.get(
  '/:module/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  controller.getRecord,
);

router.put(
  '/:module/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(updateRecordSchema),
  controller.updateRecord,
);

router.patch(
  '/:module/:id/status',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(updateStatusSchema),
  controller.updateStatus,
);

router.delete(
  '/:module/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  controller.deleteRecord,
);

module.exports = router;
