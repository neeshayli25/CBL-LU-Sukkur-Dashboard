import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Layout }               from '../components/Layout';
import { CenterModal }          from '../components/CenterModal';
import { KpiTile }              from '../components/KpiTile';
import { FilterBar }            from '../components/FilterBar';
import { ContextHeader }        from '../components/ContextHeader';
import { StatusBadge }          from '../components/StatusBadge';
import { useFilters }           from '../context/FilterContext';
import {
  CheckCircle2, FileWarning, Timer,
  ListTodo, ShieldAlert,
  Users, BookOpen, AlertTriangle, ArrowRight,
  CheckCircle, XCircle, Info, RefreshCw,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { moduleService }        from '../services/api/moduleService';
import { CHART_COLORS, PIE_COLORS } from '../config/constants';
import { useDashboardMetrics, type DashboardRawData, type MetricItem } from '../hooks/useDashboardMetrics';


// ===== Enterprise Chart Tooltip =====
const EnterpriseTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-lg px-3 py-2"
         style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-[13px] font-medium">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-[#1A1818]">{p.name ? `${p.name}: ` : ''}{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ===== Metric Detail Row (for leading/lagging modals) =====
const MetricRow = ({ metric }: { metric: MetricItem }) => {
  const navigate = useNavigate();
  const isClickable = metric.path && !metric.isPendingModule;

  const iconEl =
    metric.status === 'success' ? <CheckCircle  className="w-4 h-4" /> :
    metric.status === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
    metric.status === 'danger'  ? <XCircle       className="w-4 h-4" /> :
                                  <Info          className="w-4 h-4" />;

  const iconBg =
    metric.status === 'success' ? { bg: '#ECFDF5', color: '#059669' } :
    metric.status === 'warning' ? { bg: '#FFFBEB', color: '#D97706' } :
    metric.status === 'danger'  ? { bg: '#FEF2F2', color: '#DC2626' } :
                                  { bg: '#F3F4F6', color: '#6B7280' };

  return (
    <div
      onClick={() => isClickable && navigate(metric.path!)}
      className={`flex items-center justify-between gap-4 py-3 px-4 border-b border-[#F3F4F6] last:border-0 ${
        isClickable ? 'cursor-pointer hover:bg-[#F9FAFB] transition-colors' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 rounded" style={{ backgroundColor: iconBg.bg, color: iconBg.color }}>
          {iconEl}
        </div>
        <div className="min-w-0">
          <span className="text-[13px] font-medium text-[#1A1818] block truncate">{metric.name}</span>
          {metric.isPendingModule && (
            <span className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wide">Pending Module</span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[15px] font-bold text-[#1A1818] tabular-nums">
          {metric.value}
          {metric.unit && <span className="text-[12px] font-normal text-[#9CA3AF] ml-1">{metric.unit}</span>}
        </div>
        {metric.target !== undefined && (
          <div className="text-[11px] text-[#9CA3AF]">Target: {metric.target}</div>
        )}
      </div>
    </div>
  );
};

// ===== Section Header =====
const SectionHeader = ({ title, onViewAll, onToggle, expanded }: {
  title: string; onViewAll?: () => void; onToggle?: () => void; expanded?: boolean;
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 rounded-full bg-[#CB0017]" />
      <h2 className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">{title}</h2>
    </div>
    <div className="flex items-center gap-2">
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[12px] font-medium text-[#CB0017] hover:underline transition-colors"
        >
          View Details <ArrowRight className="h-3 w-3" />
        </button>
      )}
      {onToggle && (
        <button onClick={onToggle} className="p-1 rounded hover:bg-[#F5F5F5] text-[#9CA3AF] hover:text-[#374151] transition-colors">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}
    </div>
  </div>
);

// ===== Enterprise Panel =====
const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-[#E0E0E0] rounded-lg ${className}`}
       style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}>
    {children}
  </div>
);

const PIE_COLORS_STATUS = [CHART_COLORS.warning, CHART_COLORS.success, CHART_COLORS.danger];
const PIE_COLORS_RISK   = [CHART_COLORS.info, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger];

export const Dashboard = () => {
  const navigate    = useNavigate();
  const { filters } = useFilters();
  const [loading,   setLoading]   = useState(true);
  const [isLeadingOpen, setIsLeadingOpen] = useState(false);
  const [isLaggingOpen, setIsLaggingOpen] = useState(false);

  const [hazards,    setHazards]    = useState<any[]>([]);
  const [nearMisses, setNearMisses] = useState<any[]>([]);
  const [incidents,  setIncidents]  = useState<any[]>([]);
  const [capas,      setCapas]      = useState<any[]>([]);
  const [training,   setTraining]   = useState<any[]>([]);

  const [rawData, setRawData] = useState<DashboardRawData>({
    hazards: [], nearMisses: [], incidents: [], capas: [],
    training: [], inspections: [], drills: [], legal: [], audits: []
  });

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
          moduleService.getAll('audit-management'),
        ]);

        const applyFilters = (data: any[]) => {
          let f = [...data];
          if (filters.department && filters.department !== 'All')
            f = f.filter(d => d.department_id === filters.department);
          if (filters.year && filters.year !== 'All')
            f = f.filter(d => d.date?.startsWith(filters.year) || d.target_date?.startsWith(filters.year));
          if (filters.fromDate)
            f = f.filter(d => { const dt = d.date || d.target_date; return dt && dt >= filters.fromDate; });
          if (filters.toDate)
            f = f.filter(d => { const dt = d.date || d.target_date; return dt && dt <= filters.toDate; });
          return f;
        };

        setHazards(applyFilters(hRes.data));
        setNearMisses(applyFilters(nmRes.data));
        setIncidents(applyFilters(incRes.data));
        setCapas(applyFilters(capRes.data));
        setTraining(applyFilters(trRes.data));

        setRawData({
          hazards:      applyFilters(hRes.data),
          nearMisses:   applyFilters(nmRes.data),
          incidents:    applyFilters(incRes.data),
          capas:        applyFilters(capRes.data),
          training:     applyFilters(trRes.data),
          inspections:  applyFilters(insRes.data),
          audits:       applyFilters(audRes.data),
          drills:       applyFilters(drRes.data),
          legal:        applyFilters(legRes.data),
          totalOrgManhours: 500000,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => {
      window.removeEventListener('dashboard-refresh', handleRefresh);
    };
  }, [filters]);

  const { leadingMetricsDetail, laggingMetricsDetail } = useDashboardMetrics(rawData);

  // ===== KPI Computations (unchanged business logic) =====
  const totalIncidents       = incidents.length;
  const ltiCases             = incidents.filter(i => i.incident_category_id === 'LTI').length;
  const firstAidCases        = incidents.filter(i => i.incident_category_id === 'First Aid').length;
  const fatalities           = incidents.filter(i => i.incident_category_id === 'Fatality').length;

  const totalHazards         = hazards.length;
  const highCriticalHazards  = hazards.filter(h => ['High', 'Critical'].includes(h.risk_rating_id)).length;

  const totalTrainingSessions  = training.length;
  const totalTrainingManhours  = Math.round(training.reduce((sum, t) => sum + (Number(t.manhours) || 0), 0));

  const totalOpenCapas   = capas.filter(c => ['Open', 'Pending', 'Work in Progress'].includes(c.status_id)).length;
  const totalClosedCapas = capas.filter(c => c.status_id === 'Close' || c.status_id === 'Closed').length;
  const overdueCapas     = capas.filter(c => {
    if (['Close','Closed'].includes(c.status_id)) return false;
    if (!c.due_date) return false;
    return new Date(c.due_date) < new Date();
  }).length;
  const closureRateCAPA  = capas.length > 0 ? Math.round((totalClosedCapas / capas.length) * 100) : 0;

  // ===== Chart Data (unchanged) =====
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const m = d.getMonth(), y = d.getFullYear();
    trendData.push({
      name: monthNames[m],
      Incidents:    incidents.filter(x => { const dt = new Date(x.date); return dt.getMonth()===m && dt.getFullYear()===y; }).length,
      Hazards:      hazards.filter(x => { const dt = new Date(x.date); return dt.getMonth()===m && dt.getFullYear()===y; }).length,
      'Near Misses': nearMisses.filter(x => { const dt = new Date(x.date); return dt.getMonth()===m && dt.getFullYear()===y; }).length,
    });
  }

  const capaStatusData = [
    { name: 'Open (In Time)', value: totalOpenCapas - overdueCapas },
    { name: 'Closed',         value: totalClosedCapas },
    { name: 'Overdue',        value: overdueCapas },
  ];

  const incDeptData = Object.entries(
    incidents.reduce((acc, c) => { if (c.department_id) acc[c.department_id] = (acc[c.department_id]||0)+1; return acc; }, {} as Record<string,number>)
  ).map(([name, count]) => ({ name, count: Number(count) })).sort((a,b)=>b.count-a.count).slice(0,7);

  const hazCatData = Object.entries(
    hazards.reduce((acc, c) => { if (c.hazard_category_id) acc[c.hazard_category_id] = (acc[c.hazard_category_id]||0)+1; return acc; }, {} as Record<string,number>)
  ).map(([name, count]) => ({ name, count: Number(count) })).sort((a,b)=>b.count-a.count).slice(0,6);

  const trDeptData = Object.entries(
    training.reduce((acc, c) => { if (c.department_id) acc[c.department_id] = (acc[c.department_id]||0)+(Number(c.manhours)||0); return acc; }, {} as Record<string,number>)
  ).map(([name, count]) => ({ name, count: Math.round(Number(count)) })).sort((a,b)=>b.count-a.count).slice(0,7);

  const incCatData = Object.entries(
    incidents.reduce((acc, c) => { if (c.incident_category_id) acc[c.incident_category_id]=(acc[c.incident_category_id]||0)+1; return acc; }, {} as Record<string,number>)
  ).map(([name, value]) => ({ name, value }));

  const riskData = Object.entries(
    hazards.reduce((acc, c) => { if (c.risk_rating_id) acc[c.risk_rating_id]=(acc[c.risk_rating_id]||0)+1; return acc; }, {} as Record<string,number>)
  ).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <RefreshCw className="h-8 w-8 text-[#CB0017] animate-spin" />
          <p className="text-[13px] text-[#6B7280]">Loading dashboard data…</p>
        </div>
      </Layout>
    );
  }

  // ===== Enterprise chart axis/grid styles =====
  const axisStyle = { fontSize: 11, fill: '#9CA3AF' };
  const gridStyle = { stroke: '#F0F0F0', strokeDasharray: '4 4' };

  return (
    <Layout>
      {/* Context Header */}
      <ContextHeader
        title="Executive Dashboard"
        breadcrumbs={['Dashboard']}
        subtitle={`Showing data for ${filters.department !== 'All' ? filters.department : 'all departments'} · ${filters.year !== 'All' ? filters.year : 'all time'}`}
      >
        <FilterBar />
      </ContextHeader>

      <div className="p-6 space-y-6">

        {/* ============ ROW 1 — KPI TILES ============ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiTile
            label="Total Incidents"
            value={totalIncidents}
            accent="danger"
            icon={<AlertTriangle />}
            trendLabel="total reported"
            onClick={() => navigate('/incident-log')}
          />
          <KpiTile
            label="Open CAPAs"
            value={totalOpenCapas}
            accent="warning"
            icon={<ListTodo />}
            trendLabel="require action"
            onClick={() => navigate('/action-tracker')}
          />
          <KpiTile
            label="Overdue Actions"
            value={overdueCapas}
            accent={overdueCapas > 0 ? 'danger' : 'success'}
            icon={<Timer />}
            trendLabel="past due date"
            onClick={() => navigate('/action-tracker')}
          />
          <KpiTile
            label="Training Manhours"
            value={totalTrainingManhours}
            unit="hrs"
            accent="success"
            icon={<BookOpen />}
            trendLabel="logged to date"
            onClick={() => navigate('/training-records')}
          />
          <KpiTile
            label="High-Risk Hazards"
            value={highCriticalHazards}
            accent={highCriticalHazards > 0 ? 'warning' : 'success'}
            icon={<ShieldAlert />}
            trendLabel="high & critical"
            onClick={() => navigate('/hazard-reporting')}
          />
          <KpiTile
            label="CAPA Closure Rate"
            value={closureRateCAPA}
            unit="%"
            accent={closureRateCAPA >= 80 ? 'success' : closureRateCAPA >= 50 ? 'warning' : 'danger'}
            icon={<CheckCircle2 />}
            trendLabel="of total CAPAs"
            onClick={() => navigate('/action-tracker')}
          />
        </div>

        {/* ============ ROW 2 — Leading / Lagging Summary ============ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Leading Indicators */}
          <Panel className="p-5">
            <SectionHeader
              title="Leading Indicators"
              onViewAll={() => setIsLeadingOpen(true)}
            />
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Hazards Reported', value: totalHazards,          icon: FileWarning,   path: '/hazard-reporting' },
                { label: 'Training Sessions', value: totalTrainingSessions, icon: Users,          path: '/training-records' },
                { label: 'CAPA Closure',      value: `${closureRateCAPA}%`, icon: CheckCircle2, path: '/action-tracker'   },
              ].map(({ label, value, icon: Icon, path }) => (
                <div
                  key={label}
                  onClick={() => navigate(path)}
                  className="flex flex-col items-center text-center cursor-pointer p-3 rounded-lg hover:bg-[#F9FAFB] transition-colors border border-[#F0F0F0]"
                >
                  <Icon className="h-5 w-5 text-[#1B7C1B] mb-2" />
                  <p className="text-[20px] font-bold text-[#1A1818] tabular-nums">{value}</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </Panel>

          {/* Lagging Indicators */}
          <Panel className="p-5">
            <SectionHeader
              title="Lagging Indicators"
              onViewAll={() => setIsLaggingOpen(true)}
            />
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total',     value: totalIncidents, color: '#6B7280' },
                { label: 'First Aid', value: firstAidCases,  color: '#DC8E00' },
                { label: 'LTI',       value: ltiCases,       color: '#CB0017' },
                { label: 'Fatality',  value: fatalities,     color: '#7F1D1D' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  onClick={() => navigate('/incident-log')}
                  className="flex flex-col items-center text-center cursor-pointer p-3 rounded-lg hover:bg-[#F9FAFB] transition-colors border border-[#F0F0F0]"
                >
                  <p className="text-[22px] font-bold tabular-nums" style={{ color }}>{value}</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ============ ROW 3 — TREND CHART + CAPA DONUT ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Safety Trends (60%) */}
          <Panel className="lg:col-span-3 p-5">
            <SectionHeader title="Safety Trends — Last 6 Months" />
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
              {[
                { label: 'Incidents',   color: CHART_COLORS.danger },
                { label: 'Hazards',     color: CHART_COLORS.amber  },
                { label: 'Near Misses', color: CHART_COLORS.info   },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-[#6B7280]">{label}</span>
                </div>
              ))}
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...gridStyle} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisStyle} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <RechartsTooltip content={<EnterpriseTooltip />} />
                  <Line type="monotone" dataKey="Incidents"   stroke={CHART_COLORS.danger} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="Hazards"     stroke={CHART_COLORS.amber}  strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="Near Misses" stroke={CHART_COLORS.info}   strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* CAPA Status Donut (40%) */}
          <Panel className="lg:col-span-2 p-5">
            <SectionHeader title="CAPA Status Distribution" onViewAll={() => navigate('/action-tracker')} />
            <div className="h-[240px] flex items-center justify-center">
              {capas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={capaStatusData}
                      cx="50%" cy="50%"
                      innerRadius={65} outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {capaStatusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS_STATUS[i % PIE_COLORS_STATUS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<EnterpriseTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-[#E0E0E0] mx-auto mb-2" />
                  <p className="text-[13px] text-[#9CA3AF]">No CAPA data</p>
                </div>
              )}
            </div>
            {/* Donut Legend */}
            <div className="flex flex-col gap-1.5 mt-2">
              {capaStatusData.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS_STATUS[i % PIE_COLORS_STATUS.length] }} />
                    <span className="text-[#374151]">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-[#1A1818] tabular-nums">{entry.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ============ ROW 4 — BAR CHARTS ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Department Incidents */}
          <Panel className="p-5">
            <SectionHeader title="Incidents by Department" onViewAll={() => navigate('/incident-log')} />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incDeptData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...gridStyle} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="count" name="Incidents" fill={CHART_COLORS.danger} radius={[3,3,0,0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Top Hazard Categories */}
          <Panel className="p-5">
            <SectionHeader title="Top Hazard Categories" onViewAll={() => navigate('/hazard-reporting')} />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hazCatData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...gridStyle} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="count" name="Hazards" fill={CHART_COLORS.amber} radius={[3,3,0,0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Training Hours by Dept */}
          <Panel className="p-5">
            <SectionHeader title="Training Manhours by Dept" onViewAll={() => navigate('/training-records')} />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trDeptData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...gridStyle} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="count" name="Hours" fill={CHART_COLORS.success} radius={[3,3,0,0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* ============ ROW 5 — DISTRIBUTION PIE CHARTS ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { title: 'Incident Categories', data: incCatData,    colors: PIE_COLORS,        path: '/incident-log'      },
            { title: 'Hazard Risk Ratings', data: riskData,      colors: PIE_COLORS_RISK,   path: '/hazard-reporting'  },
          ].map(({ title, data, colors, path }) => (
            <Panel key={title} className="p-5">
              <SectionHeader title={title} onViewAll={() => navigate(path)} />
              <div className="h-[200px]">
                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                        {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                      </Pie>
                      <RechartsTooltip content={<EnterpriseTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[13px] text-[#9CA3AF]">No data available</p>
                  </div>
                )}
              </div>
              {/* Compact legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {(data as Array<{ name: string; value: number }>).slice(0,5).map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </Panel>
          ))}

          {/* Recent Incidents Quick View */}
          <Panel className="p-5">
            <SectionHeader title="Recent Incidents" onViewAll={() => navigate('/incident-log')} />
            {incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-[#1B7C1B] mb-2 opacity-60" />
                <p className="text-[13px] font-medium text-[#374151]">No incidents recorded</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">All clear for the selected filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {incidents.slice(0,5).map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => navigate('/incident-log')}
                    className="flex items-center justify-between gap-3 p-2.5 rounded border border-[#F3F4F6] hover:border-[#E0E0E0] hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-[#1A1818] truncate">{inc.description || '—'}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{inc.date} · {inc.department_id}</p>
                    </div>
                    <StatusBadge status={inc.status_id || 'Open'} size="xs" />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

      </div>

      {/* ===== Detail Modals ===== */}
      <CenterModal
        isOpen={isLeadingOpen}
        onClose={() => setIsLeadingOpen(false)}
        title="Leading Indicators — Full Breakdown"
        description="Proactive safety measures and prevention metrics"
      >
        <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
          {leadingMetricsDetail.map(metric => (
            <MetricRow key={metric.id} metric={metric} />
          ))}
        </div>
      </CenterModal>

      <CenterModal
        isOpen={isLaggingOpen}
        onClose={() => setIsLaggingOpen(false)}
        title="Lagging Indicators — Full Breakdown"
        description="Reactive safety measures from past incidents"
      >
        <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
          {laggingMetricsDetail.map(metric => (
            <MetricRow key={metric.id} metric={metric} />
          ))}
        </div>
      </CenterModal>
    </Layout>
  );
};
