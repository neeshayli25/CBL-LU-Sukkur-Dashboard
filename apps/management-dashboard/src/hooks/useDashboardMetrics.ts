import { useMemo } from 'react';

export interface DashboardRawData {
  hazards: any[];
  nearMisses: any[];
  incidents: any[];
  capas: any[];
  training: any[];
  inspections: any[];
  drills: any[];
  legal: any[];
  audits: any[];
  totalOrgManhours?: number;
}

export interface MetricItem {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  target?: number | string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  isPendingModule?: boolean;
  path?: string;
  iconClass?: string;
  bgClass?: string;
}

export interface DeptScorecardRow {
  department: string;
  hazards: number;
  hazardsClosed: number;
  hazardClosurePct: number;
  nearMiss: number;
  unsafeActs: number;
  trainingManhours: number;
  capaTotal: number;
  capaClosed: number;
  capaClosurePct: number;
  firstAid: number;
  lti: number;
}

const CLOSED = new Set(['Closed', 'Close', 'Done', 'DONE', 'closed', 'done']);
const isClosed = (v: unknown) => CLOSED.has(String(v ?? '').trim());

const isUnsafeAct = (h: any) => {
  const t = String(h.unsafe_type || h.Unsafe || '').toLowerCase();
  return t === 'unsafe act' || t === 'act' || t === 'ua'
    || h.category === 'Behavioral'
    || h.root_cause === 'Unsafe Act'
    || h.root_cause === 'Human Error';
};

