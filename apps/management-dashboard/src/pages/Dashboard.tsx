import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { Layout } from '../components/Layout';
import { CenterModal } from '../components/CenterModal';
import { DonutChartWithLegend } from '../components/DonutChartWithLegend';
import { useFilters } from '../context/FilterContext';
import { AlertCircle, Clock, CheckCircle2, FileWarning, Timer, Activity, HeartPulse, Flame, Calendar, ListTodo, ShieldAlert, Search, Users, BookOpen, TrendingUp, AlertTriangle, ArrowRight, Info, CheckCircle, XCircle } from 'lucide-react';
import { moduleService } from '../services/api/moduleService';

import { CHART_COLORS, PIE_COLORS } from '../config/constants';
import { useDashboardMetrics, type DashboardRawData, type MetricItem } from '../hooks/useDashboardMetrics';


const PIE_COLORS_STATUS = [CHART_COLORS.warning, CHART_COLORS.success, CHART_COLORS.danger];
const PIE_COLORS_RISK = [CHART_COLORS.info, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger];

const getStatusColor = (status?: string) => {
  switch(status) {
    case 'success': return 'text-success';
    case 'warning': return 'text-warning'; // or text-amber-500 depending on tailwind setup
    case 'danger': return 'text-danger';
    default: return 'text-muted-foreground';
  }
};

const getStatusBgColor = (status?: string) => {
  switch(status) {
    case 'success': return 'bg-success/10';
    case 'warning': return 'bg-warning/10';
    case 'danger': return 'bg-danger/10';
    default: return 'bg-muted/50';
  }
};

