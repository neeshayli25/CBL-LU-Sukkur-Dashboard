import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { apiService } from '../services/apiService';
import type { Observation } from '../data/mockData';
import { Search } from 'lucide-react';
import { DEPARTMENTS } from '../config/constants';

export const Observations = () => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local filters
  const [localFilters, setLocalFilters] = useState({
    department: 'All',
    status: 'All',
    priority: 'All'
  });

  useEffect(() => {
    const fetchObs = async () => {
      setLoading(true);
      try {
        // Here we'd normally pass the global filters from context if we wanted them to apply globally,
        // but for a dedicated list view, it's often better to show all and let local filters apply.
        // We'll fetch all and filter locally for demonstration.
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

  const filteredData = observations.filter(obs => {
    const matchesSearch = obs.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          obs.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = localFilters.department === 'All' || obs.department === localFilters.department;
    const matchesStatus = localFilters.status === 'All' || obs.status === localFilters.status;
    const matchesPriority = localFilters.priority === 'All' || obs.priority === localFilters.priority;
    
    return matchesSearch && matchesDept && matchesStatus && matchesPriority;
  });

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">All Observations</h1>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-border rounded-md text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <select 
              value={localFilters.department}
              onChange={(e) => setLocalFilters(prev => ({...prev, department: e.target.value}))}
              className="px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select 
              value={localFilters.priority}
              onChange={(e) => setLocalFilters(prev => ({...prev, priority: e.target.value}))}
              className="px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Title & Category</th>
                  <th className="px-6 py-4 font-medium">Department</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading observations...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No observations found matching criteria.</td>
                  </tr>
                ) : (
                  filteredData.map((obs) => (
                    <tr key={obs.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-muted-foreground">#{obs.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{obs.createdDate}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{obs.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{obs.category}</div>
                      </td>
                      <td className="px-6 py-4">{obs.department}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-medium
                          ${obs.priority === 'High' ? 'text-danger' : 
                            obs.priority === 'Medium' ? 'text-secondary' : 'text-success'}`}>
                          <span className={`h-2 w-2 rounded-full 
                            ${obs.priority === 'High' ? 'bg-danger' : 
                              obs.priority === 'Medium' ? 'bg-secondary' : 'bg-success'}`}></span>
                          {obs.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border
                          ${obs.status === 'Open' ? 'bg-danger/10 text-danger border-danger/20' : 
                            obs.status === 'In Progress' ? 'bg-secondary/10 text-secondary-foreground border-secondary/20' : 
                            'bg-success/10 text-success border-success/20'}`}>
                          {obs.status}
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
