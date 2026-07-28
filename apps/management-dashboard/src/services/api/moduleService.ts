import { apiClient } from '@cbl/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

const schemaToEndpoint: Record<string, string> = {
  'hazard-reporting': '/hazards',
  'near-miss': '/near-misses',
  'incident-log': '/incidents',
  'training-records': '/training',
  'action-tracker': '/corrective-actions',
  'audit-management': '/hse-audits',
  'inspection-records': '/inspections',
};

const getEndpoint = (schemaId: string): string => {
  const endpoint = schemaToEndpoint[schemaId];
  if (!endpoint) {
    throw new Error(`No endpoint mapped for schemaId: ${schemaId}`);
  }
  return endpoint;
};

export const moduleService = {
  getAll: async (schemaId: string, params?: any): Promise<ApiResponse<any[]>> => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.get(endpoint, { params });
    // Assuming backend returns { success: true, data: [...], message: "..." }
    // which aligns with ApiResponse utility from the backend.
    return response.data;
  },

  create: async (schemaId: string, record: any): Promise<ApiResponse<any>> => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.post(endpoint, record);
    return response.data;
  },

  update: async (schemaId: string, id: string, updates: any): Promise<ApiResponse<any>> => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.put(`${endpoint}/${id}`, updates);
    return response.data;
  },

  delete: async (schemaId: string, id: string): Promise<ApiResponse<null>> => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.delete(`${endpoint}/${id}`);
    return response.data;
  }
};
