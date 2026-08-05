import { useAuthStore } from "../store/authStore";

/**
 * Permission helpers — accept both frontend (dot) and backend (colon) permission keys,
 * plus role display-name and seeded role-name fallbacks.
 */
export const usePermissions = () => {
  const { user, hasRole, hasPermission } = useAuthStore();

  const isSysAdmin =
    hasRole("System Administrator") ||
    hasRole("Super Admin") ||
    hasRole("super_admin") ||
    hasRole("admin");
  const isHseManager =
    hasRole("HSE Manager") || hasRole("manager") || hasRole("Manager");
  const isHseOfficer = hasRole("HSE Officer") || hasRole("user") || hasRole("User");
  const isDeptManager = hasRole("Department Manager");
  const isDataEntry = hasRole("Data Entry Operator");
  const isViewer = hasRole("Viewer") || hasRole("Read Only");

  const anyPermission = (...keys: string[]) => keys.some((k) => hasPermission(k));

  const permissionOrRole = (keys: string[], roleAccess: boolean) =>
    anyPermission(...keys) || roleAccess;

  const canAddData = () =>
    permissionOrRole(
      ["hazards.create", "hazard:create", "hse:report_hazard"],
      isSysAdmin || isHseManager || isHseOfficer || isDataEntry
    );

  const canEditData = () =>
    permissionOrRole(
      ["hazards.update", "hazard:update", "hse:manage_incidents"],
      isSysAdmin || isHseManager || isHseOfficer
    );

  const canDeleteData = () =>
    permissionOrRole(
      ["hazards.delete", "hazard:delete", "hse:manage_incidents"],
      isSysAdmin || isHseManager || isHseOfficer
    );

  const canExportCSV = () =>
    permissionOrRole(
      ["reports.export", "report:export", "hse:view_reports"],
      isSysAdmin || isHseManager || isHseOfficer || isDeptManager || true
    );

  const canImportData = () =>
    permissionOrRole(
      ["hazards.create", "hazard:create", "hse:manage_incidents", "hse:report_hazard"],
      isSysAdmin || isHseManager || isHseOfficer || isDataEntry
    );

  const canViewReports = () =>
    permissionOrRole(
      ["dashboard.view", "dashboard:view", "hse:view_dashboard", "hse:view_reports"],
      isSysAdmin || isHseManager || isHseOfficer || isDeptManager || isViewer || true
    );

  const canApproveRecords = () =>
    permissionOrRole(["records.approve", "hse:manage_incidents"], isSysAdmin || isHseManager);

  const isDepartmentRestricted = () => isDeptManager;

  return {
    canAddData,
    canEditData,
    canDeleteData,
    canExportCSV,
    canImportData,
    canViewReports,
    canApproveRecords,
    isDepartmentRestricted,
    userRole: user?.role || "Unknown",
    userDepartment: user?.department_id || "None",
  };
};
