import React, { useState } from 'react';
import { usePermissions } from '@cbl/auth';
import { FileText, Download, Filter, Calendar } from 'lucide-react';
import { DEPARTMENTS, STATUSES, RISK_RATINGS, INCIDENT_CATEGORIES } from '../config/constants';
import { exportCSV } from '../utils/exportUtils';
import { Layout } from '../components/Layout';

const REPORT_TYPES = [
  "Incident Report",
  "Monthly Incident Summary",
  "Annual HSE Summary",
  "Hazard Report",
  "Near Miss Report",
  "Training Summary",
  "CAPA Status Report",
  "Risk Distribution Report",
  "Incident Trend Analysis",
  "Department Performance"
];

export const Reports = () => {
  const { canExportCSV, isDepartmentRestricted, userDepartment } = usePermissions();
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  
  // Filters
  const [department, setDepartment] = useState(isDepartmentRestricted() ? userDepartment : 'All');
  const [month, setMonth] = useState('All');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState('All');
  const [riskRating, setRiskRating] = useState('All');
  const [incidentCategory, setIncidentCategory] = useState('All');

  const handleExport = async () => {
    // Map report types to schema id
    let schemaId = '';
    
    if (reportType.includes('Hazard')) schemaId = 'hazard-reporting';
    else if (reportType.includes('Near Miss')) schemaId = 'near-miss';
    else if (reportType.includes('Training')) schemaId = 'training-records';
    else if (reportType.includes('CAPA')) schemaId = 'action-tracker';
    else schemaId = 'incident-log';

    try {
      const res = await moduleService.getAll(schemaId);
      let data: any[] = res.data || [];

    // Apply generic filters
    if (department !== 'All') {
      data = data.filter(d => d.department_id === department);
    }
    if (status !== 'All') {
      data = data.filter(d => d.status_id === status);
    }
    if (riskRating !== 'All') {
      data = data.filter(d => d.risk_rating_id === riskRating);
    }
    if (incidentCategory !== 'All') {
      data = data.filter(d => d.incident_category_id === incidentCategory);
    }
    if (year !== 'All') {
      data = data.filter(d => d.date?.startsWith(year));
    }
    if (month !== 'All') {
      // Basic month filter matching "YYYY-MM"
      const monthFormatted = month.padStart(2, '0');
      data = data.filter(d => d.date?.startsWith(`${year}-${monthFormatted}`));
    }

    if (data.length === 0) {
      alert("No records found for the selected filters.");
      return;
    }

    // Fetch schema to get headers
    const schema = ALL_SECTIONS.find(s => s.id === schemaId);
    if (!schema) return;

    const headers = schema.columns.map(col => col.label);
    const csvRows = [];
    csvRows.push(headers.join(',')); // Header row

    for (const entry of data) {
      const row = schema.columns.map(col => {
        let val = entry[col.key] || '';
        val = val.toString().replace(/"/g, '""');
        if (val.search(/("|,|\n)/g) >= 0) {
          val = `"${val}"`;
        }
        return val;
      });
      csvRows.push(row.join(','));
    }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export report", err);
      alert("Failed to export report data.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Management Reports</h1>
          </div>
          
          {canExportCSV() && (
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </button>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" /> Report Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="col-span-1 md:col-span-2 lg:col-span-3 mb-2 border-b border-border pb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Select Report Type</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                className="w-full max-w-md bg-background border border-border rounded-md px-4 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none font-medium"
              >
                {REPORT_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Department</label>
              <select 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)}
                disabled={isDepartmentRestricted()}
                className={`w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none ${isDepartmentRestricted() ? 'bg-muted/50 cursor-not-allowed' : ''}`}
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Year</label>
              <select 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="All">All Time</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Month</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="All">All Year</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Risk Rating</label>
              <select 
                value={riskRating} 
                onChange={(e) => setRiskRating(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="All">All Ratings</option>
                {RISK_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Incident Category</label>
              <select 
                value={incidentCategory} 
                onChange={(e) => setIncidentCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="All">All Categories</option>
                {INCIDENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl text-center mt-6">
          <p className="text-primary font-medium">
            This system exports robust CSV data files intended for internal KPI tracking and audit purposes.
            Please ensure you have selected the appropriate filters before exporting.
          </p>
        </div>

      </div>
    </Layout>
  );
};
