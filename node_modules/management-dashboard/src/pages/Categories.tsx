import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { Layout } from '../components/Layout';
import { apiService } from '../services/apiService';
import { useFilters } from '../context/FilterContext';
import type { Observation } from '../data/mockData';
import { Tags } from 'lucide-react';
import { CHART_COLORS } from '../config/constants';

export const Categories = () => {
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

  const getCategoryData = () => {
    const counts = observations.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).map(k => ({ name: k, count: counts[k] })).sort((a, b) => b.count - a.count);
  };

  const categoryData = getCategoryData();

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <Tags className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Categories Overview</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card p-5 rounded-xl border border-border card-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-4">Observations by Category</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5DFD3" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6E5A4E' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#6E5A4E' }} width={120} />
                    <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="count" fill={CHART_COLORS.maroon} radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card p-5 rounded-xl border border-border card-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
              <div className="space-y-4">
                {categoryData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold text-lg">{item.count}</span>
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