export const useDashboardMetrics = (data: DashboardRawData) => {
  return useMemo(() => {
    const {
      hazards = [],
      nearMisses = [],
      incidents = [],
      capas = [],
      training = [],
      inspections = [],
      audits = [],
      totalOrgManhours = 0,
    } = data;

    const hazardSpotting = hazards.length;
    const nearMissCount = nearMisses.length;
    const unsafeActs = hazards.filter(isUnsafeAct).length;
    const closedHazards = hazards.filter((h) => isClosed(h.status_id || h.status)).length;
    const hazardClosureRate = hazards.length > 0 ? Math.round((closedHazards / hazards.length) * 100) : 0;

    const totalTrainingManhours = Math.round(
      training.reduce((sum, t) => {
        const computed = Number(t.manhours);
        if (Number.isFinite(computed) && computed > 0) return sum + computed;
        const p = Number(t.participants) || 0;
        const d = Number(t.duration_minutes) || 0;
        return sum + p * (d / 60);
      }, 0)
    );

    const incidentCapas = capas.filter((c) => {
      const src = String(c.action_driven_from || c.source || c.module_source || '').toLowerCase();
      return src.includes('incident') || src.includes('injury') || src.includes('fire analysis');
    });
    const closedIncidentCapas = incidentCapas.filter((c) => isClosed(c.status_id || c.status)).length;
    const incidentCapaClosureRate = incidentCapas.length > 0
      ? Math.round((closedIncidentCapas / incidentCapas.length) * 100)
      : 0;

    const closedCapas = capas.filter((c) => isClosed(c.status_id || c.status)).length;
    const capaClosureRate = capas.length > 0 ? Math.round((closedCapas / capas.length) * 100) : 0;

    const leadingMetricsDetail: MetricItem[] = [
      { id: 'hazard-spotting', name: 'Hazard Spotting', value: hazardSpotting, unit: 'Count', target: 250, status: 'neutral', path: '/hazard-reporting', iconClass: 'text-rose-600', bgClass: 'bg-rose-100' },
      { id: 'near-miss', name: 'Near Miss', value: nearMissCount, unit: 'Count', target: 22, status: 'neutral', path: '/near-miss', iconClass: 'text-amber-600', bgClass: 'bg-amber-100' },
      { id: 'unsafe-acts', name: 'Unsafe Acts', value: unsafeActs, unit: 'Count', status: unsafeActs > 0 ? 'warning' : 'success', path: '/hazard-reporting', iconClass: 'text-orange-600', bgClass: 'bg-orange-100' },
      { id: 'hazard-closure', name: 'Hazard Closure', value: hazardClosureRate, unit: '%', target: 90, status: hazardClosureRate >= 80 ? 'success' : 'warning', path: '/hazard-reporting', iconClass: 'text-emerald-600', bgClass: 'bg-emerald-100' },
      { id: 'training-manhours', name: 'HSE Training Manhours', value: totalTrainingManhours, unit: 'Hrs', target: 1250, status: 'success', path: '/training-records', iconClass: 'text-cyan-600', bgClass: 'bg-cyan-100' },
      { id: 'inspections', name: 'HSE Inspections/Audits', value: inspections.length + audits.length, unit: 'Count', status: 'success', path: '/audit-management', iconClass: 'text-violet-600', bgClass: 'bg-violet-100' },
      { id: 'incident-capa-closure', name: 'Incident Inv. Actions Closure', value: incidentCapaClosureRate, unit: '%', target: 100, status: incidentCapaClosureRate >= 80 ? 'success' : 'warning', path: '/action-tracker', iconClass: 'text-indigo-600', bgClass: 'bg-indigo-100' },
      { id: 'drills', name: 'Emergency Drills (Int/Ext)', value: 'N/A', unit: 'Module Pending', status: 'neutral', isPendingModule: true },
      { id: 'capa-closure', name: 'Action Plans Closure Tracker', value: capaClosureRate, unit: '%', target: 100, status: capaClosureRate >= 80 ? 'success' : 'warning', path: '/action-tracker', iconClass: 'text-violet-600', bgClass: 'bg-violet-100' },
      { id: 'legal', name: 'Legal Compliance', value: 'N/A', unit: 'Module Pending', status: 'neutral', isPendingModule: true },
    ];

    const fatalities = incidents.filter((i) => i.incident_category_id === 'Fatality').length;
    const lti = incidents.filter((i) => i.incident_category_id === 'LTI').length;
    const rwcMtc = incidents.filter((i) => ['RWC', 'MTC'].includes(i.incident_category_id)).length;
    const firstAid = incidents.filter((i) => i.incident_category_id === 'First Aid').length;
    const fireMinor = incidents.filter((i) => i.incident_category_id === 'Minor Fire').length;
    const fireMajor = incidents.filter((i) => i.incident_category_id === 'Major Fire').length;

    const recordableIncidents = fatalities + lti + rwcMtc;
    const ltir = totalOrgManhours > 0 ? ((lti * 200000) / totalOrgManhours).toFixed(2) : '0.00';
    const trir = totalOrgManhours > 0 ? ((recordableIncidents * 200000) / totalOrgManhours).toFixed(2) : '0.00';

    const laggingMetricsDetail: MetricItem[] = [
      { id: 'fatalities', name: 'Fatal Incidents', value: fatalities, unit: 'Count', target: 0, status: fatalities > 0 ? 'danger' : 'success', path: '/incident-log', iconClass: 'text-red-700', bgClass: 'bg-red-100' },
      { id: 'lti', name: 'LTI (Lost Time Injury)', value: lti, unit: 'Count', target: 0, status: lti > 0 ? 'danger' : 'success', path: '/incident-log', iconClass: 'text-pink-600', bgClass: 'bg-pink-100' },
      { id: 'ltir', name: 'LTIR', value: ltir, unit: 'Rate', target: 0, status: Number(ltir) > 0 ? 'warning' : 'success', path: '/incident-log', iconClass: 'text-fuchsia-600', bgClass: 'bg-fuchsia-100' },
      { id: 'rwc-mtc', name: 'RWC / MTC', value: rwcMtc, unit: 'Count', status: rwcMtc > 0 ? 'warning' : 'success', path: '/incident-log', iconClass: 'text-orange-500', bgClass: 'bg-orange-100' },
      { id: 'trir', name: 'TRIR', value: trir, unit: 'Rate', target: 0.12, status: Number(trir) > 0.12 ? 'warning' : 'success', path: '/incident-log', iconClass: 'text-yellow-600', bgClass: 'bg-yellow-100' },
      { id: 'first-aid', name: 'First Aid', value: firstAid, unit: 'Count', status: firstAid > 0 ? 'warning' : 'success', path: '/incident-log', iconClass: 'text-emerald-500', bgClass: 'bg-emerald-100' },
      { id: 'fire', name: 'Fire Incidents (Major / Minor)', value: `${fireMajor} / ${fireMinor}`, unit: 'Count', target: 0, status: (fireMajor > 0 || fireMinor > 0) ? 'danger' : 'success', path: '/incident-log', iconClass: 'text-red-500', bgClass: 'bg-red-100' },
    ];

    // Department scorecard (PPT slide 5 style)
    const depts = ['PRD', 'Stores', 'ADM', 'QC/FS/NPD', 'HSE', 'ESD', 'Projects'];
    const deptScorecard: DeptScorecardRow[] = depts.map((department) => {
      const dHaz = hazards.filter((h) => h.department_id === department || h.responsible_person === department);
      // For hazards, RESP department is often responsible_person in Excel; originated is department_id
      const dHazOrigin = hazards.filter((h) => h.department_id === department);
      const dHazResp = hazards.filter((h) => String(h.responsible_person || '').trim() === department);
      const dHazards = dHazResp.length ? dHazResp : dHazOrigin;
      const dClosed = dHazards.filter((h) => isClosed(h.status_id || h.status)).length;
      const dNm = nearMisses.filter((n) => n.department_id === department).length;
      const dUa = dHazards.filter(isUnsafeAct).length;
      const dTrain = training
        .filter((t) => t.department_id === department)
        .reduce((sum, t) => {
          const mh = Number(t.manhours);
          if (Number.isFinite(mh) && mh > 0) return sum + mh;
          return sum + (Number(t.participants) || 0) * ((Number(t.duration_minutes) || 0) / 60);
        }, 0);
      const dCapa = capas.filter((c) => c.department_id === department);
      const dCapaClosed = dCapa.filter((c) => isClosed(c.status_id || c.status)).length;
      const dFa = incidents.filter((i) => i.department_id === department && i.incident_category_id === 'First Aid').length;
      const dLti = incidents.filter((i) => i.department_id === department && i.incident_category_id === 'LTI').length;
      return {
        department,
        hazards: dHazards.length || dHaz.length,
        hazardsClosed: dClosed,
        hazardClosurePct: dHazards.length ? Math.round((dClosed / dHazards.length) * 100) : 0,
        nearMiss: dNm,
        unsafeActs: dUa,
        trainingManhours: Math.round(dTrain),
        capaTotal: dCapa.length,
        capaClosed: dCapaClosed,
        capaClosurePct: dCapa.length ? Math.round((dCapaClosed / dCapa.length) * 100) : 0,
        firstAid: dFa,
        lti: dLti,
      };
    });

    const safetyPyramid = {
      fatalities,
      recordable: recordableIncidents,
      minorFire: fireMinor,
      firstAid,
      nearMiss: nearMissCount,
      hazards: hazardSpotting,
      unsafeActs,
    };

    return {
      leadingMetricsDetail,
      laggingMetricsDetail,
      deptScorecard,
      safetyPyramid,
      summary: {
        hazardSpotting,
        nearMissCount,
        unsafeActs,
        hazardClosureRate,
        totalTrainingManhours,
        capaClosureRate,
        firstAid,
        lti,
        trir,
        ltir,
      },
    };
  }, [data]);
};