const MetricRow = ({ metric }: { metric: MetricItem }) => {
  const navigate = useNavigate();
  const isClickable = metric.path && !metric.isPendingModule;

  return (
    <div 
      onClick={() => isClickable && navigate(metric.path!)}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-4 border border-border/50 bg-card rounded-xl group transition-all ${isClickable ? 'cursor-pointer hover:bg-muted/30 hover:shadow-md hover:border-primary/30' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2 rounded-full flex-shrink-0 ${metric.bgClass || getStatusBgColor(metric.status)} ${metric.iconClass || getStatusColor(metric.status)}`}>
          {metric.status === 'success' && <CheckCircle className="w-5 h-5" />}
          {metric.status === 'warning' && <AlertTriangle className="w-5 h-5" />}
          {metric.status === 'danger' && <XCircle className="w-5 h-5" />}
          {(!metric.status || metric.status === 'neutral') && <Info className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <span className={`font-semibold text-sm block truncate ${isClickable ? 'text-foreground group-hover:text-primary transition-colors' : 'text-foreground'}`} title={metric.name}>
            {metric.name}
          </span>
          {metric.isPendingModule && (
            <span className="mt-1 inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/20">
              Pending Module
            </span>
          )}
        </div>
      </div>
      <div className="text-left sm:text-right flex flex-col sm:items-end flex-shrink-0 ml-11 sm:ml-0">
        <div className={`font-bold text-lg ${getStatusColor(metric.status)}`}>
          {metric.value} <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
        </div>
        {metric.target !== undefined && (
          <div className="text-xs text-muted-foreground mt-0.5">Target: {metric.target}</div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-card rounded-xl p-5 border-l-4 border-t border-r border-b border-border card-shadow flex flex-col justify-between ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] hover:bg-muted/30 transition-all' : ''}`} 
    style={{ borderLeftColor: color || CHART_COLORS.maroon }}
  >
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
  const navigate = useNavigate();
  const { filters } = useFilters();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Incidents');
  
  const [hazards, setHazards] = useState<any[]>([]);
  const [nearMisses, setNearMisses] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [capas, setCapas] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);

  const [rawData, setRawData] = useState<DashboardRawData>({
    hazards: [], nearMisses: [], incidents: [], capas: [], training: [], inspections: [], drills: [], legal: [], audits: []
  });

  const [isLeadingOpen, setIsLeadingOpen] = useState(false);
  const [isLaggingOpen, setIsLaggingOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [hRes, nmRes, incRes, capRes, trRes, insRes, drRes, legRes, audRes] = await Promise.all([
          moduleService.getAll('hazard-reporting'),
          moduleService.getAll('near-miss'),
          moduleService.getAll('incident-log'),
          moduleService.getAll('action-tracker'),
          moduleService.getAll('training-records'),
          moduleService.getAll('inspection-records'),
          moduleService.getAll('emergency-drills'),
          moduleService.getAll('legal-compliance'),
          moduleService.getAll('audit-management')
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

        // Keep original state for existing charts/tabs to work without refactoring everything
        setHazards(applyFilters(hRes.data));
        setNearMisses(applyFilters(nmRes.data));
        setIncidents(applyFilters(incRes.data));
        setCapas(applyFilters(capRes.data));
        setTraining(applyFilters(trRes.data));

        // Set raw data for new detail views
        setRawData({
          hazards: applyFilters(hRes.data),
          nearMisses: applyFilters(nmRes.data),
          incidents: applyFilters(incRes.data),
          capas: applyFilters(capRes.data),
          training: applyFilters(trRes.data),
          inspections: applyFilters(insRes.data),
          audits: applyFilters(audRes.data),
          drills: applyFilters(drRes.data),
          legal: applyFilters(legRes.data),
          totalOrgManhours: 500000 // Placeholder until setting is available
        });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters]);

  const { leadingMetricsDetail, laggingMetricsDetail } = useDashboardMetrics(rawData);

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
          {/* LEADING INDICATORS CARD */}
          <div 
            onClick={() => setIsLeadingOpen(true)}
            className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-6 flex flex-col justify-center items-center text-center cursor-pointer group hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              Full Breakdown <ArrowRight className="w-4 h-4 ml-1" />
            </div>
            <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2 group-hover:scale-105 transition-transform"><CheckCircle2 className="h-6 w-6"/> Leading Indicators</h2>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 mb-4">Proactive measures to prevent incidents</p>
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
          
          {/* LAGGING INDICATORS CARD */}
          <div 
            onClick={() => setIsLaggingOpen(true)}
            className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl p-6 flex flex-col justify-center items-center text-center cursor-pointer group hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-rose-700 dark:text-rose-400 text-xs font-semibold">
              Full Breakdown <ArrowRight className="w-4 h-4 ml-1" />
            </div>
            <h2 className="text-xl font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2 group-hover:scale-105 transition-transform"><AlertCircle className="h-6 w-6"/> Lagging Indicators</h2>
            <p className="text-sm text-rose-600 dark:text-rose-500 mb-4">Reactive measures from past incidents</p>
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
                <StatCard onClick={() => navigate('/incident-log')} title="Total Incidents" value={totalIncidents} icon={<AlertTriangle />} color={CHART_COLORS.danger} />
                <StatCard onClick={() => navigate('/incident-log')} title="This Month" value={incidentsThisMonth} icon={<Calendar />} color={CHART_COLORS.info} />
                <StatCard onClick={() => navigate('/incident-log')} title="Open Incidents" value={openIncidents} icon={<ListTodo />} color={CHART_COLORS.warning} />
                <StatCard onClick={() => navigate('/incident-log')} title="Closed Incidents" value={closedIncidents} icon={<CheckCircle2 />} color={CHART_COLORS.success} />
                <StatCard onClick={() => navigate('/incident-log')} title="First Aid Cases" value={firstAidCases} icon={<HeartPulse />} color={CHART_COLORS.mutedGreen} />
                <StatCard onClick={() => navigate('/incident-log')} title="MTC Cases" value={mtcCases} icon={<Activity />} color={CHART_COLORS.amber} />
                <StatCard onClick={() => navigate('/incident-log')} title="LTI Cases" value={ltiCases} icon={<TrendingUp />} color={CHART_COLORS.danger} />
                <StatCard onClick={() => navigate('/incident-log')} title="RWC Cases" value={rwcCases} icon={<ListTodo />} color={CHART_COLORS.caramel} />
                <StatCard onClick={() => navigate('/incident-log')} title="Fatalities" value={fatalities} icon={<AlertCircle />} color={CHART_COLORS.darkBrown} />
                <StatCard onClick={() => navigate('/incident-log')} title="Minor Fire" value={minorFires} icon={<Flame />} color={CHART_COLORS.danger} />
              </div>
            )}

            {activeTab === 'Hazards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard onClick={() => navigate('/hazard-reporting')} title="Total Hazards" value={totalHazards} icon={<FileWarning />} color={CHART_COLORS.amber} />
                <StatCard onClick={() => navigate('/hazard-reporting')} title="This Month" value={hazardsThisMonth} icon={<Calendar />} color={CHART_COLORS.info} />
                <StatCard onClick={() => navigate('/hazard-reporting')} title="Open Hazards" value={openHazards} icon={<ListTodo />} color={CHART_COLORS.warning} />
                <StatCard onClick={() => navigate('/hazard-reporting')} title="Closed Hazards" value={closedHazards} icon={<CheckCircle2 />} color={CHART_COLORS.success} />
                <StatCard onClick={() => navigate('/hazard-reporting')} title="High/Critical Risk" value={highCriticalHazards} icon={<ShieldAlert />} color={CHART_COLORS.danger} />
              </div>
            )}

            {activeTab === 'Near Misses' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard onClick={() => navigate('/near-miss')} title="Total Near Misses" value={totalNearMisses} icon={<Search />} color={CHART_COLORS.info} />
                <StatCard onClick={() => navigate('/near-miss')} title="This Month" value={nearMissesThisMonth} icon={<Calendar />} color={CHART_COLORS.mutedGreen} />
                <StatCard onClick={() => navigate('/near-miss')} title="Pending Investigation" value={pendingInvNearMisses} icon={<Clock />} color={CHART_COLORS.warning} />
              </div>
            )}

            {activeTab === 'Training' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard onClick={() => navigate('/training-records')} title="Total Sessions" value={totalTrainingSessions} icon={<BookOpen />} color={CHART_COLORS.success} />
                <StatCard onClick={() => navigate('/training-records')} title="This Month" value={trainingsThisMonth} icon={<Calendar />} color={CHART_COLORS.info} />
                <StatCard onClick={() => navigate('/training-records')} title="Total Manhours" value={totalTrainingManhours} icon={<Users />} color={CHART_COLORS.caramel} />
              </div>
            )}

            {activeTab === 'CAPA' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard onClick={() => navigate('/action-tracker')} title="Open CAPAs" value={totalOpenCapas} icon={<ListTodo />} color={CHART_COLORS.warning} />
                <StatCard onClick={() => navigate('/action-tracker')} title="Closed CAPAs" value={totalClosedCapas} icon={<CheckCircle2 />} color={CHART_COLORS.success} />
                <StatCard onClick={() => navigate('/action-tracker')} title="Overdue CAPAs" value={overdueCapas} icon={<Timer />} color={CHART_COLORS.danger} />
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
          
          <div 
            onClick={() => navigate('/incident-log')}
            className="bg-card p-5 rounded-xl border border-border card-shadow cursor-pointer hover:shadow-md hover:scale-[1.02] hover:bg-muted/30 transition-all"
          >
            <h3 className="text-sm font-semibold text-foreground mb-2 text-center">Incident Categories</h3>
            <div className="h-[220px]">
              <DonutChartWithLegend data={incCatData} colors={PIE_COLORS} size="sm" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/hazard-reporting')}
            className="bg-card p-5 rounded-xl border border-border card-shadow cursor-pointer hover:shadow-md hover:scale-[1.02] hover:bg-muted/30 transition-all"
          >
            <h3 className="text-sm font-semibold text-foreground mb-2 text-center">Hazard Risk Ratings</h3>
            <div className="h-[220px]">
              <DonutChartWithLegend data={riskData} colors={PIE_COLORS_RISK} size="sm" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/action-tracker')}
            className="bg-card p-5 rounded-xl border border-border card-shadow cursor-pointer hover:shadow-md hover:scale-[1.02] hover:bg-muted/30 transition-all"
          >
            <h3 className="text-sm font-semibold text-foreground mb-2 text-center">CAPA Status</h3>
            <div className="h-[220px]">
              <DonutChartWithLegend data={capaStatusData} colors={PIE_COLORS_STATUS} size="sm" />
            </div>
          </div>

        </div>

      </div>

      {/* Centered Modals for Detail Views */}
      <CenterModal 
        isOpen={isLeadingOpen} 
        onClose={() => setIsLeadingOpen(false)} 
        title="Leading Indicators Breakdown"
        description="Detailed view of proactive safety measures"
      >
        <div className="mb-8 h-64 bg-background/50 rounded-xl p-4 border border-border">
          <DonutChartWithLegend 
            data={leadingMetricsDetail.map(m => ({ 
              name: m.name, 
              value: typeof m.value === 'string' && m.value.includes('/') ? parseFloat(m.value.split('/')[0]) : parseFloat(String(m.value)) || 0
            }))}
            colors={PIE_COLORS}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {leadingMetricsDetail.map((metric) => (
            <div key={metric.id} className="flex-1 min-w-[280px] max-w-[400px] bg-card border border-border/50 rounded-lg shadow-sm">
              <MetricRow metric={metric} />
            </div>
          ))}
        </div>
      </CenterModal>

      <CenterModal 
        isOpen={isLaggingOpen} 
        onClose={() => setIsLaggingOpen(false)} 
        title="Lagging Indicators Breakdown"
        description="Detailed view of reactive safety measures"
      >
        <div className="mb-8 h-64 bg-background/50 rounded-xl p-4 border border-border">
          <DonutChartWithLegend 
            data={laggingMetricsDetail.map(m => ({ 
              name: m.name, 
              value: typeof m.value === 'string' && m.value.includes('/') ? parseFloat(m.value.split('/')[0]) : parseFloat(String(m.value)) || 0
            }))}
            colors={PIE_COLORS_STATUS}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {laggingMetricsDetail.map((metric) => (
            <div key={metric.id} className="flex-1 min-w-[280px] max-w-[400px] bg-card border border-border/50 rounded-lg shadow-sm">
              <MetricRow metric={metric} />
            </div>
          ))}
        </div>
      </CenterModal>
    </Layout>
  );
};

