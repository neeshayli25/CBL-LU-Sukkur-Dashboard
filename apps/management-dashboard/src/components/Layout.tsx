import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  Bell
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

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const mockNotifications = [
    { id: 1, text: "CAPA #42 is Overdue", time: "2 hours ago", type: "warning" },
    { id: 2, text: "New High-Priority Hazard Reported", time: "5 hours ago", type: "danger" },
    { id: 3, text: "Monthly Incident Summary Ready", time: "1 day ago", type: "info" }
  ];

  const { logout, user } = useAuth();
  const { canViewReports, isDepartmentRestricted } = usePermissions();
  const navigate = useNavigate();
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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="font-bold text-xl text-primary flex items-center gap-2">
              <span className="bg-primary text-white p-1 rounded-md text-sm leading-none">LU</span>
              <span className="hidden sm:inline">Sukkur Plant</span>
            </div>
            <div className="hidden lg:flex items-center ml-4 space-x-4 border-l border-border pl-4">
              <span className="text-sm font-medium text-muted-foreground">Management Dashboard</span>
            </div>
          </div>
          
          <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
            <div className="hidden lg:flex items-center space-x-2 bg-muted/50 p-1 rounded-md text-sm">
              <span className="text-muted-foreground px-2">From:</span>
              <input 
                type="date" 
                value={filters.fromDate} 
                onChange={(e) => setFilter('fromDate', e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-foreground cursor-pointer p-0"
              />
              <span className="text-muted-foreground px-2 border-l border-border pl-2">To:</span>
              <input 
                type="date" 
                value={filters.toDate} 
                onChange={(e) => setFilter('toDate', e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-foreground cursor-pointer p-0"
              />
            </div>
            
            <div className="hidden md:flex items-center space-x-2 bg-muted/50 p-1 rounded-md">
              <select 
                value={filters.year} 
                onChange={(e) => setFilter('year', e.target.value)}
                className="text-sm bg-transparent border-none focus:ring-0 text-foreground cursor-pointer"
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
                className={`text-sm bg-transparent border-none focus:ring-0 text-foreground border-l border-border pl-2 ${isRestrictedDept ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <option value="All">All Depts</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select 
                value={filters.status} 
                onChange={(e) => setFilter('status', e.target.value)}
                className="text-sm bg-transparent border-none focus:ring-0 text-foreground cursor-pointer border-l border-border pl-2"
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-l border-border pl-4">
              <div className="relative pr-2 flex items-center">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-muted-foreground hover:text-foreground relative transition-colors rounded-md"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger border border-card"></span>
                </button>
                
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-lg card-shadow z-50 overflow-hidden">
                    <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <button className="text-xs text-primary hover:underline">Mark all as read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {mockNotifications.map(n => (
                        <div key={n.id} className="p-3 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors flex gap-3 items-start">
                          <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                            n.type === 'danger' ? 'bg-danger' : 
                            n.type === 'warning' ? 'bg-secondary' : 'bg-primary'
                          }`} />
                          <div>
                            <p className="text-sm text-foreground leading-tight">{n.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 text-center bg-muted/30 border-t border-border">
                      <button className="text-xs font-medium text-muted-foreground hover:text-foreground">View all notifications</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden sm:flex flex-col items-end border-l border-border pl-4">
                <span className="text-sm font-medium leading-none">{user?.name || 'User'}</span>
                <span className="text-xs text-muted-foreground mt-1">{user?.role || 'Guest'}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                <User className="h-4 w-4" />
              </div>
              <button 
                onClick={handleLogout}
                className="ml-2 p-2 text-muted-foreground hover:text-danger rounded-md transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            collapsed ? 'w-16' : 'w-64'
          } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          fixed md:relative z-40 h-[calc(100vh-4rem)] border-r border-border bg-card transition-all duration-300 ease-in-out flex flex-col`}
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
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? 'shadow-md brightness-110 scale-[1.02] ring-2 ring-white/20 dark:ring-black/20'
                          : 'hover:brightness-110 hover:shadow-sm opacity-90 hover:opacity-100 hover:scale-[1.01]'
                      }`
                    }
                    style={{ 
                      backgroundColor: (item as any).color || '#2563EB',
                      color: '#ffffff'
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className={collapsed ? 'mx-auto' : ''}>{item.icon}</span>
                    {!collapsed && <span className="font-semibold tracking-wide drop-shadow-sm">{item.title}</span>}
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
