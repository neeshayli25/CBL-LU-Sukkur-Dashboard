import React, { useState, useEffect, useMemo } from 'react';
import { Layout }          from './Layout';
import { FilterBar }       from './FilterBar';
import { ContextHeader }   from './ContextHeader';
import { StatusBadge }     from './StatusBadge';
import { StepWizard }      from './StepWizard';
import { iconMap }         from './iconMap';
import { ALL_SECTIONS }    from '../config/sectionSchemas';
import type { SectionConfig, ColumnSchema } from '../config/sectionSchemas';
import {
  Plus, Save, Trash2, Download, Edit2, X, RefreshCw, History,
  ArrowRight, User, AlertTriangle, Search, ChevronLeft, ChevronRight,
  SlidersHorizontal, CheckCircle2, FileX,
} from 'lucide-react';
import { usePermissions, useAuth } from '@cbl/auth';
import { useModuleData }           from '../hooks/useModuleData';
import { useFilters }              from '../context/FilterContext';

// ============================================================
// DataEntrySection — Enterprise SAP Fiori Data Module
// Table + inline edit + form modal — all CRUD logic unchanged
// ============================================================

interface DataEntrySectionProps {
  schema: SectionConfig;
}

// Enterprise field input styles
const FIELD_BASE =
  'w-full h-8 px-2.5 text-[13px] border border-[#E0E0E0] rounded-md bg-white text-[#1A1818] ' +
  'focus:outline-none focus:border-[#CB0017] focus:ring-1 focus:ring-[#CB0017]/20 ' +
  'disabled:bg-[#F5F5F5] disabled:text-[#9CA3AF] disabled:cursor-not-allowed';

const TEXTAREA_BASE =
  'w-full px-2.5 py-2 text-[13px] border border-[#E0E0E0] rounded-md bg-white text-[#1A1818] ' +
  'focus:outline-none focus:border-[#CB0017] focus:ring-1 focus:ring-[#CB0017]/20';

const STATUS_COLUMNS = new Set(['status_id', 'risk_rating_id', 'investigation_required']);

