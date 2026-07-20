export const DEPARTMENTS = [
  'PROD',
  'QA',
  'PROJ',
  'STR',
  'ADMIN',
  'IT',
  'ENG',
  'HSE',
  'QC',
  'NPD',
  'ESD'
];

export const INCIDENT_CATEGORIES = [
  'First Aid',
  'MTC',
  'LTI',
  'RWC',
  'Fatality',
  'Minor Fire',
  'Significant Near Miss'
];

export const HAZARD_CATEGORIES = [
  'Electrical',
  'Fire',
  'Slip/Trip/Fall',
  'Improper Housekeeping',
  'Unauthorized Access',
  'Chemical',
  'Mechanical',
  'Behavioral',
  'Environmental'
];

export const ROOT_CAUSES = [
  'Human Error',
  'Unsafe Act',
  'Unsafe Condition',
  'Poor Housekeeping',
  'Improper PPE',
  'Equipment Failure',
  'No SOP/Procedure',
  'Training Gap'
];

export const RISK_RATINGS = [
  'Low',
  'Medium',
  'High',
  'Critical'
];

export const STATUSES = [
  'Pending',
  'WIP',
  'Closed',
  'Cancelled'
];

export const CHART_COLORS = {
  maroon: '#8C1D2B',
  amber: '#D9A441',
  caramel: '#C46A2F',
  mutedGreen: '#728C69',
  softGrey: '#A89891',
  darkBrown: '#2B1B17',
  danger: '#A7283B',
  success: '#2E7D32',
  info: '#1976D2',
  warning: '#F57F17'
};

// Common palette array for pie/donut charts
export const PIE_COLORS = [
  CHART_COLORS.maroon,
  CHART_COLORS.amber,
  CHART_COLORS.caramel,
  CHART_COLORS.mutedGreen,
  CHART_COLORS.softGrey,
  CHART_COLORS.darkBrown,
];
