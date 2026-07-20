import { useAuthStore } from "../store/authStore";

export const usePermissions = () => {
  const { user, hasRole } = useAuthStore();

  // Roles exactly as defined by the user
  const isSysAdmin = hasRole("System Administrator");
  const isHseManager = hasRole("HSE Manager");
  const isHseOfficer = hasRole("HSE Officer");
  const isDeptManager = hasRole("Department Manager");
  const isDataEntry = hasRole("Data Entry Operator");
  const isViewer = hasRole("Viewer") || hasRole("Read Only");

  // If no role matched, fallback to Viewer permissions to be safe
  const hasNoRole = !isSysAdmin && !isHseManager && !isHseOfficer && !isDeptManager && !isDataEntry && !isViewer;

  const canAddData = () => {
    return isSysAdmin || isHseManager || isHseOfficer || isDataEntry;
  };

  const canEditData = () => {
    return isSysAdmin || isHseManager || isHseOfficer;
  };

  const canDeleteData = () => {
    return isSysAdmin || isHseManager || isHseOfficer;
  };

  const canExportCSV = () => {
    return isSysAdmin || isHseManager || isHseOfficer || isDeptManager;
  };

  const canViewReports = () => {
    return isSysAdmin || isHseManager || isHseOfficer || isDeptManager || isViewer || hasNoRole;
  };

  const canApproveRecords = () => {
    return isSysAdmin || isHseManager;
  };

  const isDepartmentRestricted = () => {
    return isDeptManager;
  };

  return {
    canAddData,
    canEditData,
    canDeleteData,
    canExportCSV,
    canViewReports,
    canApproveRecords,
    isDepartmentRestricted,
    userRole: user?.role || 'Unknown',
    userDepartment: user?.department_id || 'None'
  };
};
