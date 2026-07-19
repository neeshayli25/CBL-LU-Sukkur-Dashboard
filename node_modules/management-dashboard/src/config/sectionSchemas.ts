// No imports of React or lucide-react to keep this pure config

export interface ColumnSchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[]; // for select dropdowns
  required?: boolean;
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
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'date', label: 'Date Reported', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Closed'] }
    // Awaiting full columns from Excel
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
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    // Awaiting full columns from Excel
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
    { key: 'incidentId', label: 'Incident ID', type: 'text', required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    // Awaiting full columns from Excel
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
    { key: 'action', label: 'Action Item', type: 'text', required: true },
    { key: 'dueDate', label: 'Due Date', type: 'date' },
    // Awaiting full columns from Excel
  ]
};

// 5. Departmental Training
export const departmentalTrainingSchema: SectionConfig = {
  id: 'departmental-training',
  title: 'Departmental Training',
  path: '/departmental-training',
  accentColor: '#8A7D5C', // Warm Olive/Tan
  icon: 'Users',
  columns: [
    { key: 'department', label: 'Department', type: 'text', required: true },
    { key: 'date', label: 'Training Date', type: 'date', required: true },
    // Awaiting full columns from Excel
  ]
};

// 6. Activity Training
export const activityTrainingSchema: SectionConfig = {
  id: 'activity-training',
  title: 'Activity Training',
  path: '/activity-training',
  accentColor: '#D47A6A', // Soft Terracotta
  icon: 'Briefcase',
  columns: [
    { key: 'activity', label: 'Activity Name', type: 'text', required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    // Awaiting full columns from Excel
  ]
};

export const ALL_SECTIONS = [
  hazardReportingSchema,
  nearMissSchema,
  incidentLogSchema,
  actionTrackerSchema,
  departmentalTrainingSchema,
  activityTrainingSchema
];
