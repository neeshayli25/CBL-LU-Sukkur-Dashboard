import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { apiService } from '../services/apiService';
import { useFilters } from '../context/FilterContext';
import type { Observation } from '../data/mockData';
import { Calendar } from 'lucide-react';

export const DueDates = () => {
  const { filters } = useFilters();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObs = async () => {
      setLoading(true);
      try {
        const data = await apiService.getObservations(filters);
        // Generate mock due dates based on createdDate for open/in-progress items
        const withDueDates = data
          .filter(o => o.status !== 'Closed')
          .map(o => {
            const created = new Date(o.createdDate);
            const due = new Date(created);
            due.setDate(due.getDate() + 30); // Mock: Due 30 days after creation
            const today = new Date('2026-07-17'); // Simulated "today" based on mock data timeline
            
            const diffTime = due.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let urgency = 'Upcoming';
            if (diffDays < 0) urgency = 'Overdue';
            else if (diffDays <= 7) urgency = 'Due Soon';

            return { ...o, dueDate: due.toISOString().split('T')[0], diffDays, urgency };
          })
          .sort((a, b) => a.diffDays - b.diffDays);
          
        setObservations(withDueDates as any);
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
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Due Dates Tracker</h1>
        </div>

        <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Obs ID</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium">Due Date</th>
                  <th className="px-6 py-4 font-medium">Urgency</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading due dates...</td>
                  </tr>
                ) : observations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No pending actions found.</td>
                  </tr>
                ) : (
                  observations.map((obs: any) => (
                    <tr key={obs.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-muted-foreground">#{obs.id}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{obs.actionPlan || obs.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{obs.createdDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{obs.dueDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border
                          ${obs.urgency === 'Overdue' ? 'bg-danger/10 text-danger border-danger/20' : 
                            obs.urgency === 'Due Soon' ? 'bg-secondary/10 text-secondary-foreground border-secondary/20' : 
                            'bg-muted text-muted-foreground border-border'}`}>
                          {obs.urgency}
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
