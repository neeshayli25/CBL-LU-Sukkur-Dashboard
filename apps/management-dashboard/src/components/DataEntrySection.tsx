import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import type { SectionConfig, ColumnSchema } from '../config/sectionSchemas';
import { Plus, Save, Trash2, Download, Edit2, X, RefreshCw, History, ArrowRight, User, AlertTriangle } from 'lucide-react';
import { iconMap } from './iconMap';
import { usePermissions, useAuth } from '@cbl/auth';
import { useModuleData } from '../hooks/useModuleData';
import { useFilters } from '../context/FilterContext';

interface DataEntrySectionProps {
  schema: SectionConfig;
}

export const DataEntrySection: React.FC<DataEntrySectionProps> = ({ schema }) => {
  const { data: entries, loading, fetchAll, createRecord, updateRecord, deleteRecord } = useModuleData(schema.id);
  const { user } = useAuth();
  const { filters } = useFilters();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const [statusHistoryModal, setStatusHistoryModal] = useState<{ isOpen: boolean; record: any | null }>({ isOpen: false, record: null });

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

  // Apply context filters
  const filteredEntries = entries.filter(entry => {
    if (filters.department && filters.department !== 'All' && entry.department_id !== filters.department) return false;
    if (filters.status && filters.status !== 'All' && entry.status_id !== filters.status) return false;
    
    const recordDate = entry.date || entry.target_date;
    if (filters.year && filters.year !== 'All' && recordDate && !recordDate.startsWith(filters.year)) return false;
    if (filters.fromDate && recordDate && recordDate < filters.fromDate) return false;
    if (filters.toDate && recordDate && recordDate > filters.toDate) return false;
    
    return true;
  });

  const applyComputes = (data: any, currentSchema: SectionConfig, allEntries: any[]) => {
    const nextData = { ...data };
    currentSchema.columns.forEach(col => {
      if (col.compute) {
        nextData[col.key] = col.compute(nextData, allEntries);
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
      setEditFormData(applyComputes(newEditData, schema, entries));
    } else {
      const newData = { ...formData, [name]: finalValue };
      setFormData(applyComputes(newData, schema, entries));
    }
  };

  const handleStatusChange = async (record: any, newStatus: string) => {
    if (record.status_id === newStatus) return; // No change

    const historyEntry = {
      user: user?.name || "Bypass User",
      oldStatus: record.status_id || "None",
      newStatus,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...(record.statusHistory || []), historyEntry];
    
    const result = await updateRecord(record.id, { 
      status_id: newStatus,
      statusHistory: newHistory
    });

    if (!result.success) {
      alert(`Error updating status: ${result.message}`);
    }
  };

  const validateFormData = (data: any): string | null => {
    const today = new Date().toISOString().split('T')[0];
    
    if (['incident-log', 'hazard-reporting', 'near-miss'].includes(schema.id)) {
      if (data.date && data.date > today) {
        return "Report date cannot be in the future.";
      }
    }

    if (schema.id === 'action-tracker') {
      if (data.completion_date && data.completion_date > today) {
        return "Completion date cannot be in the future.";
      }
      if (data.status_id === 'Closed' && !data.completion_date) {
        return "A completion date is required to close a CAPA.";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const dataToSave = applyComputes(formData, schema, entries);
    
    const err = validateFormData(dataToSave);
    if (err) {
      setValidationError(err);
      return;
    }

    const result = await createRecord(dataToSave);
    if (result.success) {
      setFormData({});
      setIsAddModalOpen(false);
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
      const originalRecord = entries.find(e => e.id === editingId);
      const updatedData = applyComputes(editFormData, schema, entries);

      const err = validateFormData(updatedData);
      if (err) {
        alert(`Validation Error: ${err}`);
        return;
      }

      // Handle status change audit log during inline edit
      if (originalRecord && originalRecord.status_id !== updatedData.status_id) {
        updatedData.statusHistory = [
          ...(originalRecord.statusHistory || []),
          {
            user: user?.name || "Bypass User",
            oldStatus: originalRecord.status_id || "None",
            newStatus: updatedData.status_id,
            timestamp: new Date().toISOString()
          }
        ];
      }

      const result = await updateRecord(editingId, updatedData);
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
    setValidationError(null);
  };

  const exportCSV = () => {
    if (filteredEntries.length === 0) return;
    
    const headers = schema.columns.map(col => col.label);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const entry of filteredEntries) {
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
    link.setAttribute("download", `${schema.id}_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderField = (col: ColumnSchema, value: any, onChange: (e: any, isEdit: boolean) => void, isEdit = false) => {
    const commonClasses = `w-full px-3 py-2 border border-border rounded-md text-sm ${col.readonly ? 'bg-muted/50 text-muted-foreground' : 'bg-background text-foreground'} focus:outline-none focus:ring-1 focus:ring-primary`;
    
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
             const isDisabled = (col.key === 'status_id' && opt === 'Close' && !canApproveRecords());
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
          
          <div className="flex items-center gap-2">
            {canExportCSV() && (
              <button 
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-foreground bg-card border border-border transition-colors shadow-sm hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                Export to CSV
              </button>
            )}
            {canAddData() && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors shadow-sm hover:opacity-90"
                style={{ backgroundColor: schema.accentColor }}
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Add Entry Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
              <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
                <h2 className="text-xl font-bold" style={{ color: schema.accentColor }}>New {schema.title} Record</h2>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setValidationError(null);
                  }} 
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {validationError && (
                  <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-3">
                    <div className="p-1 rounded-full bg-danger/20 text-danger shrink-0 mt-0.5">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-danger">Validation Error</h4>
                      <p className="text-sm text-danger/90 mt-1">{validationError}</p>
                    </div>
                  </div>
                )}
                <form id="add-form" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {schema.columns.filter(c => !c.hideFromForm).map(col => (
                      <div key={col.key}>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          {col.label} {col.required && <span className="text-danger">*</span>}
                        </label>
                        {renderField(col, formData[col.key], handleInputChange, false)}
                      </div>
                    ))}
                  </div>
                </form>
              </div>
              <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-md font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="add-form"
                  className="flex items-center gap-2 px-6 py-2 rounded-md font-medium text-white transition-colors shadow-sm hover:opacity-90"
                  style={{ backgroundColor: schema.accentColor }}
                >
                  <Save className="h-4 w-4" />
                  Save Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status History Modal */}
        {statusHistoryModal.isOpen && statusHistoryModal.record && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-border">
              <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <History className="h-5 w-5" /> Status Audit Log
                </h2>
                <button onClick={() => setStatusHistoryModal({ isOpen: false, record: null })} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                {(!statusHistoryModal.record.statusHistory || statusHistoryModal.record.statusHistory.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center">No status history found for this record.</p>
                ) : (
                  statusHistoryModal.record.statusHistory.map((history: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-3 rounded-lg border border-border bg-muted/20">
                      <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-foreground">{history.user}</span>
                          <span className="text-xs text-muted-foreground">{new Date(history.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground line-through">{history.oldStatus}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">{history.newStatus}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
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
                  <th className="px-4 py-4 font-semibold text-center">Status Audit</th>
                  {(canEditData() || canDeleteData()) && (
                    <th className="px-4 py-4 font-semibold text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={schema.columns.length + 2} className="px-6 py-8 text-center text-muted-foreground">
                      No records found matching filters. Click "Add Entry" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      {schema.columns.map(col => (
                        <td key={col.key} className="px-4 py-3">
                          {editingId === entry.id ? (
                            renderField(col, editFormData[col.key], handleInputChange, true)
                          ) : (
                            col.key === 'status_id' && canEditData() ? (
                              <select 
                                value={entry.status_id || ''} 
                                onChange={(e) => handleStatusChange(entry, e.target.value)}
                                className="bg-transparent border border-transparent hover:border-border rounded px-1 py-0.5 focus:ring-1 focus:ring-primary text-sm font-medium cursor-pointer"
                              >
                                {col.options?.map(opt => (
                                  <option key={opt} value={opt} disabled={opt === 'Close' && !canApproveRecords()}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-foreground">{entry[col.key] || '-'}</span>
                            )
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => setStatusHistoryModal({ isOpen: true, record: entry })}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" 
                          title="View Status History"
                        >
                          <History className="h-4 w-4 mx-auto" />
                        </button>
                      </td>
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
