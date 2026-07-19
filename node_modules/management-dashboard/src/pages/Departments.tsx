import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { Layout } from '../components/Layout';
import { apiService } from '../services/apiService';
import { useFilters } from '../context/FilterContext';
import type { Observation } from '../data/mockData';
import { Building2 } from 'lucide-react';
import { CHART_COLORS } from '../config/constants';

export const Departments = () => {
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

  const getDeptData = () => {
    const counts = observations.reduce((acc, curr) => {
      acc[curr.department] = (acc[curr.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).map(k => ({ name: k, count: counts[k] })).sort((a, b) => b.count - a.count);
  };

  const deptData = getDeptData();

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Department Breakdown</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card p-5 rounded-xl border border-border card-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-4">Observations by Department</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DFD3" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6E5A4E', fontSize: 12 }} angle={-45} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6E5A4E' }} />
                    <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="count" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card p-5 rounded-xl border border-border card-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-4">Department Load</h3>
              <div className="space-y-4">
                {deptData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="font-bold text-lg text-primary">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
