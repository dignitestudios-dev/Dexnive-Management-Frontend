"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRouter } from "next-nprogress-bar";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CalendarDays,
  Shield,
  Calendar,
  DollarSign,
  FileText,
  Home,
  History,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LockKeyhole,
  BarChart3
} from "lucide-react";
import { cn } from "@/utils/cn";

export function Sidebar() {
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Collapsed state for the entire sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Expanded/collapsed states for sub-groups
  const [groupsOpen, setGroupsOpen] = useState({
    team: true,
    org: true,
    projects: true,
    ops: true,
    settings: true,
  });

  // Load collapse state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  const toggleGroup = (key: keyof typeof groupsOpen) => {
    setGroupsOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isGroupActive = (paths: string[]) => {
    return paths.some((p) => pathname?.startsWith(p));
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-slate-950 border-r border-slate-900 text-slate-300 transition-all duration-300 relative flex-shrink-0 z-20",
        isCollapsed ? "w-[64px]" : "w-[260px]"
      )}
    >
      {/* Sidebar Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-900 bg-slate-950/40">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 cursor-pointer overflow-hidden py-1.5"
        >
          <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded bg-slate-900">
            <Image src="/images/icon-dx.png" alt="Dexnive" width={32} height={32} className="object-cover" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-white tracking-wider text-sm truncate animate-fade-in">
              DEXNIVE
            </span>
          )}
        </Link>

        {/* Sidebar Collapse Toggle Button */}
        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 custom-scrollbar">
        {/* General Group */}
        <div className="space-y-1">
          <SidebarLink
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
            href="/dashboard"
            active={pathname === "/dashboard"}
            isCollapsed={isCollapsed}
          />
          {!isAdmin && (
            <>
              <SidebarLink
                icon={<CalendarDays className="w-4 h-4" />}
                label="My Timesheet"
                href="/dashboard/my-timesheet"
                active={pathname === "/dashboard/my-timesheet"}
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                icon={<FileText className="w-4 h-4" />}
                label="Add Daily Log"
                href="/dashboard/daily-log"
                active={pathname === "/dashboard/daily-log"}
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                icon={<History className="w-4 h-4" />}
                label="Logs History"
                href="/dashboard/history"
                active={pathname === "/dashboard/history"}
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                icon={<LockKeyhole className="w-4 h-4" />}
                label="Change Password"
                href="/dashboard/settings"
                active={pathname === "/dashboard/settings"}
                isCollapsed={isCollapsed}
              />
            </>
          )}
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            {/* Team Management Group */}
            <SidebarGroup
              label="Team Management"
              isOpen={groupsOpen.team}
              onToggle={() => toggleGroup("team")}
              isCollapsed={isCollapsed}
              isActive={isGroupActive(["/dashboard/users"])}
            >
              <SidebarLink
                icon={<Users className="w-4 h-4" />}
                label="All Users"
                href="/dashboard/users"
                active={pathname === "/dashboard/users"}
                isCollapsed={isCollapsed}
                nested
              />
              <SidebarLink
                icon={<FileText className="w-4 h-4" />}
                label="Missing Entries"
                href="/dashboard/users/missing-entries"
                active={pathname === "/dashboard/users/missing-entries"}
                isCollapsed={isCollapsed}
                nested
              />
              <SidebarLink
                icon={<History className="w-4 h-4" />}
                label="All Worklogs"
                href="/dashboard/users/all-worklogs"
                active={pathname === "/dashboard/users/all-worklogs"}
                isCollapsed={isCollapsed}
                nested
              />
              <SidebarLink
                icon={<CalendarDays className="w-4 h-4" />}
                label="User Timesheets"
                href="/dashboard/users/timesheet"
                active={pathname === "/dashboard/users/timesheet"}
                isCollapsed={isCollapsed}
                nested
              />
            </SidebarGroup>

            {/* Organization Group */}
            <SidebarGroup
              label="Organization"
              isOpen={groupsOpen.org}
              onToggle={() => toggleGroup("org")}
              isCollapsed={isCollapsed}
              isActive={isGroupActive(["/dashboard/departments", "/dashboard/divisions"])}
            >
              <SidebarLink
                icon={<Building2 className="w-4 h-4" />}
                label="Departments"
                href="/dashboard/departments"
                active={pathname === "/dashboard/departments"}
                isCollapsed={isCollapsed}
                nested
              />
              <SidebarLink
                icon={<Layers className="w-4 h-4" />}
                label="Divisions"
                href="/dashboard/divisions"
                active={pathname === "/dashboard/divisions"}
                isCollapsed={isCollapsed}
                nested
              />
            </SidebarGroup>

            {/* Projects Group */}
            <SidebarGroup
              label="Projects"
              isOpen={groupsOpen.projects}
              onToggle={() => toggleGroup("projects")}
              isCollapsed={isCollapsed}
              isActive={isGroupActive(["/dashboard/projects"])}
            >
              <SidebarLink
                icon={<Briefcase className="w-4 h-4" />}
                label="All Projects"
                href="/dashboard/projects"
                active={pathname === "/dashboard/projects"}
                isCollapsed={isCollapsed}
                nested
              />
              <SidebarLink
                icon={<FileText className="w-4 h-4" />}
                label="Stages Template"
                href="/dashboard/projects/stage-templates"
                active={pathname === "/dashboard/projects/stage-templates"}
                isCollapsed={isCollapsed}
                nested
              />
            </SidebarGroup>

            {/* Operations Group */}
            <SidebarGroup
              label="Operations"
              isOpen={groupsOpen.ops}
              onToggle={() => toggleGroup("ops")}
              isCollapsed={isCollapsed}
              isActive={isGroupActive([
                "/dashboard/settings/holidays",
                "/dashboard/settings/rates",
                "/dashboard/settings/reasons",
                "/dashboard/reports",
              ])}
            >
              <SidebarLink
                icon={<BarChart3 className="w-4 h-4" />}
                label="Reports"
                href="/dashboard/reports"
                active={pathname === "/dashboard/reports"}
                isCollapsed={isCollapsed}
                nested
              />
              <SidebarLink
                icon={<Calendar className="w-4 h-4" />}
                label="Holidays"
                href="/dashboard/settings/holidays"
                active={pathname === "/dashboard/settings/holidays"}
                isCollapsed={isCollapsed}
                nested
              />
              <SidebarLink
                icon={<DollarSign className="w-4 h-4" />}
                label="Rates"
                href="/dashboard/settings/rates"
                active={pathname === "/dashboard/settings/rates"}
                isCollapsed={isCollapsed}
                nested
              />
              <SidebarLink
                icon={<FileText className="w-4 h-4" />}
                label="Non-Billable Reasons"
                href="/dashboard/settings/reasons"
                active={pathname === "/dashboard/settings/reasons"}
                isCollapsed={isCollapsed}
                nested
              />
            </SidebarGroup>

            {/* Settings Group */}
            <SidebarGroup
              label="Settings"
              isOpen={groupsOpen.settings}
              onToggle={() => toggleGroup("settings")}
              isCollapsed={isCollapsed}
              isActive={pathname === "/dashboard/settings"}
            >
              <SidebarLink
                icon={<LockKeyhole className="w-4 h-4" />}
                label="Change Password"
                href="/dashboard/settings"
                active={pathname === "/dashboard/settings"}
                isCollapsed={isCollapsed}
                nested
              />
            </SidebarGroup>
          </>
        )}
      </div>

      {/* Sidebar Footer (Collapse Toggle when Collapsed) */}
      {isCollapsed && (
        <div className="h-12 flex items-center justify-center border-t border-slate-900 bg-slate-950/40">
          <button
            onClick={toggleSidebar}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface SidebarGroupProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed: boolean;
  isActive?: boolean;
  children: React.ReactNode;
}

function SidebarGroup({
  label,
  isOpen,
  onToggle,
  isCollapsed,
  isActive,
  children,
}: SidebarGroupProps) {
  if (isCollapsed) {
    return <div className="space-y-1">{children}</div>;
  }

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/40",
          isActive && "text-primary-300"
        )}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            isOpen ? "transform rotate-0" : "transform -rotate-90"
          )}
        />
      </button>
      {isOpen && <div className="space-y-1 pl-1">{children}</div>}
    </div>
  );
}

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  isCollapsed: boolean;
  nested?: boolean;
}

function SidebarLink({
  icon,
  label,
  href,
  active,
  isCollapsed,
  nested,
}: SidebarLinkProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer text-sm transition-colors group relative",
          active
            ? "bg-primary-600/15 text-primary-300 font-semibold border border-primary-500/20"
            : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
          nested && !isCollapsed && "pl-5"
        )}
        title={isCollapsed ? label : undefined}
      >
        <div
          className={cn(
            "shrink-0 transition-colors",
            active ? "text-primary-400" : "text-slate-400 group-hover:text-white"
          )}
        >
          {icon}
        </div>
        {!isCollapsed && <span className="truncate">{label}</span>}

        {/* Active side-indicator */}
        {active && !isCollapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-500 rounded-r-full" />
        )}
      </div>
    </Link>
  );
}
