const { Op } = require('sequelize');
const { randomUUID } = require('crypto');
const HseLogRecord = require('./hse-log-record.model');
const {
  MODULES,
  HEADER_ALIASES,
  mapHeaders,
  rowToRecord,
  extractIndexedFields,
  toClientRecord,
  excelDateToIso,
  normalizeHeader,
  collapseIncidentSheetRows,
} = require('./log-sheet.mapper');

function assertModule(module) {
  if (!MODULES.includes(module)) {
    const err = new Error(`Unknown log-sheet module: ${module}`);
    err.statusCode = 400;
    throw err;
  }
}

function buildWhere(module, query = {}) {
  const where = { module };
  if (query.department && query.department !== 'All') {
    where.departmentCode = query.department;
  }
  if (query.status && query.status !== 'All') {
    where.statusCode = query.status;
  }
  if (query.fromDate || query.toDate) {
    where.recordDate = {};
    if (query.fromDate) where.recordDate[Op.gte] = excelDateToIso(query.fromDate) || query.fromDate;
    if (query.toDate) where.recordDate[Op.lte] = excelDateToIso(query.toDate) || query.toDate;
  }
  if (query.search) {
    // JSON search is limited; filter in memory after fetch for small pages,
    // but also try external_ref match.
    where[Op.or] = [
      { externalRef: { [Op.like]: `%${query.search}%` } },
      { departmentCode: { [Op.like]: `%${query.search}%` } },
      { categoryCode: { [Op.like]: `%${query.search}%` } },
    ];
  }
  return where;
}

