import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface Filters {
  year: string;
  auditType: string;
  department: string;
  status: string;
}

interface FilterContextType {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  // Try to grab department from auth state if it exists
  const authStateStr = localStorage.getItem('cbl-auth-storage');
  let initialDept = 'All';
  try {
    if (authStateStr) {
      const state = JSON.parse(authStateStr).state;
      if (state && state.user && state.user.department) {
        initialDept = state.user.department;
      }
    }
  } catch(e) {}

  const [filters, setFilters] = useState<Filters>({
    year: '2026',
    auditType: 'All',
    department: initialDept,
    status: 'All',
  });

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <FilterContext.Provider value={{ filters, setFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
