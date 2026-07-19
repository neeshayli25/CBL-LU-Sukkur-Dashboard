import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { apiService } from '../services/apiService';
import { useFilters } from '../context/FilterContext';
import type { Observation } from '../data/mockData';
import { CheckSquare } from 'lucide-react';

export const Actions = () => {
  const { filters } = useFilters();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObs = async () => {
      setLoading(true);
      try {
        const data = await apiService.getObservations(filters);
        // Only show observations that have an action plan
        setObservations(data.filter(o => o.actionPlan));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchObs();
  }, [filters]);

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Actions & CAPA</h1>
        </div>

        <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Obs ID</th>
                  <th className="px-6 py-4 font-medium">Observation Title</th>
                  <th className="px-6 py-4 font-medium">Corrective / Preventive Action</th>
                  <th className="px-6 py-4 font-medium">Department</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading actions...</td>
                  </tr>
                ) : observations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No actions found for the current filters.</td>
                  </tr>
                ) : (
                  observations.map((obs) => (
                    <tr key={obs.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-muted-foreground">#{obs.id}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]" title={obs.title}>{obs.title}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{obs.actionPlan}</td>
                      <td className="px-6 py-4">{obs.department}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border
                          ${obs.status === 'Open' ? 'bg-danger/10 text-danger border-danger/20' : 
                            obs.status === 'In Progress' ? 'bg-secondary/10 text-secondary-foreground border-secondary/20' : 
                            'bg-success/10 text-success border-success/20'}`}>
                          {obs.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};
