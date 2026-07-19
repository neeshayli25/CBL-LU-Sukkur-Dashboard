import { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { Layout } from '../components/Layout';
import { useFilters } from '../context/FilterContext';
import { apiService } from '../services/apiService';
import type { Observation, HseKpis, LaggingIndicators, LeadingIndicators } from '../data/mockData';
import { AlertCircle, CheckCircle2, Clock, FileWarning } from 'lucide-react';

import { CHART_COLORS } from '../config/constants';

const PIE_COLORS_STATUS = [CHART_COLORS.danger, CHART_COLORS.amber, CHART_COLORS.success];
const PIE_COLORS_PRIORITY = [CHART_COLORS.danger, CHART_COLORS.amber, CHART_COLORS.success];

const StatCard = ({ title, value, icon, trend, trendLabel }: any) => (
  <div className="bg-card rounded-xl p-5 border-l-4 border-l-primary border-t border-r border-b border-border card-shadow flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="p-2 bg-muted rounded-md text-primary">{icon}</div>
    </div>
    <div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {trend && (
        <p className={`text-xs mt-2 font-medium ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
          {trend === 'up' ? '↑' : '↓'} {trendLabel} vs last month
        </p>
      )}
    </div>
  </div>
);

export const Dashboard = () => {
  const { filters } = useFilters();
  const [loading, setLoading] = useState(true);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [_, setHseKpis] = useState<HseKpis | null>(null);
  const [lagging, setLagging] = useState<LaggingIndicators | null>(null);
  const [leading, setLeading] = useState<LeadingIndicators | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [obs, hse, lag, lead] = await Promise.all([
          apiService.getObservations(filters),
          apiService.getHseKpis(),
          apiService.getLaggingIndicators(),
          apiService.getLeadingIndicators(),
        ]);
        setObservations(obs);
        setHseKpis(hse);
        setLagging(lag);
        setLeading(lead);
      } catch (error) {
        console.error("Error fetching data", error);
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

  // Derived Data for charts
  const totalObs = observations.length;
  const openObs = observations.filter(o => o.status === 'Open').length;
  const inProgressObs = observations.filter(o => o.status === 'In Progress').length;
  const closedObs = observations.filter(o => o.status === 'Closed').length;

  const statusData = [
    { name: 'Open', value: openObs },
    { name: 'In Progress', value: inProgressObs },
    { name: 'Closed', value: closedObs },
  ];

  const highPriority = observations.filter(o => o.priority === 'High').length;
  const medPriority = observations.filter(o => o.priority === 'Medium').length;
  const lowPriority = observations.filter(o => o.priority === 'Low').length;

  const priorityData = [
    { name: 'High', value: highPriority },
    { name: 'Medium', value: medPriority },
    { name: 'Low', value: lowPriority },
  ];

  const deptCounts = observations.reduce((acc, curr) => {
    acc[curr.department] = (acc[curr.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const deptData = Object.keys(deptCounts).map(key => ({ name: key, count: deptCounts[key] }));

  const trendData = [
    { name: 'Week 1', count: 4 },
    { name: 'Week 2', count: 7 },
    { name: 'Week 3', count: 3 },
    { name: 'Week 4', count: totalObs },
  ];

  const top5 = [...observations].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Section 1: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Observations" value={totalObs} icon={<FileWarning />} trend="up" trendLabel="12%" />
          <StatCard title="Open Observations" value={openObs} icon={<AlertCircle />} trend="down" trendLabel="5%" />
          <StatCard title="Overdue Observations" value={1} icon={<Clock />} trend="down" trendLabel="2%" />
          <StatCard title="Closed Observations" value={closedObs} icon={<CheckCircle2 />} trend="up" trendLabel="18%" />
        </div>

        {/* Sections 2, 3, 4: Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-lg font-semibold text-foreground mb-4">Observations by Status</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
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
            <h3 className="text-lg font-semibold text-foreground mb-4">Observations by Priority</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {priorityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS_PRIORITY[index % PIE_COLORS_PRIORITY.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-lg font-semibold text-foreground mb-4">Observations by Department</h3>
            <div className="h-[250px]">
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

        {/* Section 5 & 6: Trend and Top 5 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-5 rounded-xl border border-border card-shadow">
            <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DFD3" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E5A4E' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E5A4E' }} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="count" stroke={CHART_COLORS.maroon} strokeWidth={3} dot={{ r: 4, fill: CHART_COLORS.maroon }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-5 rounded-xl border border-border card-shadow overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 Recent Observations</h3>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Dept</th>
                    <th className="px-4 py-3 font-medium text-center">Days Open</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {top5.map((obs) => (
                    <tr key={obs.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{obs.createdDate}</td>
                      <td className="px-4 py-3 font-medium text-foreground truncate max-w-[150px]" title={obs.title}>{obs.title}</td>
                      <td className="px-4 py-3">{obs.department}</td>
                      <td className="px-4 py-3 text-center">{obs.daysToClose || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border
                          ${obs.status === 'Open' ? 'bg-danger/10 text-danger border-danger/20' : 
                            obs.status === 'In Progress' ? 'bg-secondary/10 text-secondary-foreground border-secondary/20' : 
                            'bg-success/10 text-success border-success/20'}`}>
                          {obs.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 7: HSE & Safety KPIs */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-4 mt-8">HSE & Safety KPIs</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Lagging Indicators */}
            <div className="bg-card p-6 rounded-xl border-t-4 border-t-danger border-l border-r border-b border-border card-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-danger" /> 
                Lagging Indicators
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Fatal</p>
                  <p className="text-2xl font-bold text-danger">{lagging?.fatalIncidents}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">LTI</p>
                  <p className="text-2xl font-bold text-foreground">{lagging?.LTI}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">LTIR</p>
                  <p className="text-2xl font-bold text-foreground">{lagging?.LTIR}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">TRIR</p>
                  <p className="text-2xl font-bold text-foreground">{lagging?.TRIR}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">RWC / MTC</p>
                  <p className="text-xl font-bold text-foreground">{lagging?.RWC} / {lagging?.MTC}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">First Aid</p>
                  <p className="text-xl font-bold text-foreground">{lagging?.firstAid}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border col-span-2 sm:col-span-2">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Fire Incidents (Maj/Min)</p>
                  <p className="text-xl font-bold text-foreground">{lagging?.fireIncidents.major} / {lagging?.fireIncidents.minor}</p>
                </div>
              </div>
            </div>

            {/* Leading Indicators */}
            <div className="bg-card p-6 rounded-xl border-t-4 border-t-secondary border-l border-r border-b border-border card-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-secondary" /> 
                Leading Indicators
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Hazard Spotting</p>
                  <p className="text-xl font-bold text-primary">{leading?.hazardSpotting}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Near Miss</p>
                  <p className="text-xl font-bold text-foreground">{leading?.nearMiss}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Unsafe Acts</p>
                  <p className="text-xl font-bold text-foreground">{leading?.unsafeActs}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Closure %</p>
                  <p className="text-xl font-bold text-success">{leading?.hazardClosure}%</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Training Hrs</p>
                  <p className="text-xl font-bold text-foreground">{leading?.trainingManhours}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Audits</p>
                  <p className="text-xl font-bold text-foreground">{leading?.inspectionsAudits}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-border col-span-2">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Drills (Int/Ext)</p>
                  <p className="text-xl font-bold text-foreground">{leading?.emergencyDrills.internal} / {leading?.emergencyDrills.external}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
};
