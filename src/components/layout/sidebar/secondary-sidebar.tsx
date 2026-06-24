"use client";

import Image from "next/image";

import { ChevronDown, ChevronRight, FolderClosed, Hash, MoreHorizontal, Plus, FileText, History, Users, Shield, Building2, Briefcase, Calendar, DollarSign, Home } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function SecondarySidebar() {
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  
  const isTeamRoute = pathname?.startsWith("/dashboard/users");
  const isOrgRoute = pathname?.startsWith("/dashboard/departments") || pathname?.startsWith("/dashboard/divisions");
  const isProjectsRoute = pathname?.startsWith("/dashboard/projects");
  const isSettingsRoute = pathname?.startsWith("/dashboard/settings");

  return (
    <div className="flex flex-col h-full w-[260px] bg-gray-50 border-r border-gray-200 flex-shrink-0 z-10">
      {/* Header Workspace Name */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 bg-white shadow-sm shadow-gray-100/50">
        <div className="flex items-center gap-2 font-medium text-gray-900 w-full cursor-pointer hover:bg-gray-50 p-1.5 rounded-md -ml-1.5 transition-colors">
          <Image src="/images/logo-dx.webp" alt="Dexnive CRM" width={120} height={24} className="object-contain" />
          <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
        
        {isTeamRoute && isAdmin ? (
          <div className="mb-6">
            <div className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between group">
              <span>Team Management</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <SidebarItem icon={<Users className="w-4 h-4" />} label="All Users" href="/dashboard/users" active={pathname === "/dashboard/users"} />
              <SidebarItem icon={<FileText className="w-4 h-4" />} label="Missing Entries" href="/dashboard/users/missing-entries" active={pathname === "/dashboard/users/missing-entries"} />
              <SidebarItem icon={<History className="w-4 h-4" />} label="All Worklogs" href="/dashboard/users/all-worklogs" active={pathname === "/dashboard/users/all-worklogs"} />
            </div>
          </div>
        ) : isOrgRoute && isAdmin ? (
          <div className="mb-6">
            <div className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between group">
              <span>Organization</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <SidebarItem icon={<Building2 className="w-4 h-4" />} label="Departments" href="/dashboard/departments" active={pathname === "/dashboard/departments"} />
              <SidebarItem icon={<Building2 className="w-4 h-4" />} label="Divisions" href="/dashboard/divisions" active={pathname === "/dashboard/divisions"} />
            </div>
          </div>
        ) : isProjectsRoute && isAdmin ? (
          <div className="mb-6">
            <div className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between group">
              <span>Projects</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <SidebarItem icon={<Briefcase className="w-4 h-4" />} label="All Projects" href="/dashboard/projects" active={pathname === "/dashboard/projects"} />
            </div>
          </div>
        ) : isSettingsRoute && isAdmin ? (
          <div className="mb-6">
            <div className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between group">
              <span>Settings</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <SidebarItem icon={<Shield className="w-4 h-4" />} label="Security" href="/dashboard/settings" active={pathname === "/dashboard/settings"} />
              <SidebarItem icon={<Calendar className="w-4 h-4" />} label="Holidays" href="/dashboard/settings/holidays" active={pathname === "/dashboard/settings/holidays"} />
              <SidebarItem icon={<DollarSign className="w-4 h-4" />} label="Rates" href="/dashboard/settings/rates" active={pathname === "/dashboard/settings/rates"} />
              <SidebarItem icon={<FileText className="w-4 h-4" />} label="Non-Billable Reasons" href="/dashboard/settings/reasons" active={pathname === "/dashboard/settings/reasons"} />
            </div>
          </div>
        ) : (
          <>
            {/* Favorites / Quick Links Section */}
            <div className="mb-6">
              <div className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between group">
                <span>Favorites</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <SidebarItem icon={<FileText className="w-4 h-4" />} label="Daily Logs" href="/dashboard/daily-log" />
                <SidebarItem icon={<History className="w-4 h-4" />} label="Logs History" href="/dashboard/history" />
                {isAdmin && <SidebarItem icon={<Hash className="w-4 h-4" />} label="Team Updates" href="/dashboard/updates" />}
              </div>
            </div>

            {/* Spaces / Folders Section */}
            {isAdmin && (
              <div>
                <div className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between group">
                  <span>Spaces</span>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-600 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex flex-col gap-0.5">
                  <CollapsibleFolder title="Engineering">
                    <SidebarItem icon={<Hash className="w-4 h-4" />} label="Frontend" nested />
                    <SidebarItem icon={<Hash className="w-4 h-4" />} label="Backend" nested />
                  </CollapsibleFolder>
                  <CollapsibleFolder title="Design" />
                  <CollapsibleFolder title="Management" />
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

function SidebarItem({ icon, label, nested, href = "#", active }: { icon: React.ReactNode; label: string; nested?: boolean; href?: string; active?: boolean }) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors group ${nested ? 'ml-4' : ''} ${active ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'}`}>
        <div className={`${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'} transition-colors`}>
          {icon}
        </div>
        <span className="truncate">{label}</span>
        {!active && (
          <button className="opacity-0 group-hover:opacity-100 ml-auto p-0.5 text-gray-400 hover:text-gray-700 rounded transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    </Link>
  );
}

function CollapsibleFolder({ title, children }: { title: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-0.5">
      <div 
        className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-lg cursor-pointer text-sm text-gray-700 hover:bg-gray-200/50 transition-colors group"
        onClick={() => setOpen(!open)}
      >
        <div className="w-5 h-5 flex items-center justify-center text-gray-400">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
        <FolderClosed className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
        <span className="font-medium truncate">{title}</span>
      </div>
      {open && children && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

