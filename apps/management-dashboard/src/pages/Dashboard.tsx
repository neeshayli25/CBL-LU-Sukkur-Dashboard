import { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { Layout } from '../components/Layout';
import { useFilters } from '../context/FilterContext';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, FileWarning, Timer, Activity, HeartPulse, Flame, Calendar, ListTodo, ShieldAlert, Search, Users, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';
import { moduleService } from '../services/api/moduleService';

import { CHART_COLORS, PIE_COLORS } from '../config/constants';

const PIE_COLORS_STATUS = [CHART_COLORS.warning, CHART_COLORS.success, CHART_COLORS.danger];
const PIE_COLORS_RISK = [CHART_COLORS.info, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger];

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-card rounded-xl p-5 border-l-4 border-t border-r border-b border-border card-shadow flex flex-col justify-between" style={{ borderLeftColor: color || CHART_COLORS.maroon }}>
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="p-2 bg-muted/50 rounded-md" style={{ color: color || CHART_COLORS.maroon }}>{icon}</div>
    </div>
    <div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

export const Dashboard = () => {
  const { filters } = useFilters();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Incidents');
  
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

  // --- Helper to check if a date is this month ---
  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  // --- KPI COMPUTATIONS ---
  
  // Incidents
  const totalIncidents = incidents.length;
  const firstAidCases = incidents.filter(i => i.incident_category_id === 'First Aid').length;
  const mtcCases = incidents.filter(i => i.incident_category_id === 'MTC').length;
  const ltiCases = incidents.filter(i => i.incident_category_id === 'LTI').length;
  const rwcCases = incidents.filter(i => i.incident_category_id === 'RWC').length;
  const fatalities = incidents.filter(i => i.incident_category_id === 'Fatality').length;
  const minorFires = incidents.filter(i => i.incident_category_id === 'Minor Fire').length;
  const incidentsThisMonth = incidents.filter(i => isThisMonth(i.date)).length;
  const openIncidents = incidents.filter(i => ['Open', 'Pending', 'Work in Progress'].includes(i.status_id)).length;
  const closedIncidents = incidents.filter(i => i.status_id === 'Close' || i.status_id === 'Closed').length;

  // Hazards
  const totalHazards = hazards.length;
  const openHazards = hazards.filter(h => ['Open', 'Pending', 'Work in Progress'].includes(h.status_id)).length;
  const closedHazards = hazards.filter(h => h.status_id === 'Close' || h.status_id === 'Closed').length;
  const highCriticalHazards = hazards.filter(h => ['High', 'Critical'].includes(h.risk_rating_id)).length;
  const hazardsThisMonth = hazards.filter(h => isThisMonth(h.date)).length;

  // Near Misses
  const totalNearMisses = nearMisses.length;
  const nearMissesThisMonth = nearMisses.filter(nm => isThisMonth(nm.date)).length;
  const pendingInvNearMisses = nearMisses.filter(nm => nm.investigation_required === 'Yes' && !['Close', 'Closed'].includes(nm.status_id)).length;

  // Training
  const totalTrainingSessions = training.length;
  const trainingsThisMonth = training.filter(t => isThisMonth(t.date)).length;
  const totalTrainingManhours = Math.round(training.reduce((sum, t) => sum + (Number(t.manhours) || 0), 0));

  // CAPA
  const totalOpenCapas = capas.filter(c => ['Open', 'Pending', 'Work in Progress'].includes(c.status_id)).length;
  const totalClosedCapas = capas.filter(c => c.status_id === 'Close' || c.status_id === 'Closed').length;
  const overdueCapas = capas.filter(c => {
    if (['Close', 'Closed'].includes(c.status_id)) return false;
    if (!c.due_date) return false;
    return new Date(c.due_date) < new Date();
  }).length;
  const closureRateCAPA = capas.length > 0 ? Math.round((totalClosedCapas / capas.length) * 100) : 0;


  // --- CHART DATA PREPARATION ---
  
  // 1. Monthly Trend Lines (Last 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    
    const incCount = incidents.filter(inc => { const dt = new Date(inc.date); return dt.getMonth() === m && dt.getFullYear() === y; }).length;
    const hazCount = hazards.filter(h => { const dt = new Date(h.date); return dt.getMonth() === m && dt.getFullYear() === y; }).length;
    const nmCount = nearMisses.filter(nm => { const dt = new Date(nm.date); return dt.getMonth() === m && dt.getFullYear() === y; }).length;
    
    trendData.push({ name: monthNames[m], Incidents: incCount, Hazards: hazCount, 'Near Misses': nmCount });
  }

  // 2. CAPA Status (Open, Closed, Overdue)
  const capaStatusData = [
    { name: 'Open (In Time)', value: totalOpenCapas - overdueCapas },
    { name: 'Closed', value: totalClosedCapas },
    { name: 'Overdue', value: overdueCapas }
  ];

  // 3. Dept-wise Incident Count
  const incDeptCounts = incidents.reduce((acc, curr) => {
    if (curr.department_id) acc[curr.department_id] = (acc[curr.department_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const incDeptData = Object.keys(incDeptCounts).map(k => ({ name: k, count: incDeptCounts[k] })).sort((a,b) => b.count - a.count).slice(0, 7);

  // 4. Hazard Category Distribution
  const hazCatCounts = hazards.reduce((acc, curr) => {
    if (curr.hazard_category_id) acc[curr.hazard_category_id] = (acc[curr.hazard_category_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const hazCatData = Object.keys(hazCatCounts).map(k => ({ name: k, count: hazCatCounts[k] })).sort((a,b) => b.count - a.count).slice(0, 5);

  // 5. Training Manhours by Department
  const trDeptHours = training.reduce((acc, curr) => {
    if (curr.department_id) acc[curr.department_id] = (acc[curr.department_id] || 0) + (Number(curr.manhours) || 0);
    return acc;
  }, {} as Record<string, number>);
  const trDeptData = Object.keys(trDeptHours).map(k => ({ name: k, count: Math.round(trDeptHours[k]) })).sort((a,b) => b.count - a.count).slice(0, 7);

  // 6. Incident Category Breakdown
  const incCatCounts = incidents.reduce((acc, curr) => {
    if (curr.incident_category_id) acc[curr.incident_category_id] = (acc[curr.incident_category_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const incCatData = Object.keys(incCatCounts).map(k => ({ name: k, value: incCatCounts[k] }));

  // 7. Risk Rating Distribution (Hazards & Incidents combined, or just Hazards)
  // According to RED, it doesn't specify, but Risk Rating usually applies to both. Let's use Hazards for this chart to ensure data variety.
  const riskCounts = hazards.reduce((acc, curr) => {
    if (curr.risk_rating_id) acc[curr.risk_rating_id] = (acc[curr.risk_rating_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const riskData = Object.keys(riskCounts).map(k => ({ name: k, value: riskCounts[k] }));


  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        
        {/* Leading vs Lagging Summary Panel (Compliant with Section 12.6) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col justify-center items-center text-center">
            <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2"><CheckCircle2 className="h-6 w-6"/> Leading Indicators</h2>
            <p className="text-sm text-muted-foreground mb-4">Proactive measures to prevent incidents</p>
            <div className="flex gap-6 mt-2">
              <div>
                <p className="text-2xl font-bold text-foreground">{totalHazards}</p>
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
                <p className="text-2xl font-bold text-foreground">{ltiCases}</p>
                <p className="text-xs text-muted-foreground">LTI</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{firstAidCases}</p>
                <p className="text-xs text-muted-foreground">First Aid</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed KPI Section (Compliant with Sections 12.1 - 12.5) */}
        <div className="space-y-4">
          <div className="flex border-b border-border overflow-x-auto hide-scrollbar">
            {['Incidents', 'Hazards', 'Near Misses', 'Training', 'CAPA'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab 
                    ? 'border-primary text-primary bg-primary/5' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {tab} KPIs
              </button>
            ))}
          </div>

          <div className="pt-2">
            {activeTab === 'Incidents' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <StatCard title="Total Incidents" value={totalIncidents} icon={<AlertTriangle />} color={CHART_COLORS.danger} />
                <StatCard title="This Month" value={incidentsThisMonth} icon={<Calendar />} color={CHART_COLORS.info} />
                <StatCard title="Open Incidents" value={openIncidents} icon={<ListTodo />} color={CHART_COLORS.warning} />
                <StatCard title="Closed Incidents" value={closedIncidents} icon={<CheckCircle2 />} color={CHART_COLORS.success} />
                <StatCard title="First Aid Cases" value={firstAidCases} icon={<HeartPulse />} color={CHART_COLORS.mutedGreen} />
                <StatCard title="MTC Cases" value={mtcCases} icon={<Activity />} color={CHART_COLORS.amber} />
                <StatCard title="LTI Cases" value={ltiCases} icon={<TrendingUp />} color={CHART_COLORS.danger} />
                <StatCard title="RWC Cases" value={rwcCases} icon={<ListTodo />} color={CHART_COLORS.caramel} />
                <StatCard title="Fatalities" value={fatalities} icon={<AlertCircle />} color={CHART_COLORS.darkBrown} />
                <StatCard title="Minor Fire" value={minorFires} icon={<Flame />} color={CHART_COLORS.danger} />
              </div>
            )}

            {activeTab === 'Hazards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Hazards" value={totalHazards} icon={<FileWarning />} color={CHART_COLORS.amber} />
                <StatCard title="This Month" value={hazardsThisMonth} icon={<Calendar />} color={CHART_COLORS.info} />
                <StatCard title="Open Hazards" value={openHazards} icon={<ListTodo />} color={CHART_COLORS.warning} />
                <StatCard title="Closed Hazards" value={closedHazards} icon={<CheckCircle2 />} color={CHART_COLORS.success} />
                <StatCard title="High/Critical Risk" value={highCriticalHazards} icon={<ShieldAlert />} color={CHART_COLORS.danger} />
              </div>
            )}

            {activeTab === 'Near Misses' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Near Misses" value={totalNearMisses} icon={<Search />} color={CHART_COLORS.info} />
                <StatCard title="This Month" value={nearMissesThisMonth} icon={<Calendar />} color={CHART_COLORS.mutedGreen} />
                <StatCard title="Pending Investigation" value={pendingInvNearMisses} icon={<Clock />} color={CHART_COLORS.warning} />
              </div>
            )}

            {activeTab === 'Training' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Sessions" value={totalTrainingSessions} icon={<BookOpen />} color={CHART_COLORS.success} />
                <StatCard title="This Month" value={trainingsThisMonth} icon={<Calendar />} color={CHART_COLORS.info} />
                <StatCard title="Total Manhours" value={totalTrainingManhours} icon={<Users />} color={CHART_COLORS.caramel} />
              </div>
            )}

            {activeTab === 'CAPA' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Open CAPAs" value={totalOpenCapas} icon={<ListTodo />} color={CHART_COLORS.warning} />
                <StatCard title="Closed CAPAs" value={totalClosedCapas} icon={<CheckCircle2 />} color={CHART_COLORS.success} />
                <StatCard title="Overdue CAPAs" value={overdueCapas} icon={<Timer />} color={CHART_COLORS.danger} />
              </div>
            )}
          </div>
        </div>

        {/* --- CHARTS SECTION (Compliant with Section 12.6) --- */}
        
        {/* Trend Line Chart - Full Width */}
        <div className="bg-card p-5 rounded-xl border border-border card-shadow">
          <h3 className="text-lg font-semibold text-foreground mb-6">Monthly Trends (Incidents, Hazards, Near Misses)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DFD3" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E5A4E' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E5A4E' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5dfd3' }} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="Incidents" stroke={CHART_COLORS.danger} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Hazards" stroke={CHART_COLORS.amber} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Near Misses" stroke={CHART_COLORS.info} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Bar Charts (3-col grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-4 text-center">Department-wise Incidents</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DFD3" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="count" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-4 text-center">Hazard Categories (Top 5)</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hazCatData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DFD3" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="count" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-4 text-center">Training Manhours by Dept</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DFD3" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="count" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Pie/Donut Charts (3-col grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-2 text-center">Incident Categories</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incCatData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {incCatData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-2 text-center">Hazard Risk Ratings</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} paddingAngle={2} dataKey="value">
                    {riskData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS_RISK[index % PIE_COLORS_RISK.length]} />)}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-2 text-center">CAPA Status</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={capaStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {capaStatusData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS_STATUS[index % PIE_COLORS_STATUS.length]} />)}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
};

