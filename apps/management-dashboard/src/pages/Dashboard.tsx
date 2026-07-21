import { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Layout } from '../components/Layout';
import { useFilters } from '../context/FilterContext';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, FileWarning, Timer } from 'lucide-react';
import { moduleService } from '../services/api/moduleService';

import { CHART_COLORS } from '../config/constants';

const PIE_COLORS_STATUS = [CHART_COLORS.amber, CHART_COLORS.success, CHART_COLORS.danger];
const PIE_COLORS_PRIORITY = [CHART_COLORS.danger, CHART_COLORS.amber, CHART_COLORS.success];

const StatCard = ({ title, value, icon, trend, trendLabel, color }: any) => (
  <div className="bg-card rounded-xl p-5 border-l-4 border-t border-r border-b border-border card-shadow flex flex-col justify-between" style={{ borderLeftColor: color || CHART_COLORS.primary }}>
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="p-2 bg-muted/50 rounded-md" style={{ color: color || CHART_COLORS.primary }}>{icon}</div>
    </div>
    <div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {trend && (
        <p className={`text-xs mt-2 font-medium ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
          {trend === 'up' ? '↑' : '↓'} {trendLabel}
        </p>
      )}
    </div>
  </div>
);

export const Dashboard = () => {
  const { filters } = useFilters();
  const [loading, setLoading] = useState(true);
  
  const [hazards, setHazards] = useState<any[]>([]);
  const [nearMisses, setNearMisses] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [capas, setCapas] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [hRes, nmRes, incRes, capRes, trRes] = await Promise.all([
          moduleService.getAll('hazard-reporting'),
          moduleService.getAll('near-miss'),
          moduleService.getAll('incident-log'),
          moduleService.getAll('action-tracker'),
          moduleService.getAll('training-records'),
        ]);

        const applyFilters = (data: any[]) => {
          let filtered = [...data];
          if (filters.department && filters.department !== 'All') {
            filtered = filtered.filter(d => d.department_id === filters.department);
          }
          if (filters.year && filters.year !== 'All') {
            filtered = filtered.filter(d => d.date?.startsWith(filters.year) || d.target_date?.startsWith(filters.year));
          }
          if (filters.fromDate) {
            filtered = filtered.filter(d => {
              const recordDate = d.date || d.target_date;
              return recordDate && recordDate >= filters.fromDate;
            });
          }
          if (filters.toDate) {
            filtered = filtered.filter(d => {
              const recordDate = d.date || d.target_date;
              return recordDate && recordDate <= filters.toDate;
            });
          }
          return filtered;
        };

        setHazards(applyFilters(hRes.data));
        setNearMisses(applyFilters(nmRes.data));
        setIncidents(applyFilters(incRes.data));
        setCapas(applyFilters(capRes.data));
        setTraining(applyFilters(trRes.data));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Basic KPI computations
  const totalIncidents = incidents.length;
  const openHazards = hazards.filter(h => h.status_id !== 'Closed').length;
  const openNearMisses = nearMisses.filter(nm => nm.status_id !== 'Closed').length;
  
  const pendingInvestigationNearMisses = nearMisses.filter(nm => nm.status_id === 'Open').length;
  
  const overdueCapas = capas.filter(c => {
    if (c.status_id === 'Closed') return false;
    if (!c.target_date) return false;
    return new Date(c.target_date) < new Date();
  }).length;

  const totalTrainingManhours = training.reduce((sum, t) => sum + (Number(t.total_manhours) || 0), 0);
  
  const closureRateCAPA = capas.length > 0 ? Math.round((capas.filter(c => c.status_id === 'Closed').length / capas.length) * 100) : 0;
  
  // Chart Data
  const statusData = [
    { name: 'Open', value: capas.filter(c => c.status_id === 'Open').length },
    { name: 'Closed', value: capas.filter(c => c.status_id === 'Closed').length },
    { name: 'In Progress', value: capas.filter(c => c.status_id === 'In Progress').length }
  ];

  const deptCounts = hazards.reduce((acc, curr) => {
    if (curr.department_id) acc[curr.department_id] = (acc[curr.department_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const deptData = Object.keys(deptCounts).map(key => ({ name: key, count: deptCounts[key] })).slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Leading vs Lagging Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col justify-center items-center text-center">
            <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2"><CheckCircle2 className="h-6 w-6"/> Leading Indicators</h2>
            <p className="text-sm text-muted-foreground mb-4">Proactive measures to prevent incidents</p>
            <div className="flex gap-6 mt-2">
              <div>
                <p className="text-2xl font-bold text-foreground">{hazards.length}</p>
                <p className="text-xs text-muted-foreground">Hazards Reported</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalTrainingManhours}</p>
                <p className="text-xs text-muted-foreground">Training Hours</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{closureRateCAPA}%</p>
                <p className="text-xs text-muted-foreground">CAPA Closure</p>
              </div>
            </div>
          </div>
          
          <div className="bg-danger/5 border border-danger/20 rounded-xl p-6 flex flex-col justify-center items-center text-center">
            <h2 className="text-xl font-bold text-danger mb-2 flex items-center gap-2"><AlertCircle className="h-6 w-6"/> Lagging Indicators</h2>
            <p className="text-sm text-muted-foreground mb-4">Reactive measures from past incidents</p>
            <div className="flex gap-6 mt-2">
              <div>
                <p className="text-2xl font-bold text-foreground">{totalIncidents}</p>
                <p className="text-xs text-muted-foreground">Total Incidents</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{incidents.filter(i => i.incident_category_id === 'LTI').length}</p>
                <p className="text-xs text-muted-foreground">LTI</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{incidents.filter(i => i.incident_category_id === 'First Aid').length}</p>
                <p className="text-xs text-muted-foreground">First Aid</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Overdue CAPAs" value={overdueCapas} icon={<Timer />} color={CHART_COLORS.danger} />
          <StatCard title="Pending Near Misses" value={pendingInvestigationNearMisses} icon={<Clock />} color={CHART_COLORS.amber} />
          <StatCard title="Open Hazards" value={openHazards} icon={<FileWarning />} color={CHART_COLORS.caramel} />
          <StatCard title="Total Training Hrs" value={totalTrainingManhours} icon={<ShieldCheck />} color={CHART_COLORS.success} />
        </div>

        {/* Sections 2: Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-lg font-semibold text-foreground mb-4">CAPA Status Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS_STATUS[index % PIE_COLORS_STATUS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-lg font-semibold text-foreground mb-4">Hazards by Department (Top 5)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DFD3" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E5A4E' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E5A4E' }} />
                  <RechartsTooltip cursor={{fill: '#F4EFE6'}} />
                  <Bar dataKey="count" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};
