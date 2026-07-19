export type Priority = 'High' | 'Medium' | 'Low';
export type Status = 'Open' | 'In Progress' | 'Closed';

export interface Observation {
  id: number;
  title: string;
  department: string;
  priority: Priority;
  status: Status;
  createdDate: string;
  closedDate: string | null;
  daysToClose: number;
  category: string;
  rootCause: string;
  actionPlan: string;
}

export interface HseKpis {
  hazardReporting: { nearMiss: number; unsafeActs: number; hazardClosure: number };
  trainingManhours: number;
  incidentClosure: number;
  emergencyDrills: { internal: number; external: number };
  actionPlanClosure: number;
}

export interface LaggingIndicators {
  fatalIncidents: number;
  LTI: number;
  LTIR: number;
  RWC: number;
  MTC: number;
  TRIR: number;
  firstAid: number;
  fireIncidents: { major: number; minor: number };
}

export interface LeadingIndicators {
  hazardSpotting: number;
  nearMiss: number;
  unsafeActs: number;
  hazardClosure: number;
  trainingManhours: number;
  inspectionsAudits: number;
  incidentClosure: number;
  emergencyDrills: { internal: number; external: number };
  actionPlanClosure: number;
  legalCompliance: number;
}

export const mockObservations: Observation[] = [
  { id: 1, title: 'Slippery floor near oven 3', department: 'Operations', priority: 'Medium', status: 'Open', createdDate: '2026-07-10', closedDate: null, daysToClose: 0, category: 'Internal Audit', rootCause: 'Water leak', actionPlan: 'Fix leak and mop floor' },
  { id: 2, title: 'Exposed wiring on packaging line', department: 'Maintenance', priority: 'High', status: 'In Progress', createdDate: '2025-06-12', closedDate: null, daysToClose: 0, category: 'External Audit', rootCause: 'Wear and tear', actionPlan: 'Replace wiring harness' },
  { id: 3, title: 'Blocked fire exit in HR', department: 'HR', priority: 'High', status: 'Closed', createdDate: '2024-03-01', closedDate: '2024-03-02', daysToClose: 1, category: 'Internal Audit', rootCause: 'Improper storage', actionPlan: 'Relocate boxes' },
  { id: 4, title: 'Missing safety guard on mixer', department: 'PRODUCTION', priority: 'High', status: 'Open', createdDate: '2026-02-15', closedDate: null, daysToClose: 0, category: 'Walkthrough', rootCause: 'Broken bracket', actionPlan: 'Install new guard' },
  { id: 5, title: 'Spilled flour in storage area', department: 'Operations', priority: 'Low', status: 'Closed', createdDate: '2025-08-05', closedDate: '2025-08-05', daysToClose: 0, category: 'Internal Audit', rootCause: 'Torn bag', actionPlan: 'Clean up spill' },
  { id: 6, title: 'Broken chair in cafeteria', department: 'Finance', priority: 'Low', status: 'Open', createdDate: '2024-11-16', closedDate: null, daysToClose: 0, category: 'Walkthrough', rootCause: 'Old equipment', actionPlan: 'Order new chair' },
  { id: 7, title: 'Unlabeled chemical bottle', department: 'HSE', priority: 'Medium', status: 'Closed', createdDate: '2026-01-08', closedDate: '2026-01-09', daysToClose: 1, category: 'External Audit', rootCause: 'Label fell off', actionPlan: 'Print and apply new label' },
  { id: 8, title: 'Blocked aisle in warehouse', department: 'Sales', priority: 'Medium', status: 'Open', createdDate: '2025-04-10', closedDate: null, daysToClose: 0, category: 'Internal Audit', rootCause: 'Overstock', actionPlan: 'Clear aisle' },
  { id: 9, title: 'Fire extinguisher expired', department: 'IT', priority: 'High', status: 'In Progress', createdDate: '2026-05-20', closedDate: null, daysToClose: 0, category: 'External Audit', rootCause: 'Missed inspection', actionPlan: 'Replace unit' },
  { id: 10, title: 'Tripping hazard near desks', department: 'Department 4', priority: 'Low', status: 'Closed', createdDate: '2024-09-12', closedDate: '2024-09-13', daysToClose: 1, category: 'Walkthrough', rootCause: 'Loose cable', actionPlan: 'Tape cable down' },
];

export const mockHseKpis: HseKpis = {
  hazardReporting: { nearMiss: 15, unsafeActs: 22, hazardClosure: 85 },
  trainingManhours: 120,
  incidentClosure: 90,
  emergencyDrills: { internal: 2, external: 0 },
  actionPlanClosure: 75,
};

export const mockLaggingIndicators: LaggingIndicators = {
  fatalIncidents: 0,
  LTI: 1,
  LTIR: 0.5,
  RWC: 2,
  MTC: 3,
  TRIR: 1.2,
  firstAid: 10,
  fireIncidents: { major: 0, minor: 1 },
};

export const mockLeadingIndicators: LeadingIndicators = {
  hazardSpotting: 45,
  nearMiss: 15,
  unsafeActs: 22,
  hazardClosure: 85,
  trainingManhours: 120,
  inspectionsAudits: 8,
  incidentClosure: 90,
  emergencyDrills: { internal: 2, external: 0 },
  actionPlanClosure: 75,
  legalCompliance: 100,
};
