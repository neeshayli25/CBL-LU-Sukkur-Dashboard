import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import type { SectionConfig, ColumnSchema } from '../config/sectionSchemas';
import { Plus, Save, Trash2, Download, Edit2, X, RefreshCw } from 'lucide-react';
import { iconMap } from './iconMap';
import { usePermissions } from '@cbl/auth';
import { useModuleData } from '../hooks/useModuleData';

interface DataEntrySectionProps {
  schema: SectionConfig;
}

export const DataEntrySection: React.FC<DataEntrySectionProps> = ({ schema }) => {
  const { data: entries, loading, fetchAll, createRecord, updateRecord, deleteRecord } = useModuleData(schema.id);

  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const { 
    canAddData, 
    canEditData, 
    canDeleteData, 
    canExportCSV,
    canApproveRecords 
  } = usePermissions();

  useEffect(() => {
    fetchAll();
  }, [schema.id, fetchAll]);

  const applyComputes = (data: any, currentSchema: SectionConfig) => {
    const nextData = { ...data };
    currentSchema.columns.forEach(col => {
      if (col.compute) {
        nextData[col.key] = col.compute(nextData);
      }
    });
    return nextData;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, isEdit = false) => {
    const { name, value, type } = e.target as any;
    let finalValue: any = value;
    if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }

    if (isEdit) {
      const newEditData = { ...editFormData, [name]: finalValue };
      setEditFormData(applyComputes(newEditData, schema));
    } else {
      const newData = { ...formData, [name]: finalValue };
      setFormData(applyComputes(newData, schema));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = applyComputes(formData, schema);
    const result = await createRecord(dataToSave);
    if (result.success) {
      setFormData({});
    } else {
      alert(`Error adding record: ${result.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await deleteRecord(id);
    }
  };

  const startEdit = (entry: any) => {
    setEditingId(entry.id);
    setEditFormData({ ...entry });
  };

  const saveEdit = async () => {
    if (editingId) {
      const result = await updateRecord(editingId, applyComputes(editFormData, schema));
      if (result.success) {
        setEditingId(null);
      } else {
        alert(`Error updating record: ${result.message}`);
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
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
    const commonClasses = `w-full px-3 py-2 border border-border rounded-md text-sm ${col.readonly ? 'bg-muted/50 text-muted-foreground' : 'bg-background text-foreground'} focus:outline-none focus:ring-1 focus:ring-primary`;
    
    // If it's the status field and user cannot approve, they can't change it to Closed
    // We handle this by disabling the "Closed" option if !canApproveRecords()
    if (col.type === 'select') {
      return (
        <select 
          name={col.key} 
          value={value || ''} 
          onChange={(e) => onChange(e, isEdit)} 
          className={commonClasses}
          required={col.required}
          disabled={col.readonly}
        >
          <option value="">Select...</option>
          {col.options?.map(opt => {
             const isDisabled = (col.key === 'status_id' && opt === 'Closed' && !canApproveRecords());
             return <option key={opt} value={opt} disabled={isDisabled}>{opt}</option>;
          })}
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
          readOnly={col.readonly}
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
        readOnly={col.readonly}
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
          
          {canExportCSV() && (
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors shadow-sm hover:opacity-90"
              style={{ backgroundColor: schema.accentColor }}
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Data Entry Form */}
        {canAddData() && (
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
        )}

        {/* Table View */}
        <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50" style={{ borderBottom: `2px solid ${schema.accentColor}` }}>
                <tr>
                  {schema.columns.map(col => (
                    <th key={col.key} className="px-4 py-4 font-semibold">{col.label}</th>
                  ))}
                  {(canEditData() || canDeleteData()) && (
                    <th className="px-4 py-4 font-semibold text-right">Actions</th>
                  )}
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
                      {(canEditData() || canDeleteData()) && (
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
                              {canEditData() && (
                                <button onClick={() => startEdit(entry)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Edit">
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              )}
                              {canDeleteData() && (
                                <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded transition-colors" title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
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
