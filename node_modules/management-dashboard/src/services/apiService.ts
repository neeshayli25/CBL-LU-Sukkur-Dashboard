import { mockObservations, mockHseKpis, mockLaggingIndicators, mockLeadingIndicators } from '../data/mockData';
import type { Observation, HseKpis, LaggingIndicators, LeadingIndicators } from '../data/mockData';

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiService = {
  getObservations: async (filters?: any): Promise<Observation[]> => {
    await delay(300);
    let data = mockObservations;
    if (filters) {
      if (filters.year && filters.year !== 'All') {
        data = data.filter(o => o.createdDate.startsWith(filters.year));
      }
      if (filters.department && filters.department !== 'All') {
        data = data.filter(o => o.department === filters.department);
      }
      if (filters.status && filters.status !== 'All') {
        data = data.filter(o => o.status === filters.status);
      }
      if (filters.auditType && filters.auditType !== 'All') {
        data = data.filter(o => o.category === filters.auditType);
      }
    }
    return data;
  },

  getHseKpis: async (): Promise<HseKpis> => {
    await delay(300);
    return mockHseKpis;
  },

  getLaggingIndicators: async (): Promise<LaggingIndicators> => {
    await delay(300);
    return mockLaggingIndicators;
  },

  getLeadingIndicators: async (): Promise<LeadingIndicators> => {
    await delay(300);
    return mockLeadingIndicators;
  }
};
