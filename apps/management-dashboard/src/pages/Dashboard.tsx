import { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Layout } from '../components/Layout';
import { useFilters } from '../context/FilterContext';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, FileWarning, Timer, TrendingUp, TrendingDown } from 'lucide-react';
import { moduleService } from '../services/api/moduleService';
import { CHART_COLORS } from '../config/constants';
import { AnimatedCounter } from '../components/AnimatedCounter';

const PIE_COLORS_STATUS = [CHART_COLORS.success, CHART_COLORS.maroon, CHART_COLORS.amber, CHART_COLORS.softGrey];

const StatCard = ({ title, value, icon, trend, trendValue, color, delayClass }: any) => (
  <div className={`glass-panel rounded-2xl p-6 border-t-4 hover-lift animate-fade-in-up ${delayClass}`} style={{ borderTopColor: color || CHART_COLORS.primary }}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-xl bg-opacity-10 backdrop-blur-md" style={{ backgroundColor: `${color}1A`, color: color || CHART_COLORS.primary }}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trend === 'up' ? 'badge-success' : trend === 'down' ? 'badge-danger' : 'badge-neutral'}`}>
          {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
          {trendValue} vs last mo.
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
      <p className="text-4xl font-bold text-foreground">
        <AnimatedCounter value={value} duration={1500} />
      </p>
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
  const openHazards = hazards.filter(h => h.status_id !== 'Close').length;
  const pendingInvestigationNearMisses = nearMisses.filter(nm => nm.status_id === 'Open').length;
  
  const overdueCapas = capas.filter(c => {
    if (c.status_id === 'Close') return false;
    if (!c.target_date) return false;
    return new Date(c.target_date) < new Date();
  }).length;

  const totalTrainingManhours = training.reduce((sum, t) => sum + (Number(t.total_manhours) || 0), 0);
  const closureRateCAPA = capas.length > 0 ? Math.round((capas.filter(c => c.status_id === 'Close').length / capas.length) * 100) : 0;
  
  // Chart Data
  const statusData = [
    { name: 'Closed', value: capas.filter(c => c.status_id === 'Close').length },
    { name: 'Open', value: capas.filter(c => c.status_id === 'Open').length },
    { name: 'In Progress', value: capas.filter(c => c.status_id === 'Work in Progress').length },
    { name: 'Pending', value: capas.filter(c => c.status_id === 'Pending').length }
  ].filter(item => item.value > 0);

  const deptCounts = hazards.reduce((acc, curr) => {
    if (curr.department_id) acc[curr.department_id] = (acc[curr.department_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const deptData = Object.keys(deptCounts).map(key => ({ name: key, count: deptCounts[key] })).slice(0, 5);

  // Lagging Indicators 5 Categories
  const laggingData = [
    { name: 'First Aid', value: incidents.filter(i => i.incident_category_id === 'First Aid').length, color: CHART_COLORS.info },
    { name: 'MTC', value: incidents.filter(i => i.incident_category_id === 'Medical Treatment Case (MTC)' || i.incident_category_id === 'MTC').length, color: CHART_COLORS.amber },
    { name: 'LTI', value: incidents.filter(i => i.incident_category_id === 'LTI' || i.incident_category_id === 'Lost Time Injury').length, color: CHART_COLORS.caramel },
    { name: 'RWC', value: incidents.filter(i => i.incident_category_id === 'RWC' || i.incident_category_id === 'Restricted Work Case').length, color: CHART_COLORS.warning },
    { name: 'Fatality', value: incidents.filter(i => i.incident_category_id === 'Fatality').length, color: CHART_COLORS.danger }
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-10">
        
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Overdue CAPAs" value={overdueCapas} 
            icon={<Timer className="h-6 w-6" />} color={CHART_COLORS.danger} 
            trend="down" trendValue="5%" delayClass="animate-fade-in-up"
          />
          <StatCard 
            title="Pending Near Misses" value={pendingInvestigationNearMisses} 
            icon={<Clock className="h-6 w-6" />} color={CHART_COLORS.amber} 
            trend="neutral" trendValue="0%" delayClass="animate-fade-in-up-delay-1"
          />
          <StatCard 
            title="Open Hazards" value={openHazards} 
            icon={<FileWarning className="h-6 w-6" />} color={CHART_COLORS.caramel} 
            trend="up" trendValue="12%" delayClass="animate-fade-in-up-delay-2"
          />
          <StatCard 
            title="Total Training Hrs" value={totalTrainingManhours} 
            icon={<ShieldCheck className="h-6 w-6" />} color={CHART_COLORS.success} 
            trend="up" trendValue="24%" delayClass="animate-fade-in-up-delay-3"
          />
        </div>

        {/* Leading vs Lagging Summary Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up-delay-2">
          {/* Leading Indicators */}
          <div className="glass-panel border-t-4 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden group" style={{ borderTopColor: CHART_COLORS.success }}>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 bg-success/5 w-40 h-40 rounded-full blur-3xl group-hover:bg-success/10 transition-colors duration-500"></div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
              <div className="p-2 bg-success/10 text-success rounded-lg"><CheckCircle2 className="h-6 w-6"/></div>
              Leading Indicators
            </h2>
            <p className="text-sm text-muted-foreground mb-8">Proactive measures to prevent incidents</p>
            
            <div className="grid grid-cols-3 gap-6 mt-2 relative z-10">
              <div className="bg-background/50 rounded-xl p-4 border border-border hover-lift">
                <p className="text-3xl font-bold text-foreground"><AnimatedCounter value={hazards.length} duration={1200}/></p>
                <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">Hazards Reported</p>
              </div>
              <div className="bg-background/50 rounded-xl p-4 border border-border hover-lift">
                <p className="text-3xl font-bold text-foreground"><AnimatedCounter value={totalTrainingManhours} duration={1500}/></p>
                <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">Training Hours</p>
              </div>
              <div className="bg-background/50 rounded-xl p-4 border border-border hover-lift">
                <p className="text-3xl font-bold text-success"><AnimatedCounter value={closureRateCAPA} duration={1800} suffix="%"/></p>
                <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">CAPA Closure</p>
              </div>
            </div>
          </div>
          
          {/* Lagging Indicators (Numeric + Graphical) */}
          <div className="glass-panel border-t-4 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden group" style={{ borderTopColor: CHART_COLORS.danger }}>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 bg-danger/5 w-40 h-40 rounded-full blur-3xl group-hover:bg-danger/10 transition-colors duration-500"></div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
              <div className="p-2 bg-danger/10 text-danger rounded-lg"><AlertCircle className="h-6 w-6"/></div>
              Lagging Indicators
            </h2>
            <p className="text-sm text-muted-foreground mb-6">Reactive measures from past incidents</p>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              {/* Numeric Display Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-1/2">
                {laggingData.map((item, idx) => (
                  <div key={item.name} className="bg-background/50 rounded-xl p-3 border border-border hover-lift">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.name}</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      <AnimatedCounter value={item.value} duration={1000 + (idx * 200)}/>
                    </p>
                  </div>
                ))}
              </div>

              {/* Graphical Display */}
              <div className="w-full md:w-1/2 h-[200px] flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={laggingData} 
                      cx="50%" cy="50%" 
                      innerRadius={50} outerRadius={80} 
                      paddingAngle={4} 
                      dataKey="value"
                      stroke="none"
                    >
                      {laggingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                      itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up-delay-3">
          <div className="glass-panel rounded-2xl p-6 border border-border relative">
            <h3 className="text-lg font-bold text-foreground mb-6">CAPA Status Distribution</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={statusData} 
                    cx="50%" cy="50%" 
                    innerRadius={70} outerRadius={110} 
                    paddingAngle={4} 
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS_STATUS[index % PIE_COLORS_STATUS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-foreground font-medium ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Centered Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-4xl font-bold text-foreground"><AnimatedCounter value={capas.length} /></span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Total CAPA</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-6">Hazards by Department (Top 5)</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.amber} stopOpacity={1}/>
                      <stop offset="95%" stopColor={CHART_COLORS.maroon} stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 500 }} dx={-10} />
                  <RechartsTooltip 
                    cursor={{fill: 'var(--muted)', opacity: 0.5}}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="count" fill="url(#colorCount)" radius={[6, 6, 0, 0]} barSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};
