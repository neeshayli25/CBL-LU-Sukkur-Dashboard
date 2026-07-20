import { useState, useCallback } from 'react';
import { moduleService } from '../services/api/moduleService';

export const useModuleData = (schemaId: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!schemaId) return;
    setLoading(true);
    try {
      const response = await moduleService.getAll(schemaId);
      if (response.success) {
        setData(response.data);
        setError(null);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [schemaId]);

  const createRecord = async (record: any) => {
    try {
      const response = await moduleService.create(schemaId, record);
      if (response.success) {
        setData(prev => [...prev, response.data]);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const updateRecord = async (id: string, updates: any) => {
    try {
      const response = await moduleService.update(schemaId, id, updates);
      if (response.success) {
        setData(prev => prev.map(item => item.id === id ? response.data : item));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const response = await moduleService.delete(schemaId, id);
      if (response.success) {
        setData(prev => prev.filter(item => item.id !== id));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  return {
    data,
    loading,
    error,
    fetchAll,
    createRecord,
    updateRecord,
    deleteRecord
  };
};
