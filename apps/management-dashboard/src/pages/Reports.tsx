import { useState } from 'react';
import { usePermissions } from '@cbl/auth';
import { FileText, Download, Filter, Printer, Table as TableIcon } from 'lucide-react';
import { DEPARTMENTS, STATUSES, RISK_RATINGS, INCIDENT_CATEGORIES } from '../config/constants';
import { Layout } from '../components/Layout';
import { moduleService } from '../services/api/moduleService';
import { ALL_SECTIONS } from '../config/sectionSchemas';

const REPORT_TYPES = [
  "Incident Log",
  "Hazard Reporting",
  "Near Miss",
  "Training Records",
  "Actions / CAPA"
];

export const Reports = () => {
  const { canExportCSV, isDepartmentRestricted, userDepartment } = usePermissions();
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  
  // Filters
  const [department, setDepartment] = useState(isDepartmentRestricted() ? userDepartment : 'All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('All');
  const [riskRating, setRiskRating] = useState('All');
  const [incidentCategory, setIncidentCategory] = useState('All');

  // Preview State
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewSchema, setPreviewSchema] = useState<any>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const getSchemaIdForReport = (rt: string) => {
    if (rt === 'Hazard Reporting') return 'hazard-reporting';
    if (rt === 'Near Miss') return 'near-miss';
    if (rt === 'Training Records') return 'training-records';
    if (rt === 'Actions / CAPA') return 'action-tracker';
    return 'incident-log';
  };

  const currentSchemaId = getSchemaIdForReport(reportType);
  const currentSchema = ALL_SECTIONS.find(s => s.id === currentSchemaId);

  // Dynamic filter visibility
  const showRiskFilter = ['incident-log', 'hazard-reporting'].includes(currentSchemaId);
  const showCategoryFilter = currentSchemaId === 'incident-log';
  const showStatusFilter = currentSchemaId !== 'training-records'; // Training has no status in RED technically, but it's fine to leave if it exists

  const fetchAndFilterData = async () => {
    try {
      const res = await moduleService.getAll(currentSchemaId);
      let data: any[] = res.data || [];

      // Apply generic filters
      if (department !== 'All') {
        data = data.filter(d => d.department_id === department);
      }
      if (status !== 'All' && showStatusFilter) {
        data = data.filter(d => d.status_id === status);
      }
      if (riskRating !== 'All' && showRiskFilter) {
        data = data.filter(d => d.risk_rating_id === riskRating);
      }
      if (incidentCategory !== 'All' && showCategoryFilter) {
        data = data.filter(d => d.incident_category_id === incidentCategory);
      }
      if (fromDate) {
        data = data.filter(d => {
          const recordDate = d.date || d.target_date || d.due_date;
          return recordDate && recordDate >= fromDate;
        });
      }
      if (toDate) {
        data = data.filter(d => {
          const recordDate = d.date || d.target_date || d.due_date;
          return recordDate && recordDate <= toDate;
        });
      }

      return data;
    } catch (err) {
      console.error("Failed to fetch report data", err);
      alert("Failed to load report data.");
      return [];
    }
  };

  const handleGeneratePreview = async () => {
    const data = await fetchAndFilterData();
    setPreviewData(data);
    setPreviewSchema(currentSchema);
    setHasGenerated(true);
  };

  const handleExportCSV = async () => {
    const data = await fetchAndFilterData();
    if (data.length === 0) {
      alert("No records found for the selected filters.");
      return;
    }

    if (!currentSchema) return;

    const headers = currentSchema.columns.map(col => col.label);
    const csvRows = [];
    csvRows.push(headers.join(',')); // Header row

    for (const entry of data) {
      const row = currentSchema.columns.map(col => {
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
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
        <div className="flex items-center justify-between gap-3 print-hide">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Management Reports</h1>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              disabled={!hasGenerated}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors shadow-sm ${hasGenerated ? 'bg-background border border-border hover:bg-muted text-foreground' : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'}`}
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            {canExportCSV() && (
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Configuration Panel - Hidden on Print */}
        <div className="bg-card p-6 rounded-xl border border-border card-shadow print-hide">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" /> Report Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-2 border-b border-border pb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Select Report Module</label>
              <select 
                value={reportType} 
                onChange={(e) => {
                  setReportType(e.target.value);
                  setHasGenerated(false); // Reset preview when changing module
                }}
                className="w-full max-w-md bg-background border border-border rounded-md px-4 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none font-medium"
              >
                {REPORT_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
              </select>
            </div>

            {/* Common Filters */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">From Date</label>
              <input 
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">To Date</label>
              <input 
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
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

            {showStatusFilter && (
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
            )}

            {/* Dynamic Filters */}
            {showRiskFilter && (
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
            )}

            {showCategoryFilter && (
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
            )}
            
          </div>

          <div className="mt-6 flex justify-end">
             <button 
                onClick={handleGeneratePreview}
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-md font-medium transition-colors shadow-sm"
              >
                <TableIcon className="h-4 w-4" />
                Generate Preview
              </button>
          </div>
        </div>

        {/* Data Preview Table */}
        {hasGenerated && previewSchema && (
          <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden print:shadow-none print:border-none print:mt-0 mt-8">
            <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center print:bg-transparent">
              <h3 className="font-bold text-lg text-foreground print:text-2xl print:mb-4">{reportType} Preview</h3>
              <span className="text-sm font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border border-border print-hide">
                {previewData.length} Records Found
              </span>
            </div>
            
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-sm text-left print:text-xs">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-transparent print:border-b-2 print:border-black">
                  <tr>
                    {previewSchema.columns.filter((c:any) => !c.hideFromForm).map((col:any) => (
                      <th key={col.key} className="px-4 py-3 font-semibold print:px-2">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.length === 0 ? (
                    <tr>
                      <td colSpan={previewSchema.columns.length} className="px-6 py-8 text-center text-muted-foreground print-hide">
                        No records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    previewData.map((entry:any) => (
                      <tr key={entry.id} className="border-b border-border hover:bg-muted/30 transition-colors print:border-b print:border-gray-200">
                        {previewSchema.columns.filter((c:any) => !c.hideFromForm).map((col:any) => (
                          <td key={col.key} className="px-4 py-3 print:px-2 print:py-2">
                            {entry[col.key] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};
