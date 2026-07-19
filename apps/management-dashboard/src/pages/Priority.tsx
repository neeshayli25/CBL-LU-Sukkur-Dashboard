import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { Layout } from '../components/Layout';
import { apiService } from '../services/apiService';
import { useFilters } from '../context/FilterContext';
import type { Observation } from '../data/mockData';
import { AlertCircle } from 'lucide-react';
import { CHART_COLORS } from '../config/constants';

export const Priority = () => {
  const { filters } = useFilters();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObs = async () => {
      setLoading(true);
      try {
        const data = await apiService.getObservations(filters);
        setObservations(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchObs();
  }, [filters]);

  const high = observations.filter(o => o.priority === 'High');
  const medium = observations.filter(o => o.priority === 'Medium');
  const low = observations.filter(o => o.priority === 'Low');

  const priorityData = [
    { name: 'High', count: high.length, fill: CHART_COLORS.danger },
    { name: 'Medium', count: medium.length, fill: CHART_COLORS.amber },
    { name: 'Low', count: low.length, fill: CHART_COLORS.success },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-danger" />
          <h1 className="text-2xl font-bold text-foreground">Priority Overview</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card p-5 rounded-xl border border-border card-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-4">Observation Count by Priority</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DFD3" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6E5A4E' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6E5A4E' }} />
                    <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card p-5 rounded-xl border border-border card-shadow flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Priority Breakdown</h3>
              
              <div className="flex-1 bg-danger/10 p-4 rounded-lg border border-danger/20 flex flex-col justify-center items-center">
                <span className="text-danger font-bold text-4xl mb-1">{high.length}</span>
                <span className="text-sm font-medium text-danger uppercase tracking-wider">High Priority</span>
              </div>
              
              <div className="flex-1 bg-secondary/10 p-4 rounded-lg border border-secondary/20 flex flex-col justify-center items-center">
                <span className="text-secondary font-bold text-4xl mb-1">{medium.length}</span>
                <span className="text-sm font-medium text-secondary-foreground uppercase tracking-wider">Medium Priority</span>
              </div>
              
              <div className="flex-1 bg-success/10 p-4 rounded-lg border border-success/20 flex flex-col justify-center items-center">
                <span className="text-success font-bold text-4xl mb-1">{low.length}</span>
                <span className="text-sm font-medium text-success uppercase tracking-wider">Low Priority</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
