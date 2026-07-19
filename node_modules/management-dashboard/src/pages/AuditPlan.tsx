import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ClipboardList } from 'lucide-react';
import { DEPARTMENTS } from '../config/constants';

export const AuditPlan = () => {
  const [loading, setLoading] = useState(true);

  // Synthesized audit plan data for demonstration since it's not in mockData.ts
  const mockAudits = [
    { id: 'A-01', type: 'Internal HSE Audit', department: 'PRODUCTION', date: '2026-08-15', auditor: 'Ali Raza', status: 'Scheduled' },
    { id: 'A-02', type: 'External ISO Audit', department: 'Operations', date: '2026-07-20', auditor: 'SGS Certification', status: 'In Progress' },
    { id: 'A-03', type: 'Fire Safety Walkthrough', department: 'HSE', date: '2026-07-10', auditor: 'Safety Officer', status: 'Completed' },
    { id: 'A-04', type: 'Electrical Inspection', department: 'Maintenance', date: '2026-09-05', auditor: 'WAPDA Inspector', status: 'Scheduled' },
    { id: 'A-05', type: 'Hygiene & Sanitization', department: 'HR', date: '2026-08-01', auditor: 'Internal QA', status: 'Scheduled' },
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Audit Plan & Schedule</h1>
        </div>

        <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Audit ID</th>
                  <th className="px-6 py-4 font-medium">Audit Type</th>
                  <th className="px-6 py-4 font-medium">Department</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Auditor</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading audit plan...</td>
                  </tr>
                ) : (
                  mockAudits.map((audit) => (
                    <tr key={audit.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-muted-foreground">{audit.id}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{audit.type}</td>
                      <td className="px-6 py-4">{audit.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{audit.date}</td>
                      <td className="px-6 py-4">{audit.auditor}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border
                          ${audit.status === 'Scheduled' ? 'bg-secondary/10 text-secondary-foreground border-secondary/20' : 
                            audit.status === 'In Progress' ? 'bg-primary/10 text-primary border-primary/20' : 
                            'bg-success/10 text-success border-success/20'}`}>
                          {audit.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};
