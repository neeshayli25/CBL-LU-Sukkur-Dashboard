import { apiClient } from '@cbl/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

/** Plant log-sheet modules are served from /log-sheets/:moduleId */
const getEndpoint = (schemaId: string): string => {
  if (!schemaId) throw new Error('schemaId is required');
  return `/log-sheets/${schemaId}`;
};

const toApiError = (err: any, fallback: string): ApiResponse<any> => ({
  success: false,
  message: err?.response?.data?.message || err?.message || fallback,
  data: null,
});

export const moduleService = {
  getAll: async (schemaId: string, params?: Record<string, unknown>): Promise<ApiResponse<any[]>> => {
    try {
      const endpoint = getEndpoint(schemaId);
      const response = await apiClient.get(endpoint, {
        params: { limit: 5000, ...(params || {}) },
      });
      const payload = response.data;
      return {
        success: payload?.success !== false,
        message: payload?.message || 'Records loaded successfully.',
        data: Array.isArray(payload?.data) ? payload.data : payload?.data?.rows || [],
        meta: payload?.meta || payload?.data?.meta,
      };
    } catch (err: any) {
      return { ...toApiError(err, 'Failed to load records'), data: [] };
    }
  },

  create: async (schemaId: string, record: any): Promise<ApiResponse<any>> => {
    try {
      const endpoint = getEndpoint(schemaId);
      const response = await apiClient.post(endpoint, record);
      return response.data;
    } catch (err: any) {
      return toApiError(err, 'Failed to create record');
    }
  },

  update: async (schemaId: string, id: string, updates: any): Promise<ApiResponse<any>> => {
    try {
      const endpoint = getEndpoint(schemaId);
      const response = await apiClient.put(`${endpoint}/${id}`, updates);
      return response.data;
    } catch (err: any) {
      return toApiError(err, 'Failed to update record');
    }
  },

  delete: async (schemaId: string, id: string): Promise<ApiResponse<null>> => {
    try {
      const endpoint = getEndpoint(schemaId);
      const response = await apiClient.delete(`${endpoint}/${id}`);
      return response.data;
    } catch (err: any) {
      return toApiError(err, 'Failed to delete record');
    }
  },

  updateStatus: async (schemaId: string, id: string, status: string, reason?: string) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.patch(`${endpoint}/${id}/status`, {
      status,
      status_id: status,
      reason,
    });
    return response.data;
  },

  restore: async (schemaId: string, id: string) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.post(`${endpoint}/${id}/restore`);
    return response.data;
  },

  bulk: async (schemaId: string, records: any[]) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.post(`${endpoint}/bulk`, { records });
    return response.data;
  },

  importFile: async (
    schemaId: string,
    file: File,
    options?: { sheetName?: string; headerRowIndex?: number; force?: boolean }
  ) => {
    const endpoint = getEndpoint(schemaId);
    const form = new FormData();
    form.append('file', file);
    if (options?.sheetName) form.append('sheetName', options.sheetName);
    if (options?.headerRowIndex != null) form.append('headerRowIndex', String(options.headerRowIndex));
    if (options?.force) form.append('force', 'true');
    const response = await apiClient.post(`${endpoint}/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  export: async (schemaId: string, params?: Record<string, unknown>) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.get(`${endpoint}/export`, {
      params: { format: 'csv', ...(params || {}) },
      responseType: 'blob',
    });
    return response.data;
  },

  kpiBundle: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get('/log-sheets/kpi-bundle', { params });
    return response.data;
  },
};
