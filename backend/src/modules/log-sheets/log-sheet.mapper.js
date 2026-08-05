/**
 * Plant log-sheet normalizers & column alias maps.
 * Maps Excel headers / free-text plant values onto sectionSchemas field keys.
 */

const MODULES = Object.freeze([
  'hazard-reporting',
  'near-miss',
  'incident-log',
  'action-tracker',
  'training-records',
  'audit-management',
  'inspection-records',
  'critical-audit-plan',
]);

const DEPARTMENT_ALIASES = {
  prod: 'PRD',
  prd: 'PRD',
  production: 'PRD',
  esd: 'ESD',
  'esd & uty': 'ESD',
  'esd/uty': 'ESD',
  utilities: 'ESD',
  uty: 'ESD',
  hse: 'HSE',
  adm: 'ADM',
  admin: 'ADM',
  'adm ir & hr': 'ADM',
  administration: 'ADM',
  stores: 'Stores',
  store: 'Stores',
  str: 'Stores',
  projects: 'Projects',
  project: 'Projects',
  prj: 'Projects',
  proj: 'Projects',
  'qc/fs/npd': 'QC/FS/NPD',
  'qc/npd/fs': 'QC/FS/NPD',
  qc: 'QC/FS/NPD',
  npd: 'QC/FS/NPD',
  fs: 'QC/FS/NPD',
  it: 'IT',
  eng: 'ESD',
  others: 'Others',
  other: 'Others',
  'area owners': 'Others',
  'legal department': 'Others',
};

const STATUS_ALIASES = {
  open: 'Open',
  closed: 'Closed',
  close: 'Closed',
  done: 'Closed',
  pending: 'Pending',
  planned: 'Pending',
  wip: 'Work in Progress',
  'work in progress': 'Work in Progress',
  'in progress': 'Work in Progress',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
};

