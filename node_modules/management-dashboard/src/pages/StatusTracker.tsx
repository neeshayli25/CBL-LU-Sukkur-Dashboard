import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { apiService } from '../services/apiService';
import type { Observation } from '../data/mockData';
import { Activity, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export const StatusTracker = () => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObs = async () => {
      try {
        const data = await apiService.getObservations();
        setObservations(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchObs();
  }, []);

  // Sort so Open/In Progress are first, then by date
  const sortedObs = [...observations].sort((a, b) => {
    if (a.status !== 'Closed' && b.status === 'Closed') return -1;
    if (a.status === 'Closed' && b.status !== 'Closed') return 1;
    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
  });

  const getDaysInStatus = (obs: Observation) => {
    if (obs.status === 'Closed') return obs.daysToClose;
    const created = new Date(obs.createdDate);
    // Use a mock current date relative to the mock data for realistic numbers
    const now = new Date('2026-07-20'); 
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Safety Status Tracker</h1>
        </div>
        
        <p className="text-muted-foreground max-w-3xl">
          Track the real-time resolution status of reported hazards and incidents. Items pending for more than 7 days are highlighted as overdue.
        </p>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="bg-card border border-border p-4 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-danger/10 text-danger rounded-full"><AlertTriangle className="h-6 w-6" /></div>
            <div>
              <p className="text-2xl font-bold">{observations.filter(o => o.status === 'Open').length}</p>
              <p className="text-sm text-muted-foreground">Action Required (Open)</p>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-secondary/10 text-secondary-foreground rounded-full"><Clock className="h-6 w-6" /></div>
            <div>
              <p className="text-2xl font-bold">{observations.filter(o => o.status === 'In Progress').length}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-success/10 text-success rounded-full"><CheckCircle2 className="h-6 w-6" /></div>
            <div>
              <p className="text-2xl font-bold">{observations.filter(o => o.status === 'Closed').length}</p>
              <p className="text-sm text-muted-foreground">Resolved Successfully</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Reported Hazard</th>
                <th className="px-6 py-4 font-medium">Date Reported</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Current Status</th>
                <th className="px-6 py-4 font-medium text-center">Days in Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading tracker...</td></tr>
              ) : (
                sortedObs.map((obs) => {
                  const days = getDaysInStatus(obs);
                  const isOverdue = obs.status !== 'Closed' && days > 7;
                  
                  return (
                    <tr key={obs.id} className={`border-b border-border transition-colors ${isOverdue ? 'bg-danger/5 hover:bg-danger/10' : 'hover:bg-muted/30'}`}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{obs.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{obs.rootCause} - {obs.actionPlan}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{obs.createdDate}</td>
                      <td className="px-6 py-4">{obs.department}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border
                          ${obs.status === 'Open' ? 'bg-danger/10 text-danger border-danger/20' : 
                            obs.status === 'In Progress' ? 'bg-secondary/10 text-secondary-foreground border-secondary/20' : 
                            'bg-success/10 text-success border-success/20'}`}>
                          {obs.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`font-bold ${isOverdue ? 'text-danger' : 'text-foreground'}`}>
                          {days} days
                        </div>
                        {isOverdue && <div className="text-[10px] text-danger uppercase tracking-wider font-bold mt-1">Overdue</div>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
