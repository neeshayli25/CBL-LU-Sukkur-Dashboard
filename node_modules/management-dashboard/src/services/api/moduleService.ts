export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Helper to simulate network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const moduleService = {
  // Replace with real backend URL later: const API_URL = import.meta.env.VITE_API_URL;
  
  getAll: async (schemaId: string): Promise<ApiResponse<any[]>> => {
    await delay(300); // Simulate network
    const key = `cbl_data_${schemaId}`;
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : [];
    
    return {
      success: true,
      message: `${schemaId} records fetched successfully`,
      data
    };
  },

  create: async (schemaId: string, record: any): Promise<ApiResponse<any>> => {
    await delay(400); // Simulate network
    const key = `cbl_data_${schemaId}`;
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : [];
    
    const newRecord = {
      ...record,
      id: crypto.randomUUID(),
      s_no: `S-${data.length + 1001}`
    };
    
    // Default status initialization and logging
    if (newRecord.status_id) {
      newRecord.statusHistory = [{
        user: "System (Auto)",
        oldStatus: "None",
        newStatus: newRecord.status_id,
        timestamp: new Date().toISOString()
      }];
    }
    
    data.push(newRecord);
    localStorage.setItem(key, JSON.stringify(data));
    
    return {
      success: true,
      message: `Record created successfully in ${schemaId}`,
      data: newRecord
    };
  },

  update: async (schemaId: string, id: string, updates: any): Promise<ApiResponse<any>> => {
    await delay(400); // Simulate network
    const key = `cbl_data_${schemaId}`;
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : [];
    
    const index = data.findIndex((item: any) => item.id === id);
    if (index === -1) {
      return {
        success: false,
        message: `Record not found`,
        data: null
      };
    }
    
    data[index] = { ...data[index], ...updates };
    localStorage.setItem(key, JSON.stringify(data));
    
    return {
      success: true,
      message: `Record updated successfully`,
      data: data[index]
    };
  },

  delete: async (schemaId: string, id: string): Promise<ApiResponse<null>> => {
    await delay(400); // Simulate network
    const key = `cbl_data_${schemaId}`;
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : [];
    
    const newData = data.filter((item: any) => item.id !== id);
    localStorage.setItem(key, JSON.stringify(newData));
    
    return {
      success: true,
      message: `Record deleted successfully`,
      data: null
    };
  }
};