export const DataEntrySection: React.FC<DataEntrySectionProps> = ({ schema }) => {
  const { data: entries, loading, fetchAll, createRecord, updateRecord, deleteRecord } = useModuleData(schema.id);
  const { user }       = useAuth();
  const { filters }    = useFilters();

  // ===== State =====
  const [isAddModalOpen,    setIsAddModalOpen]   = useState(false);
  const [formData,          setFormData]         = useState<any>({});
  const [editingId,         setEditingId]        = useState<string | null>(null);
  const [editFormData,      setEditFormData]     = useState<any>({});
  const [validationError,   setValidationError]  = useState<string | null>(null);
  const [statusHistoryModal, setStatusHistoryModal] = useState<{ isOpen: boolean; record: any | null }>({ isOpen: false, record: null });

  // Enterprise table UX state
  const [searchQuery,  setSearchQuery]  = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const PAGE_SIZE = 15;

  const { canAddData, canEditData, canDeleteData, canExportCSV, canApproveRecords } = usePermissions();

  useEffect(() => { fetchAll(); }, [schema.id, fetchAll]);

  // Reset pagination on filter/search change
  useEffect(() => { setCurrentPage(1); }, [filters, searchQuery, schema.id]);

  // ===== Filter logic (context filters) — unchanged =====
  const filteredEntries = useMemo(() => entries.filter(entry => {
    if (filters.department && filters.department !== 'All' && entry.department_id !== filters.department) return false;
    if (filters.status     && filters.status     !== 'All' && entry.status_id !== filters.status)         return false;
    const recordDate = entry.date || entry.target_date;
    if (filters.year     && filters.year     !== 'All' && recordDate && !recordDate.startsWith(filters.year)) return false;
    if (filters.fromDate && recordDate && recordDate < filters.fromDate) return false;
    if (filters.toDate   && recordDate && recordDate > filters.toDate)   return false;
    return true;
  }), [entries, filters]);

  // ===== Search filter (local) =====
  const searchedEntries = useMemo(() => {
    if (!searchQuery.trim()) return filteredEntries;
    const q = searchQuery.toLowerCase();
    return filteredEntries.filter(entry =>
      schema.columns.some(col => String(entry[col.key] ?? '').toLowerCase().includes(q))
    );
  }, [filteredEntries, searchQuery, schema.columns]);

  // ===== Pagination =====
  const totalPages   = Math.max(1, Math.ceil(searchedEntries.length / PAGE_SIZE));
  const pagedEntries = searchedEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startRecord  = searchedEntries.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRecord    = Math.min(currentPage * PAGE_SIZE, searchedEntries.length);

  // ===== Business logic helpers (unchanged) =====
  const applyComputes = (data: any, currentSchema: SectionConfig, allEntries: any[]) => {
    const nextData = { ...data };
    currentSchema.columns.forEach(col => { if (col.compute) nextData[col.key] = col.compute(nextData, allEntries); });
    return nextData;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, isEdit = false) => {
    const { name, value, type } = e.target as any;
    let finalValue: any = type === 'number' ? (value === '' ? '' : Number(value)) : value;
    if (isEdit) {
      setEditFormData((prev: any) => applyComputes({ ...prev, [name]: finalValue }, schema, entries));
    } else {
      setFormData((prev: any) => applyComputes({ ...prev, [name]: finalValue }, schema, entries));
    }
  };

  const handleStatusChange = async (record: any, newStatus: string) => {
    if (record.status_id === newStatus) return;
    const historyEntry = { user: user?.name ?? 'System', oldStatus: record.status_id ?? 'None', newStatus, timestamp: new Date().toISOString() };
    const result = await updateRecord(record.id, { status_id: newStatus, statusHistory: [...(record.statusHistory ?? []), historyEntry] });
    if (!result.success) alert(`Error updating status: ${result.message}`);
  };

  const validateFormData = (data: any): string | null => {
    const today = new Date().toISOString().split('T')[0];
    if (['incident-log', 'hazard-reporting', 'near-miss'].includes(schema.id) && data.date && data.date > today)
      return 'Report date cannot be in the future.';
    if (schema.id === 'action-tracker') {
      if (data.completion_date && data.completion_date > today) return 'Completion date cannot be in the future.';
      if (data.status_id === 'Closed' && !data.completion_date) return 'A completion date is required to close a CAPA.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const dataToSave = applyComputes(formData, schema, entries);
    const err = validateFormData(dataToSave);
    if (err) { setValidationError(err); return; }
    const result = await createRecord(dataToSave);
    if (result.success) { setFormData({}); setIsAddModalOpen(false); }
    else alert(`Error adding record: ${result.message}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) await deleteRecord(id);
  };

  const startEdit = (entry: any) => { setEditingId(entry.id); setEditFormData({ ...entry }); };

  const saveEdit = async () => {
    if (!editingId) return;
    const originalRecord = entries.find(e => e.id === editingId);
    const updatedData = applyComputes(editFormData, schema, entries);
    const err = validateFormData(updatedData);
    if (err) { alert(`Validation Error: ${err}`); return; }
    if (originalRecord && originalRecord.status_id !== updatedData.status_id) {
      updatedData.statusHistory = [
        ...(originalRecord.statusHistory ?? []),
        { user: user?.name ?? 'System', oldStatus: originalRecord.status_id ?? 'None', newStatus: updatedData.status_id, timestamp: new Date().toISOString() }
      ];
    }
    const result = await updateRecord(editingId, updatedData);
    if (result.success) setEditingId(null);
    else alert(`Error updating record: ${result.message}`);
  };

  const cancelEdit = () => { setEditingId(null); setEditFormData({}); setValidationError(null); };

  const exportCSV = () => {
    if (filteredEntries.length === 0) return;
    const headers = schema.columns.map(c => c.label);
    const rows    = filteredEntries.map(entry =>
      schema.columns.map(col => {
        let v = String(entry[col.key] ?? '').replace(/"/g, '""');
        if (v.search(/(",|\n)/g) >= 0) v = `"${v}"`;
        return v;
      }).join(',')
    );
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${schema.id}_${new Date().toISOString().split('T')[0]}.csv`, style: { visibility: 'hidden' } });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ===== Form field renderer (unchanged logic, enterprise styling) =====
  const renderField = (col: ColumnSchema, value: any, onChange: (e: any, isEdit: boolean) => void, isEdit = false) => {
    if (col.type === 'select') {
      return (
        <select
          name={col.key}
          value={value ?? ''}
          onChange={e => onChange(e, isEdit)}
          className={FIELD_BASE}
          required={col.required}
          disabled={col.readonly}
        >
          <option value="">Select…</option>
          {col.options?.map(opt => (
            <option key={opt} value={opt} disabled={col.key === 'status_id' && opt === 'Close' && !canApproveRecords()}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    if (col.type === 'textarea') {
      return (
        <textarea
          name={col.key}
          value={value ?? ''}
          onChange={e => onChange(e, isEdit)}
          className={TEXTAREA_BASE}
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
        value={value ?? ''}
        onChange={e => onChange(e, isEdit)}
        className={FIELD_BASE}
        required={col.required}
        readOnly={col.readonly}
      />
    );
  };

  // ===== Inline cell renderer for table =====
  const renderCell = (col: ColumnSchema, entry: any) => {
    const val = entry[col.key];

    // Status badge columns
    if (STATUS_COLUMNS.has(col.key) && val) {
      return <StatusBadge status={val} size="sm" />;
    }

    // Status change dropdown (editable)
    if (col.key === 'status_id' && canEditData()) {
      return (
        <select
          value={val ?? ''}
          onChange={e => handleStatusChange(entry, e.target.value)}
          className="text-[12px] border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-0 font-medium"
          style={{ color: '#1A1818' }}
          onClick={e => e.stopPropagation()}
        >
          {col.options?.map(opt => (
            <option key={opt} value={opt} disabled={opt === 'Close' && !canApproveRecords()}>{opt}</option>
          ))}
        </select>
      );
    }

    return (
      <span className="text-[13px] text-[#1A1818]">
        {val ? String(val) : <span className="text-[#CCCCCC]">—</span>}
      </span>
    );
  };

  const IconComponent = iconMap[schema.icon];

  // ===== Context header actions =====
  const headerActions = [
    ...(canExportCSV() ? [{
      label: 'Export CSV',
      icon: <Download />,
      onClick: exportCSV,
      variant: 'outlined' as const,
    }] : []),
    ...(canAddData() ? [{
      label: `Add ${schema.title.replace(/s$/, '')}`,
      icon: <Plus />,
      onClick: () => setIsAddModalOpen(true),
      variant: 'primary' as const,
    }] : []),
  ];

  return (
    <Layout>
      {/* ===== CONTEXT HEADER ===== */}
      <ContextHeader
        title={schema.title}
        breadcrumbs={[schema.title]}
        subtitle={`${filteredEntries.length} records${searchQuery ? ` · filtered by "${searchQuery}"` : ''}`}
        actions={headerActions}
      >
        <FilterBar />
      </ContextHeader>

      <div className="p-6 space-y-4">

        {/* ===== TABLE TOOLBAR ===== */}
        <div className="bg-white border border-[#E0E0E0] rounded-lg px-4 py-3 flex items-center justify-between gap-3"
             style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}>
          {/* Left: search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
            <input
              type="search"
              placeholder={`Search ${schema.title.toLowerCase()}…`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-[13px] border border-[#E0E0E0] rounded-md bg-white text-[#1A1818] focus:outline-none focus:border-[#CB0017] focus:ring-1 focus:ring-[#CB0017]/20"
            />
          </div>

          {/* Right: record count + loading */}
          <div className="flex items-center gap-3 text-[12px] text-[#9CA3AF]">
            {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#CB0017]" />}
            <span>{searchedEntries.length} records</span>
          </div>
        </div>

        {/* ===== ENTERPRISE TABLE ===== */}
        <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden"
             style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full enterprise-table">
              {/* Sticky header */}
              <thead>
                <tr>
                  {schema.columns.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th className="text-center">Audit</th>
                  {(canEditData() || canDeleteData()) && <th className="text-right">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {loading && pagedEntries.length === 0 ? (
                  /* Skeleton rows */
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-[#FAFAFA]'}>
                      {schema.columns.map(col => (
                        <td key={col.key}>
                          <div className="h-3.5 bg-[#F0F0F0] rounded animate-pulse" style={{ width: '70%' }} />
                        </td>
                      ))}
                      <td /><td />
                    </tr>
                  ))
                ) : pagedEntries.length === 0 ? (
                  /* Empty state */
                  <tr>
                    <td colSpan={schema.columns.length + 2}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileX className="h-12 w-12 mb-3" style={{ color: '#E0E0E0' }} />
                        <p className="text-[14px] font-semibold text-[#374151]">
                          {searchQuery ? 'No matching records' : 'No records found'}
                        </p>
                        <p className="text-[12px] text-[#9CA3AF] mt-1">
                          {searchQuery
                            ? `No results for "${searchQuery}". Try a different search term.`
                            : 'No records match the active filters. Clear filters or add a new entry.'}
                        </p>
                        {canAddData() && !searchQuery && (
                          <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-4 flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-white rounded-md bg-[#CB0017] hover:bg-[#A8001A] transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add First Record
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedEntries.map((entry, rowIdx) => (
                    <tr
                      key={entry.id}
                      className={`group ${rowIdx % 2 !== 0 ? 'bg-[#FAFAFA]' : 'bg-white'}`}
                    >
                      {schema.columns.map(col => (
                        <td key={col.key}>
                          {editingId === entry.id
                            ? renderField(col, editFormData[col.key], handleInputChange, true)
                            : renderCell(col, entry)
                          }
                        </td>
                      ))}

                      {/* Status Audit button */}
                      <td className="text-center">
                        <button
                          onClick={() => setStatusHistoryModal({ isOpen: true, record: entry })}
                          className="inline-flex items-center justify-center w-7 h-7 rounded text-[#CCCCCC] hover:text-[#CB0017] hover:bg-[#FFF7F7] transition-colors"
                          title="View Status Audit Log"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                      </td>

                      {/* Row actions */}
                      {(canEditData() || canDeleteData()) && (
                        <td className="text-right whitespace-nowrap">
                          {editingId === entry.id ? (
                            <div className="flex items-center justify-end gap-1 pr-1">
                              <button
                                onClick={saveEdit}
                                className="inline-flex items-center gap-1 h-7 px-2 text-[12px] font-medium text-white bg-[#CB0017] rounded hover:bg-[#A8001A] transition-colors"
                                title="Save"
                              >
                                <Save className="h-3 w-3" /> Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="h-7 px-2 text-[12px] font-medium text-[#6B7280] border border-[#E0E0E0] rounded hover:bg-[#F5F5F5] transition-colors"
                                title="Cancel"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canEditData() && (
                                <button
                                  onClick={() => startEdit(entry)}
                                  className="w-7 h-7 flex items-center justify-center rounded text-[#6B7280] hover:text-[#CB0017] hover:bg-[#FFF7F7] transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canDeleteData() && (
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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

          {/* ===== PAGINATION BAR ===== */}
          {searchedEntries.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#F0F0F0] bg-[#FAFAFA]">
              <p className="text-[12px] text-[#6B7280]">
                Showing <span className="font-semibold text-[#374151]">{startRecord}–{endRecord}</span> of{' '}
                <span className="font-semibold text-[#374151]">{searchedEntries.length}</span> records
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded border border-[#E0E0E0] text-[#374151] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = totalPages <= 5 ? i + 1 : Math.max(1, currentPage - 2) + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-[13px] font-medium border transition-colors
                        ${page === currentPage
                          ? 'bg-[#CB0017] text-white border-[#CB0017]'
                          : 'border-[#E0E0E0] text-[#374151] hover:bg-[#F5F5F5]'
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded border border-[#E0E0E0] text-[#374151] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================
          ADD RECORD MODAL OR STEP WIZARD
          ================================================================ */}
      {isAddModalOpen && (
        ['incident-log', 'hazard-reporting', 'near-miss'].includes(schema.id) ? (
          <StepWizard
            isOpen={isAddModalOpen}
            onClose={() => { setIsAddModalOpen(false); setValidationError(null); setFormData({}); }}
            schema={schema}
            initialData={formData}
            onSave={async (data) => {
              setValidationError(null);
              const dataToSave = applyComputes(data, schema, entries);
              const err = validateFormData(dataToSave);
              if (err) { setValidationError(err); return; }
              const result = await createRecord(dataToSave);
              if (result.success) { setFormData({}); setIsAddModalOpen(false); }
              else alert(`Error adding record: ${result.message}`);
            }}
          />
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-lg overflow-hidden flex flex-col"
              style={{ border: '1px solid #E0E0E0', boxShadow: '0 20px 60px 0 rgba(0,0,0,0.18)' }}
            >
              {/* Dialog header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0] bg-[#FAFAFA]">
                <div className="flex items-center gap-3">
                  {IconComponent && (
                    <div className="p-2 rounded" style={{ backgroundColor: '#FFF7F7', color: '#CB0017' }}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-[15px] font-bold text-[#1A1818]">New {schema.title} Record</h2>
                    <p className="text-[11px] text-[#9CA3AF]">Fill in the required fields and save</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsAddModalOpen(false); setValidationError(null); setFormData({}); }}
                  className="w-8 h-8 flex items-center justify-center rounded text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F5F5F5] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Dialog body */}
              <div className="flex-1 overflow-y-auto p-6">
                {validationError && (
                  <div
                    className="flex items-start gap-3 mb-6 p-4 rounded-lg"
                    style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#DC2626' }} />
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: '#991B1B' }}>Validation Error</p>
                      <p className="text-[12px] mt-0.5" style={{ color: '#B91C1C' }}>{validationError}</p>
                    </div>
                  </div>
                )}

                <form id="add-form" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {schema.columns.filter(c => !c.hideFromForm).map(col => (
                      <div key={col.key} className={col.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                        <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                          {col.label}
                          {col.required && <span className="text-[#CB0017] ml-1">*</span>}
                        </label>
                        {renderField(col, formData[col.key], handleInputChange, false)}
                      </div>
                    ))}
                  </div>
                </form>
              </div>

              {/* Dialog footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#E0E0E0] bg-[#FAFAFA]">
                <p className="text-[11px] text-[#9CA3AF]">
                  Fields marked <span className="text-[#CB0017]">*</span> are required
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setIsAddModalOpen(false); setValidationError(null); setFormData({}); }}
                    className="h-9 px-4 text-[13px] font-medium text-[#374151] border border-[#E0E0E0] rounded-md hover:bg-[#F5F5F5] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="add-form"
                    className="flex items-center gap-1.5 h-9 px-5 text-[13px] font-medium text-white rounded-md transition-colors"
                    style={{ backgroundColor: '#CB0017' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#A8001A')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#CB0017')}
                  >
                    <Save className="h-3.5 w-3.5" /> Save Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* ================================================================
          STATUS AUDIT LOG MODAL — SAP Fiori timeline
          ================================================================ */}
      {statusHistoryModal.isOpen && statusHistoryModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="bg-white w-full max-w-lg rounded-lg overflow-hidden flex flex-col"
            style={{ border: '1px solid #E0E0E0', boxShadow: '0 20px 60px 0 rgba(0,0,0,0.18)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0] bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#CB0017]" />
                <h2 className="text-[14px] font-bold text-[#1A1818]">Status Audit Log</h2>
              </div>
              <button
                onClick={() => setStatusHistoryModal({ isOpen: false, record: null })}
                className="w-7 h-7 flex items-center justify-center rounded text-[#9CA3AF] hover:bg-[#F5F5F5] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {(!statusHistoryModal.record.statusHistory || statusHistoryModal.record.statusHistory.length === 0) ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2" style={{ color: '#E0E0E0' }} />
                  <p className="text-[13px] text-[#9CA3AF]">No status changes recorded</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-[#E0E0E0]" />
                  <div className="space-y-4 pl-10">
                    {statusHistoryModal.record.statusHistory.map((h: any, idx: number) => (
                      <div key={idx} className="relative">
                        {/* Timeline dot */}
                        <div
                          className="absolute -left-[30px] w-4 h-4 rounded-full border-2 border-white"
                          style={{ backgroundColor: '#CB0017', marginTop: 2 }}
                        />
                        <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1A1818]">
                              <User className="h-3 w-3 text-[#9CA3AF]" /> {h.user}
                            </div>
                            <span className="text-[11px] text-[#9CA3AF]">
                              {new Date(h.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px]">
                            <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded line-through">{h.oldStatus}</span>
                            <ArrowRight className="h-3 w-3 text-[#9CA3AF]" />
                            <span className="px-2 py-0.5 rounded font-medium" style={{ backgroundColor: '#FFF7F7', color: '#CB0017', border: '1px solid rgba(203,0,23,0.2)' }}>
                              {h.newStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