class LogSheetService {
  async list(module, query = {}) {
    assertModule(module);
    const limit = Math.min(parseInt(query.limit, 10) || 100, 5000);
    const offset = parseInt(query.offset, 10) || 0;
    const where = buildWhere(module, query);

    const { rows, count } = await HseLogRecord.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['record_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });

    let data = rows.map(toClientRecord);
    if (query.search) {
      const q = String(query.search).toLowerCase();
      data = data.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
    }

    return {
      data,
      meta: { total: count, limit, offset, module },
    };
  }

  async getById(module, id) {
    assertModule(module);
    const row = await HseLogRecord.findOne({ where: { id, module } });
    if (!row) {
      const err = new Error('Record not found');
      err.statusCode = 404;
      throw err;
    }
    return toClientRecord(row);
  }

  async create(module, payload, userId) {
    assertModule(module);
    const indexed = extractIndexedFields(module, payload);
    const row = await HseLogRecord.create({
      module,
      payload,
      ...indexed,
      createdBy: userId,
      updatedBy: userId,
    });
    return toClientRecord(row);
  }

  async update(module, id, payload, userId) {
    assertModule(module);
    const row = await HseLogRecord.findOne({ where: { id, module } });
    if (!row) {
      const err = new Error('Record not found');
      err.statusCode = 404;
      throw err;
    }
    const nextPayload = { ...row.payload, ...payload };
    const indexed = extractIndexedFields(module, nextPayload);
    await row.update({
      payload: nextPayload,
      ...indexed,
      updatedBy: userId,
    });
    return toClientRecord(row);
  }

  async updateStatus(module, id, status, userId) {
    return this.update(module, id, { status_id: status }, userId);
  }

  async remove(module, id) {
    assertModule(module);
    const row = await HseLogRecord.findOne({ where: { id, module } });
    if (!row) {
      const err = new Error('Record not found');
      err.statusCode = 404;
      throw err;
    }
    await row.destroy();
    return true;
  }

  async bulkCreate(module, records, userId, { skipInvalid = true } = {}) {
    assertModule(module);
    const batchId = randomUUID();
    const created = [];
    const validation_errors = [];
    const warnings = [];

    for (let i = 0; i < records.length; i += 1) {
      const payload = records[i] || {};
      const rowNumber = i + 1;
      const indexed = extractIndexedFields(module, payload);
      try {
        const row = await HseLogRecord.create({
          module,
          payload,
          ...indexed,
          importBatchId: batchId,
          validationWarnings: payload._warnings || null,
          createdBy: userId,
          updatedBy: userId,
        });
        created.push(toClientRecord(row));
        if (Array.isArray(payload._warnings)) warnings.push(...payload._warnings);
      } catch (err) {
        const msg = `Row ${rowNumber}: ${err.message}`;
        validation_errors.push(msg);
        if (!skipInvalid) throw err;
      }
    }

    return {
      module,
      import_batch_id: batchId,
      created: created.length,
      records: created,
      validation_errors,
      warnings,
    };
  }

  /**
   * Parse a 2D sheet (array of rows) into validated records.
   * headerRowIndex defaults to 0 (first row).
   */
  parseSheetRows(module, rows, { headerRowIndex = 0 } = {}) {
    assertModule(module);
    if (!rows || !rows.length) {
      return { module, records: [], validation_errors: ['Sheet is empty'], warnings: [], unmapped_columns: [] };
    }

    // Incident plant sheets: collapse action-item continuation rows into parent incidents
    let workingRows = rows;
    if (module === 'incident-log') {
      workingRows = collapseIncidentSheetRows(rows, { headerRowIndex });
    }

    // Auto-detect header row when the provided index looks like a title/blank row
    let resolvedHeaderIndex = headerRowIndex;
    const aliases = HEADER_ALIASES[module] || {};
    const scoreHeader = (row) => {
      if (!row) return 0;
      let hits = 0;
      row.forEach((cell) => {
        const key = normalizeHeader(cell);
        if (aliases[key]) hits += 1;
      });
      return hits;
    };
    if (scoreHeader(workingRows[resolvedHeaderIndex]) < 2) {
      let best = resolvedHeaderIndex;
      let bestScore = scoreHeader(workingRows[resolvedHeaderIndex]);
      for (let i = 0; i < Math.min(workingRows.length, 8); i += 1) {
        const s = scoreHeader(workingRows[i]);
        if (s > bestScore) {
          bestScore = s;
          best = i;
        }
      }
      resolvedHeaderIndex = best;
    }

    // Re-collapse after header detection if needed
    if (module === 'incident-log' && resolvedHeaderIndex !== headerRowIndex) {
      workingRows = collapseIncidentSheetRows(rows, { headerRowIndex: resolvedHeaderIndex });
    }

    if (workingRows.length <= resolvedHeaderIndex) {
      return { module, records: [], validation_errors: ['Sheet is empty'], warnings: [], unmapped_columns: [] };
    }

    const headerRow = workingRows[resolvedHeaderIndex];
    const { mapping, unmapped } = mapHeaders(module, headerRow);
    const records = [];
    const validation_errors = [];
    const warnings = [];

    for (let r = resolvedHeaderIndex + 1; r < workingRows.length; r += 1) {
      const cells = [...(workingRows[r] || [])];
      const isEmpty = cells.every((c) => c == null || String(c).trim() === '');
      if (isEmpty) continue;

      // Training logs often leave Department blank under merged/forward-filled blocks
      if (module === 'training-records') {
        const deptIdx = Object.entries(mapping).find(([, field]) => field === 'department_id')?.[0];
        if (deptIdx != null) {
          const idx = Number(deptIdx);
          if (cells[idx] == null || String(cells[idx]).trim() === '') {
            for (let back = r - 1; back > resolvedHeaderIndex; back -= 1) {
              const prev = workingRows[back]?.[idx];
              if (prev != null && String(prev).trim() !== '') {
                cells[idx] = prev;
                break;
              }
            }
          }
        }
      }

      const { record, warnings: w, errors } = rowToRecord(module, mapping, cells, r + 1);

      // Skip training section separators / blank skeleton rows
      if (module === 'training-records') {
        const hasSignal = record.trainer || record.topic || record.date;
        if (!hasSignal) continue;
      }

      warnings.push(...w);
      if (errors.length) {
        validation_errors.push(...errors);
        record._validation_errors = errors;
        record._warnings = w;
        records.push(record);
        continue;
      }
      record._warnings = w;
      records.push(record);
    }

    return {
      module,
      record_count: records.length,
      records,
      validation_errors,
      warnings,
      unmapped_columns: [...new Set(unmapped)],
      header_row_index: resolvedHeaderIndex,
    };
  }

  async exportRows(module, query = {}) {
    assertModule(module);
    const where = buildWhere(module, query);
    const rows = await HseLogRecord.findAll({
      where,
      order: [['record_date', 'ASC'], ['created_at', 'ASC']],
      limit: 20000,
    });
    return rows.map(toClientRecord);
  }

  async kpiSummary(query = {}) {
    const modules = [
      'hazard-reporting',
      'near-miss',
      'incident-log',
      'action-tracker',
      'training-records',
      'audit-management',
      'inspection-records',
    ];
    const result = {};
    for (const module of modules) {
      const where = buildWhere(module, query);
      const rows = await HseLogRecord.findAll({ where, attributes: ['departmentCode', 'statusCode', 'categoryCode', 'payload'] });
      result[module] = rows.map(toClientRecord);
    }
    return result;
  }
}

module.exports = new LogSheetService();
