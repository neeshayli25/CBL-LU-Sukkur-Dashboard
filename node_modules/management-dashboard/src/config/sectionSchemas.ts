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
  compute?: (formData: any) => string | number;
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
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'department_id', label: 'Department', type: 'select', options: DEPARTMENTS, required: true },
    { key: 'originator', label: 'Originator', type: 'text', required: true },
    { key: 'location', label: 'Location', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'hazard_category_id', label: 'Hazard Category', type: 'select', options: HAZARD_CATEGORIES, required: true },
    { key: 'responsible_person', label: 'Responsible Person', type: 'text', required: true },
    { key: 'risk_rating_id', label: 'Risk Rating', type: 'select', options: RISK_RATINGS, required: true },
    { key: 'unsafe_type', label: 'Unsafe Type', type: 'text' },
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
    { key: 'month', label: 'Month', type: 'text', required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'department_id', label: 'Department', type: 'select', options: DEPARTMENTS, required: true },
    { key: 'reported_by', label: 'Reported By', type: 'text', required: true },
    { key: 'designation', label: 'Designation', type: 'text', required: true },
    { key: 'affected_person', label: 'Affected Person', type: 'text' },
    { key: 'affected_designation', label: 'Affected Designation', type: 'text' },
    { key: 'time', label: 'Time', type: 'text', required: true },
    { key: 'location', label: 'Location', type: 'text', required: true },
    { key: 'details', label: 'Details', type: 'textarea', required: true },
    { key: 'preventive_action', label: 'Preventive Action', type: 'textarea' },
    { key: 'responsible_person', label: 'Responsible Person', type: 'text' },
    { key: 'investigation_required', label: 'Investigation Required', type: 'select', options: ['Yes', 'No'] },
    { key: 'reported_in_hazard', label: 'Reported in Hazard', type: 'select', options: ['Yes', 'No'] },
    { key: 'status_id', label: 'Status', type: 'select', options: STATUSES, required: true },
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
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'shift', label: 'Shift', type: 'text', required: true },
    { key: 'area_manager', label: 'Area Manager', type: 'text', required: true },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { key: 'location', label: 'Location', type: 'text', required: true },
    { key: 'department_id', label: 'Department', type: 'select', options: DEPARTMENTS, required: true },
    { key: 'incident_category_id', label: 'Incident Category', type: 'select', options: INCIDENT_CATEGORIES, required: true },
    { key: 'root_cause_id', label: 'Root Cause', type: 'select', options: ROOT_CAUSES, required: true },
    { key: 'action_items', label: 'Action Items', type: 'textarea' },
    { key: 'responsible_person', label: 'Responsible Person', type: 'text' },
    { key: 'risk_rating_id', label: 'Risk Rating', type: 'select', options: RISK_RATINGS, required: true },
    { key: 'timeline', label: 'Timeline', type: 'text' },
    { key: 'status_id', label: 'Status', type: 'select', options: STATUSES, required: true }
  ]
};

// 4. Action Tracker
export const actionTrackerSchema: SectionConfig = {
  id: 'action-tracker',
  title: 'Action Tracker',
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
    { key: 'topic', label: 'Topic', type: 'text', required: true },
    { key: 'participants', label: 'Participants', type: 'number', required: true },
    { key: 'duration_minutes', label: 'Duration (Minutes)', type: 'number', required: true },
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
    { key: 'total_manhours', label: 'Total Manhours', type: 'number' },
    { key: 'remarks', label: 'Remarks', type: 'textarea' }
  ]
};

export const ALL_SECTIONS = [
  hazardReportingSchema,
  nearMissSchema,
  incidentLogSchema,
  actionTrackerSchema,
  trainingRecordsSchema
];
