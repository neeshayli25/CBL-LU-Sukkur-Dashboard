import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from '@cbl/auth';
import { useFilters } from '../context/FilterContext';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  ChevronDown,
  UserCircle,
  Settings as SettingsIcon,
  HelpCircle
} from 'lucide-react';

import { DEPARTMENTS } from '../config/constants';
import { ALL_SECTIONS } from '../config/sectionSchemas';
import { iconMap } from './iconMap';

const sidebarItems = [
  { title: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/dashboard", color: "#2563EB" },
  ...ALL_SECTIONS.map(s => {
    const IconComponent = iconMap[s.icon];
    return {
      title: s.title,
      icon: IconComponent ? <IconComponent className="h-5 w-5" /> : null,
      href: s.path,
      color: s.accentColor
    };
  }),
  { title: "Reports", icon: <FileText className="h-5 w-5" />, href: "/reports", color: "#7C3AED" },
  { title: "Analytics", icon: <BarChart3 className="h-5 w-5" />, href: "/analytics", color: "#059669" },
  { title: "Settings", icon: <Settings className="h-5 w-5" />, href: "/settings", color: "#475569" },
];

const NavLinkIndicator = ({ isActive }: { isActive: boolean }) => {
  if (!isActive) return null;
  return (
    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md transition-all duration-300" />
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const mockNotifications = [
    { id: 1, text: "CAPA #42 is Overdue", time: "2 hours ago", type: "warning" },
    { id: 2, text: "New High-Priority Hazard Reported", time: "5 hours ago", type: "danger" },
    { id: 3, text: "Monthly Incident Summary Ready", time: "1 day ago", type: "info" }
  ];

  const { logout, user } = useAuth();
  const { canViewReports, isDepartmentRestricted } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const { filters, setFilter } = useFilters();

  const isRestrictedDept = isDepartmentRestricted();

  // Effect to force department filter if restricted
  React.useEffect(() => {
    if (isRestrictedDept && user?.department_id) {
      setFilter('department', user.department_id);
    }
  }, [isRestrictedDept, user?.department_id, setFilter]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 dark:border-white/5 glass-panel shadow-sm">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="LU Sukkur Plant Logo" className="h-10 w-auto" />
            </div>
            <div className="hidden lg:flex items-center ml-4 space-x-4 border-l border-border pl-4">
              <span className="text-sm font-medium text-muted-foreground">Management Dashboard</span>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
            <div className="hidden lg:flex items-center space-x-2 bg-background/50 backdrop-blur-md border border-white/10 dark:border-white/5 p-1.5 rounded-full shadow-sm hover:shadow-md transition-shadow">
              <span className="text-muted-foreground px-3 text-xs font-medium uppercase tracking-wider">Date</span>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilter('fromDate', e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-foreground cursor-pointer p-0 text-sm font-medium"
              />
              <span className="text-muted-foreground px-2 border-l border-border/50 pl-2 text-xs font-medium uppercase tracking-wider">To</span>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilter('toDate', e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-foreground cursor-pointer p-0 text-sm font-medium pr-3"
              />
            </div>

            <div className="hidden md:flex items-center space-x-2 bg-background/50 backdrop-blur-md border border-white/10 dark:border-white/5 p-1.5 rounded-full shadow-sm hover:shadow-md transition-shadow">
              <select
                value={filters.year}
                onChange={(e) => setFilter('year', e.target.value)}
                className="text-sm font-medium bg-transparent border-none focus:ring-0 text-foreground cursor-pointer pl-3"
              >
                <option value="All">All Time</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
              <select
                value={filters.department}
                onChange={(e) => setFilter('department', e.target.value)}
                disabled={isRestrictedDept}
                className={`text-sm font-medium bg-transparent border-none focus:ring-0 text-foreground border-l border-border/50 pl-2 ${isRestrictedDept ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <option value="All">All Depts</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilter('status', e.target.value)}
                className="text-sm font-medium bg-transparent border-none focus:ring-0 text-foreground cursor-pointer border-l border-border/50 pl-2 pr-3"
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-l border-border/50 pl-4">
              <div className="relative pr-2 flex items-center">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setUserMenuOpen(false);
                  }}
                  className="p-2 text-muted-foreground hover:text-foreground relative transition-colors rounded-full hover:bg-muted/30"
                >
                  <Bell className="h-5 w-5" />
                  {mockNotifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-danger border-2 border-card animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 glass-panel rounded-xl card-shadow z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-border/50 flex justify-between items-center bg-muted/20">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <button className="text-xs text-primary hover:underline font-medium">Mark all as read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto hide-scrollbar">
                      {mockNotifications.map(n => (
                        <div key={n.id} className="p-3 border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors flex gap-3 items-start">
                          <div className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 shadow-sm ${n.type === 'danger' ? 'bg-danger shadow-danger/50' :
                              n.type === 'warning' ? 'bg-secondary shadow-secondary/50' : 'bg-primary shadow-primary/50'
                            }`} />
                          <div>
                            <p className="text-sm text-foreground leading-tight font-medium">{n.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 text-center bg-muted/20 border-t border-border/50">
                      <button className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">View all notifications</button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative flex items-center">
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50"
                >
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold leading-none">{user?.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{user?.role || 'Guest'}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                </button>

                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 glass-panel rounded-xl card-shadow z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-border/50 bg-muted/10">
                      <p className="font-semibold text-sm">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
                    </div>
                    <div className="p-1">
                      <button onClick={() => { setUserMenuOpen(false); navigate('/settings'); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/40 rounded-lg transition-colors">
                        <UserCircle className="h-4 w-4 text-muted-foreground" /> Profile
                      </button>
                      <button onClick={() => { setUserMenuOpen(false); navigate('/settings'); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/40 rounded-lg transition-colors">
                        <SettingsIcon className="h-4 w-4 text-muted-foreground" /> Settings
                      </button>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/40 rounded-lg transition-colors">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" /> Help & Support
                      </button>
                    </div>
                    <div className="p-1 border-t border-border/50">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 hover:text-danger rounded-lg transition-colors font-medium"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Spacer to prevent layout shift when sidebar becomes absolute */}
        <div className={`hidden md:block transition-all duration-300 ease-in-out flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`} />

        {/* Sidebar */}
        <aside
          onMouseEnter={() => collapsed && setSidebarHovered(true)}
          onMouseLeave={() => collapsed && setSidebarHovered(false)}
          className={`${(collapsed && !sidebarHovered) ? 'w-16' : 'w-64'
            } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          fixed md:absolute left-0 z-40 h-[calc(100vh-4rem)] border-r border-border/50 glass transition-all duration-300 ease-in-out flex flex-col ${collapsed && sidebarHovered ? 'shadow-2xl' : ''}`}
        >
          <div className="flex-1 overflow-y-auto py-6 hide-scrollbar">
            <nav className="space-y-2.5 px-3">
              {sidebarItems.map((item) => {
                if (item.href === '/reports' && !canViewReports()) return null;

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all overflow-hidden group ${isActive
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {/* Active state indicator */}
                    <NavLinkIndicator isActive={location.pathname.startsWith(item.href)} />

                    <span className={`relative z-10 transition-colors ${collapsed && !sidebarHovered ? 'mx-auto' : ''}`}>
                      {item.icon}
                    </span>
                    {(!collapsed || sidebarHovered) && (
                      <span className="relative z-10 tracking-wide font-medium whitespace-nowrap animate-in fade-in duration-300">
                        {item.title}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          <div className="hidden md:flex p-4 border-t border-border">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {/* Mobile Filters (visible only on small screens) */}
            <div className="md:hidden flex flex-wrap gap-2 mb-4 bg-card p-3 rounded-md border border-border shadow-sm">
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilter('fromDate', e.target.value)}
                className="text-sm bg-muted text-foreground rounded px-2 py-1 flex-1"
                placeholder="From"
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilter('toDate', e.target.value)}
                className="text-sm bg-muted text-foreground rounded px-2 py-1 flex-1"
                placeholder="To"
              />
              <select
                value={filters.year}
                onChange={(e) => setFilter('year', e.target.value)}
                className="text-sm bg-muted text-foreground rounded px-2 py-1 flex-1"
              >
                <option value="All">All Time</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
              <select
                value={filters.department}
                onChange={(e) => setFilter('department', e.target.value)}
                disabled={isRestrictedDept}
                className={`text-sm bg-muted text-foreground rounded px-2 py-1 flex-1 ${isRestrictedDept ? 'opacity-70' : ''}`}
              >
                <option value="All">All Depts</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
