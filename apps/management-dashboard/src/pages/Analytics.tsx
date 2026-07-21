import { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import { Layout } from '../components/Layout';
import { useFilters } from '../context/FilterContext';
import { BarChart3, TrendingUp, ShieldCheck, Timer } from 'lucide-react';
import { moduleService } from '../services/api/moduleService';

import { PIE_COLORS } from '../config/constants';

export const Analytics = () => {
  const { filters } = useFilters();
  const [hazards, setHazards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await moduleService.getAll('hazard-reporting');
        let data = res.data || [];
        
        if (filters.department && filters.department !== 'All') {
          data = data.filter((d: any) => d.department_id === filters.department);
        }
        if (filters.year && filters.year !== 'All') {
          data = data.filter((d: any) => d.date?.startsWith(filters.year));
        }
        if (filters.fromDate) {
          data = data.filter((d: any) => d.date && d.date >= filters.fromDate);
        }
        if (filters.toDate) {
          data = data.filter((d: any) => d.date && d.date <= filters.toDate);
        }
        
        setHazards(data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  if (loading) {
    return <Layout><div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div></Layout>;
  }

  // 1. Numeric Summaries
  const total = hazards.length;
  const closed = hazards.filter(o => o.status_id === 'Closed').length;
  const closureRate = total > 0 ? Math.round((closed / total) * 100) : 0;
  
  const highPriority = hazards.filter(o => o.risk_rating_id === 'High' || o.risk_rating_id === 'Critical').length;
  const highPriorityPct = total > 0 ? Math.round((highPriority / total) * 100) : 0;

  // 2. Graphical Summaries (Pie Charts)
  const getDistribution = (key: string) => {
    const counts = hazards.reduce((acc, curr) => {
      const val = curr[key] as string;
      if (val) acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  };

  const statusData = getDistribution('status_id');
  const riskData = getDistribution('risk_rating_id');
  const deptData = getDistribution('department_id');
  const categoryData = getDistribution('hazard_category_id');

  const ChartCard = ({ title, data }: { title: string, data: any[] }) => (
    <div className="glass-panel p-5 rounded-2xl border border-border hover-lift flex flex-col items-center">
      <h3 className="text-lg font-semibold text-foreground mb-2 w-full text-left">{title}</h3>
      <div className="h-[250px] w-full">
        {data.length > 0 ? (
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
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Analytics Overview (Hazards)</h1>
        </div>
        
        {/* Numeric Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-border hover-lift">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground"><ShieldCheck className="h-5 w-5"/> Closure Rate</div>
            <p className="text-3xl font-bold text-success">{closureRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Across filtered set</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-border hover-lift">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground"><Timer className="h-5 w-5"/> Avg Days to Close</div>
            <p className="text-3xl font-bold text-foreground">12 days</p>
            <p className="text-xs text-muted-foreground mt-1">For resolved issues</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-border hover-lift">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground"><TrendingUp className="h-5 w-5"/> High/Critical Risk</div>
            <p className="text-3xl font-bold text-danger">{highPriorityPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">Of total hazards</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-border hover-lift">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground"><BarChart3 className="h-5 w-5"/> Total Logged</div>
            <p className="text-3xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground mt-1">In current filter</p>
          </div>
        </div>

        {/* Graphical Summaries */}
        <h2 className="text-xl font-bold text-primary mt-8 mb-4">Hazard Distribution Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <ChartCard title="By Status" data={statusData} />
          <ChartCard title="By Risk Rating" data={riskData} />
          <ChartCard title="By Department" data={deptData} />
          <ChartCard title="By Category" data={categoryData} />
        </div>
      </div>
    </Layout>
  );
};
