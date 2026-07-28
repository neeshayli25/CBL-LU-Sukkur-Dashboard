import { apiClient } from './apiClient';

export interface Plant {
  id: string;
  name: string;
  code: string;
  location: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const plantService = {
  getAll: async (params?: any) => {
    return apiClient.get('/plants', { params });
  },

  getActive: async () => {
    return apiClient.get('/plants/active');
  },

  getById: async (id: string) => {
    return apiClient.get(`/plants/${id}`);
  },

  create: async (data: Partial<Plant>) => {
    return apiClient.post('/plants', data);
  },

  update: async (id: string, data: Partial<Plant>) => {
    return apiClient.put(`/plants/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/plants/${id}`);
  }
};
