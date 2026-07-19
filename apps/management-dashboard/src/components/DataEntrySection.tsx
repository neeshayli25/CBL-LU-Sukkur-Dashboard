import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import type { SectionConfig, ColumnSchema } from '../config/sectionSchemas';
import { Plus, Save, Trash2, Download, Edit2, X } from 'lucide-react';
import { iconMap } from './iconMap';

interface DataEntrySectionProps {
  schema: SectionConfig;
}

export const DataEntrySection: React.FC<DataEntrySectionProps> = ({ schema }) => {
  // Local storage persistence
  const [entries, setEntries] = useState<any[]>(() => {
    const saved = localStorage.getItem(`cbl_data_${schema.id}`);
    if (saved) return JSON.parse(saved);
    // Mock prepopulated row based on first few columns
    return [{
      id: Date.now().toString(),
      [schema.columns[0]?.key]: 'Mock Entry 1',
      [schema.columns[1]?.key]: '2026-07-18',
    }];
  });

  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    localStorage.setItem(`cbl_data_${schema.id}`, JSON.stringify(entries));
  }, [entries, schema.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, isEdit = false) => {
    const { name, value } = e.target;
    if (isEdit) {
      setEditFormData((prev: any) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      ...formData,
      id: Date.now().toString(),
    };
    setEntries([newEntry, ...entries]);
    setFormData({}); // Reset
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const startEdit = (entry: any) => {
    setEditingId(entry.id);
    setEditFormData({ ...entry });
  };

  const saveEdit = () => {
    setEntries(entries.map(e => e.id === editingId ? editFormData : e));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const exportCSV = () => {
    if (entries.length === 0) return;
    
    const headers = schema.columns.map(col => col.label);
    const csvRows = [];
    csvRows.push(headers.join(',')); // Header row

    for (const entry of entries) {
      const row = schema.columns.map(col => {
        let val = entry[col.key] || '';
        // Escape quotes and commas
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
    link.setAttribute("download", `${schema.id}_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderField = (col: ColumnSchema, value: any, onChange: (e: any, isEdit: boolean) => void, isEdit = false) => {
    const commonClasses = "w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
    
    if (col.type === 'select') {
      return (
        <select 
          name={col.key} 
          value={value || ''} 
          onChange={(e) => onChange(e, isEdit)} 
          className={commonClasses}
          required={col.required}
        >
          <option value="">Select...</option>
          {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    
    if (col.type === 'textarea') {
      return (
        <textarea 
          name={col.key} 
          value={value || ''} 
          onChange={(e) => onChange(e, isEdit)} 
          className={commonClasses}
          rows={3}
          required={col.required}
        />
      );
    }

    return (
      <input 
        type={col.type} 
        name={col.key} 
        value={value || ''} 
        onChange={(e) => onChange(e, isEdit)} 
        className={commonClasses}
        required={col.required}
      />
    );
  };

  const IconComponent = iconMap[schema.icon];

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Header Section styled with accent color */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-card border card-shadow" style={{ color: schema.accentColor, borderColor: schema.accentColor + '40' }}>
              {IconComponent && <IconComponent className="h-5 w-5" />}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: schema.accentColor }}>{schema.title}</h1>
          </div>
          
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors shadow-sm hover:opacity-90"
            style={{ backgroundColor: schema.accentColor }}
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </button>
        </div>

        {/* Data Entry Form */}
        <div className="bg-card rounded-xl border border-border card-shadow p-5" style={{ borderLeft: `4px solid ${schema.accentColor}` }}>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Add New Record</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schema.columns.map(col => (
                <div key={col.key}>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {col.label} {col.required && <span className="text-danger">*</span>}
                  </label>
                  {renderField(col, formData[col.key], handleInputChange, false)}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                type="submit" 
                className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors shadow-sm hover:opacity-90"
                style={{ backgroundColor: schema.accentColor }}
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </button>
            </div>
          </form>
        </div>

        {/* Table View */}
        <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50" style={{ borderBottom: `2px solid ${schema.accentColor}` }}>
                <tr>
                  {schema.columns.map(col => (
                    <th key={col.key} className="px-4 py-4 font-semibold">{col.label}</th>
                  ))}
                  <th className="px-4 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={schema.columns.length + 1} className="px-6 py-8 text-center text-muted-foreground">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      {schema.columns.map(col => (
                        <td key={col.key} className="px-4 py-3">
                          {editingId === entry.id ? (
                            renderField(col, editFormData[col.key], handleInputChange, true)
                          ) : (
                            <span className="text-foreground">{entry[col.key] || '-'}</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {editingId === entry.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={saveEdit} className="p-1.5 text-success hover:bg-success/10 rounded" title="Save">
                              <Save className="h-4 w-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 text-muted-foreground hover:bg-muted rounded" title="Cancel">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startEdit(entry)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Edit">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded transition-colors" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
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