const RISK_ALIASES = {
  low: 'Low',
  medium: 'Medium',
  med: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const INCIDENT_CATEGORY_ALIASES = {
  'first aid': 'First Aid',
  fa: 'First Aid',
  '1st aid': 'First Aid',
  mtc: 'MTC',
  lti: 'LTI',
  lta: 'LTI',
  rwc: 'RWC',
  fatality: 'Fatality',
  'minor fire': 'Minor Fire',
  fire: 'Minor Fire',
  'fire ': 'Minor Fire',
  'fire incident': 'Minor Fire',
  'significant near miss': 'Significant Near Miss',
  'significant near-miss': 'Significant Near Miss',
  'near miss': 'Significant Near Miss',
  'potential near miss': 'Significant Near Miss',
  'potential near-miss': 'Significant Near Miss',
  'fatal potential near miss': 'Significant Near Miss',
  'potential incident': 'Significant Near Miss',
  'short circuiting': 'Minor Fire',
};

/** Header aliases per module → canonical field key */
const HEADER_ALIASES = {
  'hazard-reporting': {
    's#': 's_no',
    's.no': 's_no',
    'sr#': 's_no',
    'sr. #': 's_no',
    date: 'date',
    month: 'month',
    'originated deptt.': 'department_id',
    'originated deptt': 'department_id',
    'originated dept': 'department_id',
    department: 'department_id',
    dept: 'department_id',
    'originator name': 'originator',
    originator: 'originator',
    'reported by': 'originator',
    location: 'location',
    'hazards description': 'description',
    'hazard description': 'description',
    description: 'description',
    'hazard category': 'hazard_category_id',
    category: 'hazard_category_id',
    'resp.': 'responsible_person',
    resp: 'responsible_person',
    'responsible person': 'responsible_person',
    'risk rating': 'risk_rating_id',
    risk: 'risk_rating_id',
    unsafe: 'unsafe_type',
    'type of hazard': 'unsafe_type',
    status: 'status_id',
    remarks: 'remarks',
  },
  'near-miss': {
    's#': 's_no',
    date: 'date',
    month: 'month',
    'deptt.': 'department_id',
    deptt: 'department_id',
    department: 'department_id',
    'reported by': 'reported_by',
    'desig.': 'designation',
    designation: 'designation',
    'affected person name': 'affected_person',
    'time (24 hrs)': 'time',
    time: 'time',
    'area / location': 'location',
    location: 'location',
    'details of the near miss': 'details',
    details: 'details',
    'preventive action suggestion': 'preventive_action',
    'resp.': 'responsible_person',
    'further investigation required (y/n)': 'investigation_required',
    'reported in hazard (y/n)': 'reported_in_hazard',
    'stauts (open/close)': 'status_id',
    'status (open/close)': 'status_id',
    status: 'status_id',
    remarks: 'remarks',
  },
  'incident-log': {
    's.no': 's_no',
    's#': 's_no',
    'serial #': 's_no',
    date: 'date',
    description: 'description',
    decription: 'description',
    shift: 'shift',
    'area manager': 'area_manager',
    'gender wise': 'gender',
    gender: 'gender',
    location: 'location',
    'location wise': 'location',
    department: 'department_id',
    dept: 'department_id',
    'incident category': 'incident_category_id',
    category: 'incident_category_id',
    'root cause': 'root_cause',
    'root causes': 'root_cause',
    'root cause category': 'root_cause_id',
    'action items': 'action_items',
    'immediate cause': 'immediate_cause',
    'corrective actions': 'corrective_actions',
    'preventive actions': 'preventive_actions',
    'responsible person': 'responsible_person',
    resp: 'responsible_person',
    'risk rating': 'risk_rating_id',
    timeline: 'timeline',
    status: 'status_id',
  },
  'action-tracker': {
    'sr. #': 's_no',
    'sr#': 's_no',
    's#': 's_no',
    date: 'date',
    month: 'month',
    'auditor name': 'auditor_name',
    'action drived from': 'action_driven_from',
    'action derived from': 'action_driven_from',
    'action driven from': 'action_driven_from',
    'audit description': 'audit_description',
    'area/clauses': 'area_clauses',
    'actions / recommendation': 'actions_recommendation',
    'actions/recommendation': 'actions_recommendation',
    severity: 'severity',
    'responsible department': 'department_id',
    department: 'department_id',
    'responsible manager': 'responsible_manager',
    'target date': 'target_date',
    'action item status': 'status_id',
    status: 'status_id',
    'linked id': 'linked_id',
    'linked ref': 'linked_id',
  },
  'training-records': {
    date: 'date',
    department: 'department_id',
    trainer: 'trainer',
    venue: 'venue',
    'topics delivered': 'topic',
    topic: 'topic',
    'total participants': 'participants',
    participants: 'participants',
    'duration (min)': 'duration_minutes',
    duration: 'duration_minutes',
    manhours: 'manhours',
    'total manhours': 'total_manhours',
    'training type': 'training_type',
    status: 'status_id',
  },
  'audit-management': {
    'audit conducted by': 'conducted_by',
    'person interviewed': 'person_interviewed',
    'date of audit': 'audit_date',
    'sr. #': 's_no',
    'standard reference': 'standard_reference',
    'audit point': 'audit_point',
    'standard limit/requirement': 'standard_limit',
    'scoring (1-4)': 'scoring',
    scoring: 'scoring',
    'actions / recommendations': 'actions_recommendations',
    'target date for completion': 'target_date',
    responsibility: 'responsibility',
    'responsible department': 'department_id',
    'closure status': 'status_id',
    status: 'status_id',
  },
  'inspection-records': {
    'sr. #': 's_no',
    'standard reference': 'standard_reference',
    'audit point': 'audit_point',
    'standard limit/requirement': 'standard_limit',
    'actions / recommendations': 'actions_recommendations',
    severity: 'severity',
    'target date for completion': 'target_date',
    responsibility: 'responsibility',
    'responsible department': 'department_id',
    'closure status (open/closed)': 'status_id',
    'closure status': 'status_id',
    pictorial: 'pictorial',
  },
  'critical-audit-plan': {
    's.no': 's_no',
    'area name': 'area_name',
    'area owners': 'area_owners',
    'Audit Objective\r\n (Aligned with HSE Standards)': 'audit_objective',
    'audit objective\n (aligned with hse standards)': 'audit_objective',
    'audit objective (aligned with hse standards)': 'audit_objective',
    'audit objective': 'audit_objective',
    'risk rating': 'risk_rating',
    auditors: 'auditors',
    frequency: 'frequency',
    status: 'status_id',
  },
};

const REQUIRED_FIELDS = {
  'hazard-reporting': ['date', 'department_id', 'location', 'originator', 'hazard_category_id', 'description', 'responsible_person', 'risk_rating_id', 'status_id'],
  'near-miss': ['date', 'department_id', 'reported_by', 'location', 'details', 'status_id'],
  'incident-log': ['date', 'description', 'department_id', 'incident_category_id', 'status_id'],
  'action-tracker': ['date', 'actions_recommendation', 'department_id', 'responsible_manager', 'status_id'],
  'training-records': ['date', 'department_id', 'trainer', 'topic', 'participants', 'duration_minutes'],
  'audit-management': ['audit_date', 'audit_point', 'department_id', 'status_id'],
  'inspection-records': ['audit_point', 'department_id', 'status_id'],
  'critical-audit-plan': ['area_name', 'status_id'],
};

function normalizeHeader(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeDepartment(value) {
  if (value == null || value === '') return { value: null, warning: null };
  const raw = String(value).trim();
  const key = raw.toLowerCase();
  if (DEPARTMENT_ALIASES[key]) {
    return { value: DEPARTMENT_ALIASES[key], warning: DEPARTMENT_ALIASES[key] === raw ? null : `department '${raw}' → ${DEPARTMENT_ALIASES[key]}` };
  }
  // Already canonical?
  const canonical = ['ADM', 'ESD', 'HSE', 'IT', 'PRD', 'Projects', 'QC/FS/NPD', 'Stores', 'Others'];
  const hit = canonical.find((c) => c.toLowerCase() === key);
  if (hit) return { value: hit, warning: null };
  return { value: raw, warning: `department '${raw}' not in standard list — kept as-is` };
}

function normalizeStatus(value) {
  if (value == null || value === '') return { value: null, warning: null };
  const raw = String(value).trim();
  const mapped = STATUS_ALIASES[raw.toLowerCase()];
  if (mapped) return { value: mapped, warning: mapped === raw ? null : `status '${raw}' → ${mapped}` };
  return { value: raw, warning: `status '${raw}' not in standard list — kept as-is` };
}

function normalizeRisk(value) {
  if (value == null || value === '') return { value: null, warning: null };
  const raw = String(value).trim();
  const mapped = RISK_ALIASES[raw.toLowerCase()];
  if (mapped) return { value: mapped, warning: null };
  return { value: raw, warning: `risk '${raw}' not in standard list — kept as-is` };
}

function normalizeIncidentCategory(value) {
  if (value == null || value === '') return { value: null, warning: null };
  const raw = String(value).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const mapped = INCIDENT_CATEGORY_ALIASES[raw.toLowerCase()];
  if (mapped) return { value: mapped, warning: null };
  return { value: raw, warning: `incident category '${raw}' not in standard list — kept as-is` };
}

function normalizeUnsafeType(value) {
  if (value == null || value === '') return { value: null, warning: null };
  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  if (lower === 'act' || lower === 'unsafe act' || lower === 'ua') return { value: 'Unsafe Act', warning: null };
  if (lower.includes('condition')) return { value: 'Unsafe Condition', warning: null };
  if (lower.includes('environment')) return { value: 'Unsafe Environment', warning: null };
  if (lower.includes('equipment')) return { value: 'Unsafe Equipment', warning: null };
  return { value: raw, warning: null };
}

function excelDateToIso(value, { preferDayFirst = true } = {}) {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel serial date (days since 1899-12-30)
    const utc = Date.UTC(1899, 11, 30) + Math.round(value * 86400000);
    return new Date(utc).toISOString().slice(0, 10);
  }
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  // Plant sheets use day/month/year (e.g. 6/1/26 = 6 Jan 2026)
  const m = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    let a = Number(m[1]);
    let b = Number(m[2]);
    let year = m[3];
    if (year.length === 2) year = `20${year}`;
    let day;
    let month;
    if (preferDayFirst) {
      // If first part > 12 it must be day; if second > 12 it must be month-first
      if (a > 12 && b <= 12) {
        day = a; month = b;
      } else if (b > 12 && a <= 12) {
        day = b; month = a;
      } else {
        day = a; month = b;
      }
    } else {
      day = b; month = a;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // "15th Jan 2020" / "10th March 2020"
  const named = raw.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{2,4})$/);
  if (named) {
    const months = {
      jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
      may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
      oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
    };
    const month = months[named[2].toLowerCase()];
    if (month) {
      let year = named[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${String(month).padStart(2, '0')}-${String(named[1]).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

/**
 * Collapse plant Incident Log sheets where action-item lines continue under a parent incident.
 * Parent row has S.No / Date / Description; following rows only fill Action Items (+ Resp/Risk/Status).
 */
function collapseIncidentSheetRows(rows, { headerRowIndex = 0 } = {}) {
  if (!rows?.length) return rows;
  const { mapping } = mapHeaders('incident-log', rows[headerRowIndex] || []);
  const idx = (field) => {
    const hit = Object.entries(mapping).find(([, f]) => f === field);
    return hit ? Number(hit[0]) : -1;
  };
  const iSno = idx('s_no');
  const iDate = idx('date');
  const iDesc = idx('description');
  const iAction = idx('action_items');
  const iResp = idx('responsible_person');
  const iRisk = idx('risk_rating_id');
  const iTimeline = idx('timeline');
  const iStatus = idx('status_id');

  const out = [rows[headerRowIndex]];
  let current = null;

  for (let r = headerRowIndex + 1; r < rows.length; r += 1) {
    const cells = [...(rows[r] || [])];
    const empty = cells.every((c) => c == null || String(c).trim() === '');
    if (empty) continue;

    const sno = iSno >= 0 ? cells[iSno] : null;
    const date = iDate >= 0 ? cells[iDate] : null;
    const desc = iDesc >= 0 ? cells[iDesc] : null;
    const action = iAction >= 0 ? cells[iAction] : null;
    const isParent = (sno != null && String(sno).trim() !== '')
      || ((date != null && String(date).trim() !== '') && (desc != null && String(desc).trim() !== ''));

    if (isParent) {
      if (current) out.push(current);
      current = cells;
      continue;
    }

    // Continuation / action-item row — append onto parent
    if (current && action != null && String(action).trim() !== '') {
      const prev = current[iAction] != null ? String(current[iAction]).trim() : '';
      const next = String(action).trim();
      if (iAction >= 0) current[iAction] = prev ? `${prev}\n${next}` : next;
      // Keep latest non-empty assignment metadata when parent left them blank
      if (iResp >= 0 && (!current[iResp] || String(current[iResp]).trim() === '') && cells[iResp]) {
        current[iResp] = cells[iResp];
      }
      if (iRisk >= 0 && (!current[iRisk] || String(current[iRisk]).trim() === '') && cells[iRisk]) {
        current[iRisk] = cells[iRisk];
      }
      if (iTimeline >= 0 && (!current[iTimeline] || String(current[iTimeline]).trim() === '') && cells[iTimeline]) {
        current[iTimeline] = cells[iTimeline];
      }
      if (iStatus >= 0 && cells[iStatus] && String(cells[iStatus]).trim() !== '') {
        // Prefer Open/WIP over Done if any child is still open
        const cur = String(current[iStatus] || '').toLowerCase();
        const child = String(cells[iStatus]).toLowerCase();
        if (!cur || cur === 'done' || cur === 'closed') current[iStatus] = cells[iStatus];
        if (['open', 'wip', 'pending', 'work in progress'].includes(child)) current[iStatus] = cells[iStatus];
      }
    }
  }
  if (current) out.push(current);
  return out;
}

function yesNo(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim().toLowerCase();
  if (['y', 'yes', 'true', '1'].includes(raw)) return 'Yes';
  if (['n', 'no', 'false', '0', '-', '_'].includes(raw)) return 'No';
  return String(value).trim();
}

function mapHeaders(module, headerRow) {
  const aliases = HEADER_ALIASES[module] || {};
  const mapping = {};
  const unmapped = [];
  headerRow.forEach((header, index) => {
    if (header == null || String(header).trim() === '') return;
    const key = normalizeHeader(header);
    if (aliases[key]) {
      mapping[index] = aliases[key];
    } else {
      const months = {
        january: 'jan',
        february: 'feb',
        march: 'mar',
        april: 'apr',
        may: 'may',
        june: 'jun',
        july: 'jul',
        august: 'aug',
        september: 'sep',
        october: 'oct',
        november: 'nov',
        december: 'dec',
        jan: 'jan',
        feb: 'feb',
        mar: 'mar',
        apr: 'apr',
        jun: 'jun',
        jul: 'jul',
        aug: 'aug',
        sep: 'sep',
        oct: 'oct',
        nov: 'nov',
        dec: 'dec',
      };
      if (months[key]) mapping[index] = months[key];
      else unmapped.push(String(header).trim());
    }
  });
  return { mapping, unmapped };
}

function rowToRecord(module, mapping, cells, rowNumber) {
  const record = {};
  const warnings = [];
  const errors = [];

  Object.entries(mapping).forEach(([idx, field]) => {
    const cell = cells[Number(idx)];
    if (cell === undefined || cell === null || cell === '') return;
    record[field] = typeof cell === 'string' ? cell.trim() : cell;
  });

  // Dates (timeline often has free text like "Daily-Basis" / "Immediately" — keep as-is if not a date)
  ['date', 'target_date', 'audit_date', 'due_date', 'completion_date'].forEach((f) => {
    if (record[f] != null) {
      const iso = excelDateToIso(record[f]);
      if (!iso) {
        warnings.push(`Row ${rowNumber}: could not parse date for ${f} ('${record[f]}')`);
      } else {
        record[f] = iso;
      }
    }
  });
  if (record.timeline != null) {
    const iso = excelDateToIso(record.timeline);
    if (iso) record.timeline = iso;
    // else keep free-text timeline
  }

  if (record.department_id != null) {
    const d = normalizeDepartment(record.department_id);
    record.department_id = d.value;
    if (d.warning) warnings.push(`Row ${rowNumber}: ${d.warning}`);
  }

  if (record.status_id != null || record.status != null) {
    const statusRaw = record.status_id ?? record.status;
    const s = normalizeStatus(statusRaw);
    record.status_id = s.value;
    delete record.status;
    if (s.warning) warnings.push(`Row ${rowNumber}: ${s.warning}`);
  }

  if (record.risk_rating_id != null || record.risk_rating != null || record.severity != null) {
    if (record.risk_rating_id != null) {
      const r = normalizeRisk(record.risk_rating_id);
      record.risk_rating_id = r.value;
      if (r.warning) warnings.push(`Row ${rowNumber}: ${r.warning}`);
    }
    if (record.risk_rating != null) {
      const r = normalizeRisk(record.risk_rating);
      record.risk_rating = r.value;
    }
    if (record.severity != null) {
      const r = normalizeRisk(record.severity);
      record.severity = r.value;
    }
  }

  if (record.incident_category_id != null) {
    const c = normalizeIncidentCategory(record.incident_category_id);
    record.incident_category_id = c.value;
    if (c.warning) warnings.push(`Row ${rowNumber}: ${c.warning}`);
  }

  if (record.unsafe_type != null) {
    const u = normalizeUnsafeType(record.unsafe_type);
    record.unsafe_type = u.value;
  }

  if (record.investigation_required != null) {
    record.investigation_required = yesNo(record.investigation_required);
  }
  if (record.reported_in_hazard != null) {
    record.reported_in_hazard = yesNo(record.reported_in_hazard);
  }

  // Training derived fields
  if (module === 'training-records') {
    const p = Number(record.participants) || 0;
    const d = Number(record.duration_minutes) || 0;
    record.participants = p;
    record.duration_minutes = d;
    record.manhours = Number((p * (d / 60)).toFixed(2));
    if (!record.status_id) record.status_id = 'Closed';
    if (!record.training_type) record.training_type = 'Internal';
  }

  // CAPA linked_id
  if (module === 'action-tracker' && record.linked_id == null && record.action_driven_from) {
    record.linked_id = String(record.action_driven_from);
  }

  const required = REQUIRED_FIELDS[module] || [];
  required.forEach((field) => {
    if (record[field] == null || record[field] === '') {
      errors.push(`Row ${rowNumber}: missing required field '${field}'`);
    }
  });

  return { record, warnings, errors, rowNumber };
}

function extractIndexedFields(module, payload) {
  const dateField = payload.date || payload.audit_date || payload.inspection_date || null;
  const category = payload.hazard_category_id
    || payload.incident_category_id
    || payload.category
    || payload.severity
    || null;
  return {
    externalRef: payload.s_no != null ? String(payload.s_no) : null,
    recordDate: excelDateToIso(dateField),
    departmentCode: payload.department_id || null,
    statusCode: payload.status_id || payload.status || null,
    categoryCode: category != null ? String(category).slice(0, 128) : null,
    linkedRef: payload.linked_id || null,
  };
}

function toClientRecord(row) {
  if (!row) return null;
  const plain = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return {
    id: plain.id,
    ...plain.payload,
    s_no: plain.payload?.s_no ?? plain.externalRef ?? undefined,
    _module: plain.module,
    _import_batch_id: plain.importBatchId,
    _warnings: plain.validationWarnings || [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

module.exports = {
  MODULES,
  HEADER_ALIASES,
  REQUIRED_FIELDS,
  DEPARTMENT_ALIASES,
  STATUS_ALIASES,
  normalizeHeader,
  normalizeDepartment,
  normalizeStatus,
  normalizeRisk,
  normalizeIncidentCategory,
  excelDateToIso,
  mapHeaders,
  rowToRecord,
  extractIndexedFields,
  toClientRecord,
  collapseIncidentSheetRows,
};
