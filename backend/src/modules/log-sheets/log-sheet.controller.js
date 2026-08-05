const logSheetService = require('./log-sheet.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { MODULES } = require('./log-sheet.mapper');

const listModules = asyncHandler(async (_req, res) => {
  res.status(200).json(ApiResponse.success(MODULES, 'Log sheet modules'));
});

const listRecords = asyncHandler(async (req, res) => {
  const result = await logSheetService.list(req.params.module, req.query);
  res.status(200).json(ApiResponse.success(result.data, 'Records retrieved successfully', result.meta));
});

const getRecord = asyncHandler(async (req, res) => {
  const record = await logSheetService.getById(req.params.module, req.params.id);
  res.status(200).json(ApiResponse.success(record, 'Record retrieved successfully'));
});

const createRecord = asyncHandler(async (req, res) => {
  const record = await logSheetService.create(req.params.module, req.body, req.user.id);
  res.status(201).json(ApiResponse.success(record, 'Record created successfully'));
});

const updateRecord = asyncHandler(async (req, res) => {
  const record = await logSheetService.update(
    req.params.module,
    req.params.id,
    req.body,
    req.user.id,
  );
  res.status(200).json(ApiResponse.success(record, 'Record updated successfully'));
});

const updateStatus = asyncHandler(async (req, res) => {
  const record = await logSheetService.updateStatus(
    req.params.module,
    req.params.id,
    req.body.status || req.body.status_id,
    req.user.id,
  );
  res.status(200).json(ApiResponse.success(record, 'Status updated successfully'));
});

const deleteRecord = asyncHandler(async (req, res) => {
  await logSheetService.remove(req.params.module, req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Record deleted successfully'));
});

const bulkCreate = asyncHandler(async (req, res) => {
  const records = req.body.records || [];
  const result = await logSheetService.bulkCreate(req.params.module, records, req.user.id, {
    skipInvalid: req.body.skipInvalid !== false,
  });
  res.status(201).json(ApiResponse.success(result, `Bulk imported ${result.created} records`));
});

const parsePreview = asyncHandler(async (req, res) => {
  const rows = req.body.rows || [];
  const headerRowIndex = Number(req.body.headerRowIndex || 0);
  const result = logSheetService.parseSheetRows(req.params.module, rows, { headerRowIndex });
  res.status(200).json(ApiResponse.success(result, 'Sheet parsed successfully'));
});

const importUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(ApiResponse.error('No file uploaded'));
  }

  const XLSX = require('xlsx');
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
  const sheetName = req.body.sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return res.status(400).json(ApiResponse.error(`Sheet '${sheetName}' not found`));
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const headerRowIndex = Number(req.body.headerRowIndex || 0);
  const parsed = logSheetService.parseSheetRows(req.params.module, rows, { headerRowIndex });

  // Only persist rows without hard validation errors unless force=true
  const force = req.body.force === 'true' || req.body.force === true;
  const toInsert = force
    ? parsed.records
    : parsed.records.filter((r) => !r._validation_errors || r._validation_errors.length === 0);

  const bulk = await logSheetService.bulkCreate(req.params.module, toInsert, req.user.id);
  res.status(201).json(ApiResponse.success({
    ...parsed,
    sheets: workbook.SheetNames,
    selected_sheet: sheetName,
    imported: bulk.created,
    import_batch_id: bulk.import_batch_id,
    skipped_invalid: parsed.records.length - toInsert.length,
  }, `Imported ${bulk.created} of ${parsed.record_count} rows`));
});

const exportRecords = asyncHandler(async (req, res) => {
  const format = String(req.query.format || 'csv').toLowerCase();
  const records = await logSheetService.exportRows(req.params.module, req.query);

  if (format === 'json') {
    return res.status(200).json(ApiResponse.success(records, 'Export ready'));
  }

  if (format === 'xlsx' || format === 'excel') {
    const XLSX = require('xlsx');
    const keys = records.length
      ? Array.from(records.reduce((set, row) => {
        Object.keys(row).forEach((k) => {
          if (!k.startsWith('_') && k !== 'createdAt' && k !== 'updatedAt') set.add(k);
        });
        return set;
      }, new Set()))
      : ['id'];
    const aoa = [keys, ...records.map((row) => keys.map((k) => (row[k] == null ? '' : row[k])))];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, req.params.module.slice(0, 31));
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.module}.xlsx"`);
    return res.status(200).send(buffer);
  }

  // CSV default
  const keys = records.length
    ? Array.from(records.reduce((set, row) => {
      Object.keys(row).forEach((k) => {
        if (!k.startsWith('_') && k !== 'createdAt' && k !== 'updatedAt') set.add(k);
      });
      return set;
    }, new Set()))
    : ['id'];

  const escape = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [keys.join(',')];
  records.forEach((row) => {
    lines.push(keys.map((k) => escape(row[k])).join(','));
  });
  const csv = lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.module}.csv"`);
  return res.status(200).send(csv);
});

const kpiBundle = asyncHandler(async (req, res) => {
  const data = await logSheetService.kpiSummary(req.query);
  res.status(200).json(ApiResponse.success(data, 'KPI source data'));
});

module.exports = {
  listModules,
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  updateStatus,
  deleteRecord,
  bulkCreate,
  parsePreview,
  importUpload,
  exportRecords,
  kpiBundle,
};
