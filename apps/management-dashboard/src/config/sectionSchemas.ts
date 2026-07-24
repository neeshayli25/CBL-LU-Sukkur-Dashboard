import { 
  DEPARTMENTS, 
  INCIDENT_CATEGORIES, 
  HAZARD_CATEGORIES, 
  ROOT_CAUSES, 
  RISK_RATINGS, 
  STATUSES 
} from './constants';

// No imports of React or lucide-react to keep this pure config

export interface ColumnSchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[]; // for select dropdowns
  required?: boolean;
  readonly?: boolean;
  hideFromForm?: boolean;
  compute?: (formData: any, allEntries?: any[]) => string | number;
}

export interface SectionConfig {
  id: string;
  title: string;
  path: string;
  accentColor: string; // Tailwind class or Hex
  icon: string; // String identifier for iconMap
  columns: ColumnSchema[];
}

// 1. Hazard Reporting
export const hazardReportingSchema: SectionConfig = {
  id: 'hazard-reporting',
  title: 'Hazard Reporting',
  path: '/hazard-reporting',
  accentColor: '#8C1D2B', // Deep Maroon
  icon: 'AlertTriangle',
  columns: [
    { key: 's_no', label: 'S#', type: 'text', hideFromForm: true, compute: (d) => d.s_no || '' },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { 
      key: 'month', 
      label: 'Month', 
      type: 'text', 
      readonly: true, 
      compute: (data: any) => {
        if (!data.date) return '';
        const d = new Date(data.date);
        return d.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
    },
    { key: 'department_id', label: 'Originated Deptt.', type: 'select', options: DEPARTMENTS, required: true },
    { key: 'originator', label: 'Originator Name', type: 'text', required: true },
    { key: 'location', label: 'Location', type: 'text', required: true },
    { key: 'description', label: 'Hazards Description', type: 'textarea', required: true },
    { key: 'hazard_category_id', label: 'Hazard Category', type: 'select', options: HAZARD_CATEGORIES, required: true },
    { key: 'responsible_person', label: 'RESP.', type: 'text', required: true },
    { key: 'risk_rating_id', label: 'Risk Rating', type: 'select', options: RISK_RATINGS, required: true },
    { key: 'unsafe_type', label: 'Unsafe', type: 'select', options: ['Unsafe Condition', 'Unsafe Act'] },
    { key: 'status_id', label: 'Status', type: 'select', options: STATUSES, required: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' }
  ]
};

// 2. Near Miss
export const nearMissSchema: SectionConfig = {
  id: 'near-miss',
  title: 'Near Miss',
  path: '/near-miss',
  accentColor: '#D9A441', // Amber/Gold
  icon: 'Target',
  columns: [
    { key: 's_no', label: 'S#', type: 'text', hideFromForm: true, compute: (d) => d.s_no || '' },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { 
      key: 'month', 
      label: 'Month', 
      type: 'text', 
      readonly: true, 
      compute: (data: any) => {
        if (!data.date) return '';
        const d = new Date(data.date);
        return d.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
    },
    { key: 'department_id', label: 'Deptt.', type: 'select', options: DEPARTMENTS, required: true },
    { key: 'reported_by', label: 'Reported By', type: 'text', required: true },
    { key: 'designation', label: 'Reported By — Designation', type: 'text', required: true },
    { key: 'affected_person', label: 'Affected Person Name', type: 'text' },
    { key: 'affected_designation', label: 'Affected Person — Designation', type: 'text' },
    { key: 'time', label: 'Time (24 Hrs)', type: 'text', required: true },
    { key: 'location', label: 'Area / Location', type: 'text', required: true },
    { key: 'details', label: 'Details of the Near Miss', type: 'textarea', required: true },
    { key: 'preventive_action', label: 'Preventive Action Suggestion', type: 'textarea' },
    { key: 'responsible_person', label: 'Resp.', type: 'text' },
    { key: 'investigation_required', label: 'Further Investigation Required (Y/N)', type: 'select', options: ['Yes', 'No'] },
    { key: 'reported_in_hazard', label: 'Reported in HAZARD (Y/N)', type: 'select', options: ['Yes', 'No'] },
    { key: 'status_id', label: 'Status (Open/Close)', type: 'select', options: STATUSES, required: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' }
  ]
};

// 3. Incident Log
export const incidentLogSchema: SectionConfig = {
  id: 'incident-log',
  title: 'Incident Log',
  path: '/incident-log',
  accentColor: '#C46A2F', // Toasted Caramel
  icon: 'FileWarning',
  columns: [
    { key: 's_no', label: 'S.No', type: 'text', hideFromForm: true, compute: (d) => d.s_no || '' },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'shift', label: 'Shift', type: 'select', options: ['A', 'B', 'C', 'General'], required: true },
    { key: 'area_manager', label: 'Area Manager', type: 'text', required: true },
    { key: 'gender', label: 'Gender Wise', type: 'select', options: ['Male', 'Female', 'Other'] },
    { key: 'location', label: 'Location Wise', type: 'text', required: true },
    { key: 'department_id', label: 'Dept', type: 'select', options: DEPARTMENTS, required: true },
    { key: 'incident_category_id', label: 'Incident Category', type: 'select', options: INCIDENT_CATEGORIES, required: true },
    { key: 'root_cause_id', label: 'Root causes', type: 'select', options: ROOT_CAUSES, required: true },
    { key: 'action_items', label: 'Action Items', type: 'textarea' },
    { key: 'responsible_person', label: 'Resp', type: 'text' },
    { key: 'risk_rating_id', label: 'Risk Rating', type: 'select', options: RISK_RATINGS, required: true },
    { key: 'timeline', label: 'Timeline', type: 'date' },
    { key: 'status_id', label: 'Status', type: 'select', options: STATUSES, required: true }
  ]
};

// 4. Action Tracker
export const actionTrackerSchema: SectionConfig = {
  id: 'action-tracker',
  title: 'Actions / CAPA',
  path: '/action-tracker',
  accentColor: '#A73A28', // Muted Rust
  icon: 'CheckSquare',
  columns: [
    { key: 'linked_id', label: 'Linked ID (Incident/Hazard)', type: 'text', required: true },
    { key: 'action', label: 'Action', type: 'textarea', required: true },
    { key: 'assigned_to', label: 'Assigned To', type: 'text', required: true },
    { key: 'due_date', label: 'Due Date', type: 'date', required: true },
    { key: 'completion_date', label: 'Completion Date', type: 'date' },
    { key: 'status_id', label: 'Status', type: 'select', options: STATUSES, required: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' }
  ]
};

// 5. Training Records
export const trainingRecordsSchema: SectionConfig = {
  id: 'training-records',
  title: 'Training Records',
  path: '/training-records',
  accentColor: '#8A7D5C', // Warm Olive/Tan
  icon: 'Users',
  columns: [
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'department_id', label: 'Department', type: 'select', options: DEPARTMENTS, required: true },
    { key: 'trainer', label: 'Trainer', type: 'text', required: true },
    { key: 'venue', label: 'Venue', type: 'text' },
    { key: 'topic', label: 'Topics Delivered', type: 'textarea', required: true },
    { key: 'participants', label: 'Total Participants', type: 'number', required: true },
    { key: 'duration_minutes', label: 'Duration (Min)', type: 'number', required: true },
    { 
      key: 'manhours', 
      label: 'Manhours', 
      type: 'number', 
      readonly: true,
      compute: (data: any) => {
        const p = parseFloat(data.participants) || 0;
        const d = parseFloat(data.duration_minutes) || 0;
        return (p * (d / 60)).toFixed(2);
      }
    },
    { key: 'status_id', label: 'Status', type: 'select', options: STATUSES, required: true },
    { 
      key: 'total_manhours', 
      label: 'Total Manhours', 
      type: 'number',
      readonly: true,
      compute: (data: any, allEntries?: any[]) => {
        if (!allEntries) return 0;
        // Department-wise cumulative
        const deptEntries = allEntries.filter(e => e.department_id === data.department_id);
        const prevTotal = deptEntries.reduce((sum, e) => {
          if (e.id === data.id) return sum; // don't count itself if it's an update
          return sum + (parseFloat(e.manhours) || 0);
        }, 0);
        const currentManhours = parseFloat(data.manhours) || 0;
        return (prevTotal + currentManhours).toFixed(2);
      }
    }
  ]
};

// 6. Audit Management (Phase 2)
export const auditManagementSchema: SectionConfig = {
  id: 'audit-management',
  title: 'Audit Management',
  path: '/audit-management',
  accentColor: '#8B5CF6', // Violet
  icon: 'ClipboardList',
  columns: [
    { key: 'title', label: 'Audit Title', type: 'text', required: true },
    { key: 'department_id', label: 'Department', type: 'select', options: DEPARTMENTS },
    { key: 'auditor', label: 'Auditor', type: 'text', required: true },
    { key: 'audit_date', label: 'Audit Date', type: 'date', required: true },
    { key: 'findings', label: 'Findings / Notes', type: 'textarea' },
    { key: 'status_id', label: 'Status', type: 'select', options: STATUSES, required: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ]
};

// 7. Inspection Records (Phase 2)
export const inspectionRecordsSchema: SectionConfig = {
  id: 'inspection-records',
  title: 'Inspection Records',
  path: '/inspection-records',
  accentColor: '#F59E0B', // Amber
  icon: 'CheckSquare',
  columns: [
    { key: 'department_id', label: 'Department', type: 'select', options: DEPARTMENTS },
    { key: 'inspector', label: 'Inspector', type: 'text', required: true },
    { key: 'inspection_date', label: 'Inspection Date', type: 'date', required: true },
    { key: 'observations', label: 'Observations', type: 'textarea' },
    { key: 'status_id', label: 'Status', type: 'select', options: STATUSES, required: true },
  ]
};

export const ALL_SECTIONS = [
  hazardReportingSchema,
  nearMissSchema,
  incidentLogSchema,
  trainingRecordsSchema,
  actionTrackerSchema,
  auditManagementSchema,
  inspectionRecordsSchema
];
