import { Layout } from '../components/Layout';
import { FileText, Download } from 'lucide-react';
import { useFilters } from '../context/FilterContext';

export const Reports = () => {
  const { filters } = useFilters();

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Management Reports</h1>
          </div>
          
          <button 
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
            onClick={() => alert("PDF Export functionality will be implemented in a later phase.")}
          >
            <Download className="h-4 w-4" />
            Export to PDF
          </button>
        </div>

        <div className="bg-card p-8 rounded-xl border border-border card-shadow flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Report Summary View</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Generate and export detailed PDF/Excel reports summarizing HSE KPIs, observation trends, and departmental compliance.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
            <div className="p-4 border border-border rounded-lg bg-muted/20">
              <span className="block text-sm text-muted-foreground mb-1">Selected Year</span>
              <span className="font-bold text-foreground">{filters.year}</span>
            </div>
            <div className="p-4 border border-border rounded-lg bg-muted/20">
              <span className="block text-sm text-muted-foreground mb-1">Department</span>
              <span className="font-bold text-foreground">{filters.department}</span>
            </div>
            <div className="p-4 border border-border rounded-lg bg-muted/20">
              <span className="block text-sm text-muted-foreground mb-1">Status Filter</span>
              <span className="font-bold text-foreground">{filters.status}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
