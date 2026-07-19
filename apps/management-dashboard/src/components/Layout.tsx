import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@cbl/auth';
import { useFilters } from '../context/FilterContext';
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Tags,
  Building2,
  AlertCircle,
  Activity,
  Target,
  CheckSquare,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

import { DEPARTMENTS } from '../config/constants';
import { ALL_SECTIONS } from '../config/sectionSchemas';
import { iconMap } from './iconMap';

const sidebarItems = [
  { title: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/dashboard" },
  { title: "Audit Plan", icon: <ClipboardList className="h-5 w-5" />, href: "/audit-plan" },
  { title: "Observations", icon: <AlertTriangle className="h-5 w-5" />, href: "/observations" },
  { title: "Categories", icon: <Tags className="h-5 w-5" />, href: "/categories" },
  { title: "Departments", icon: <Building2 className="h-5 w-5" />, href: "/departments" },
  { title: "Priority", icon: <AlertCircle className="h-5 w-5" />, href: "/priority" },
  { title: "Status Tracker", icon: <Activity className="h-5 w-5" />, href: "/status-tracker" },
  { title: "Root Cause", icon: <Target className="h-5 w-5" />, href: "/root-cause" },
  { title: "Actions / CAPA", icon: <CheckSquare className="h-5 w-5" />, href: "/actions" },
  { title: "Due Dates", icon: <Calendar className="h-5 w-5" />, href: "/due-dates" },
  { title: "Reports", icon: <FileText className="h-5 w-5" />, href: "/reports" },
  { title: "Analytics", icon: <BarChart3 className="h-5 w-5" />, href: "/analytics" },
  ...ALL_SECTIONS.map(s => {
    const IconComponent = iconMap[s.icon];
    return {
      title: s.title,
      icon: IconComponent ? <IconComponent className="h-5 w-5" /> : null,
      href: s.path,
      color: s.accentColor
    };
  }),
  { title: "Settings", icon: <Settings className="h-5 w-5" />, href: "/settings" },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { filters, setFilter } = useFilters();
  
  const isAdmin = hasRole('Admin');

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
            {/* Global Filters */}
            <div className="hidden md:flex items-center space-x-2 bg-muted/50 p-1 rounded-md">
              <select 
                value={filters.year} 
                onChange={(e) => setFilter('year', e.target.value)}
                className="text-sm bg-transparent border-none focus:ring-0 text-foreground cursor-pointer"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
              <select 
                value={filters.department} 
                onChange={(e) => setFilter('department', e.target.value)}
                disabled={!isAdmin}
                className={`text-sm bg-transparent border-none focus:ring-0 text-foreground border-l border-border pl-2 ${!isAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
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
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium leading-none">{user?.name || 'Plant Manager'}</span>
                <span className="text-xs text-muted-foreground mt-1">{isAdmin ? 'Admin' : 'User'}</span>
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
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                  style={({ isActive }) => isActive && (item as any).color ? { color: (item as any).color, backgroundColor: `${(item as any).color}15` } : {}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={collapsed ? 'mx-auto' : ''} style={{ color: (item as any).color }}>{item.icon}</span>
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              ))}
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
               <select 
                value={filters.year} 
                onChange={(e) => setFilter('year', e.target.value)}
                className="text-sm bg-muted text-foreground rounded px-2 py-1 flex-1"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
              <select 
                value={filters.department} 
                onChange={(e) => setFilter('department', e.target.value)}
                disabled={!isAdmin}
                className={`text-sm bg-muted text-foreground rounded px-2 py-1 flex-1 ${!isAdmin ? 'opacity-70' : ''}`}
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
