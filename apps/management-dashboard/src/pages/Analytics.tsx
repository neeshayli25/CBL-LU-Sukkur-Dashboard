import { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import { Layout } from '../components/Layout';
import { apiService } from '../services/apiService';
import { useFilters } from '../context/FilterContext';
import type { Observation } from '../data/mockData';
import { BarChart3, TrendingUp, ShieldCheck, Timer } from 'lucide-react';

import { PIE_COLORS } from '../config/constants';

export const Analytics = () => {
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

  if (loading) {
    return <Layout><div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div></Layout>;
  }

  // 1. Numeric Summaries
  const total = observations.length;
  const closed = observations.filter(o => o.status === 'Closed').length;
  const closureRate = total > 0 ? Math.round((closed / total) * 100) : 0;
  
  const closedObs = observations.filter(o => o.status === 'Closed');
  const avgDaysToClose = closedObs.length > 0 
    ? Math.round(closedObs.reduce((sum, obs) => sum + obs.daysToClose, 0) / closedObs.length) 
    : 0;

  const highPriority = observations.filter(o => o.priority === 'High').length;
  const highPriorityPct = total > 0 ? Math.round((highPriority / total) * 100) : 0;

  // 2. Graphical Summaries (Pie Charts)
  const getDistribution = (key: keyof Observation) => {
    const counts = observations.reduce((acc, curr) => {
      const val = curr[key] as string;
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  };

  const statusData = getDistribution('status');
  const priorityData = getDistribution('priority');
  const deptData = getDistribution('department');
  const categoryData = getDistribution('category');

  const ChartCard = ({ title, data }: { title: string, data: any[] }) => (
    <div className="bg-card p-5 rounded-lg border border-border card-shadow flex flex-col items-center">
      <h3 className="text-lg font-semibold text-foreground mb-2 w-full text-left">{title}</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Analytics Overview</h1>
        </div>
        
        {/* Numeric Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card p-5 rounded-lg border border-border card-shadow">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground"><ShieldCheck className="h-5 w-5"/> Closure Rate</div>
            <p className="text-3xl font-bold text-success">{closureRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Across filtered set</p>
          </div>
          <div className="bg-card p-5 rounded-lg border border-border card-shadow">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground"><Timer className="h-5 w-5"/> Avg Days to Close</div>
            <p className="text-3xl font-bold text-foreground">{avgDaysToClose} days</p>
            <p className="text-xs text-muted-foreground mt-1">For resolved issues</p>
          </div>
          <div className="bg-card p-5 rounded-lg border border-border card-shadow">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground"><TrendingUp className="h-5 w-5"/> High Priority</div>
            <p className="text-3xl font-bold text-danger">{highPriorityPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">Of total observations</p>
          </div>
          <div className="bg-card p-5 rounded-lg border border-border card-shadow">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground"><BarChart3 className="h-5 w-5"/> Total Logged</div>
            <p className="text-3xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground mt-1">In current filter</p>
          </div>
        </div>

        {/* Graphical Summaries */}
        <h2 className="text-xl font-bold text-primary mt-8 mb-4">Distribution Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <ChartCard title="By Status" data={statusData} />
          <ChartCard title="By Priority" data={priorityData} />
          <ChartCard title="By Department" data={deptData} />
          <ChartCard title="By Category / Audit Type" data={categoryData} />
        </div>
      </div>
    </Layout>
  );
};
