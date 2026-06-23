import Link from "next/link";
import Image from "next/image";
import { 
  Users, 
  Settings, 
  Plus,
  Briefcase,
  Building2,
  UserPlus,
  Layers,
  CalendarPlus,
  Zap
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRouter } from "next-nprogress-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PrimarySidebar() {
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const isTeamActive = pathname?.startsWith("/dashboard/users");
  const isOrgActive = pathname?.startsWith("/dashboard/departments") || pathname?.startsWith("/dashboard/divisions");
  const isProjectsActive = pathname?.startsWith("/dashboard/projects");

  return (
    <div className="flex flex-col h-full w-[60px] bg-gray-900 border-r border-gray-800 text-gray-400 py-3 items-center z-20 flex-shrink-0">
      {/* Brand / Logo */}
      <div className="w-10 h-10 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-900">
        <Image src="/images/icon-dx.png" alt="Dexnive" width={40} height={40} className="object-cover" />
      </div>

      <div className="w-8 h-px bg-gray-800 my-2" />

      {/* Primary Global Navigation */}
      <nav className="flex flex-col gap-3 w-full items-center mt-2 flex-1">
        {isAdmin && (
          <>
            <NavItem icon={<Users className="w-5 h-5" />} tooltip="Team" active={isTeamActive} href="/dashboard/users" />
            <NavItem icon={<Building2 className="w-5 h-5" />} tooltip="Organization" active={isOrgActive} href="/dashboard/departments" />
            <NavItem icon={<Briefcase className="w-5 h-5" />} tooltip="Projects" active={isProjectsActive} href="/dashboard/projects" />
          </>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-3 w-full items-center mb-2">
        {isAdmin && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white flex items-center justify-center shadow-lg shadow-primary-500/20 focus:outline-none transition-all duration-300 hover:scale-105 group relative">
                  <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Plus className="w-5 h-5" />
                </button>
              } />
              <DropdownMenuContent align="end" side="right" sideOffset={16} className="w-72 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-xl shadow-gray-200/50 rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                
                <div className="px-3 py-3 flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-gray-100">
                    <Zap className="w-4 h-4 text-primary-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Quick Actions</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Fast-track your workflow</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-gray-50 focus:bg-gray-50 transition-all duration-300 group outline-none" onClick={() => router.push('/dashboard/projects/create')}>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20 transition-all duration-300">
                      <Briefcase className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">New Project</span>
                      <span className="text-[11px] text-gray-500 transition-colors">Setup external or internal</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-gray-50 focus:bg-gray-50 transition-all duration-300 group outline-none" onClick={() => router.push('/dashboard/users/create')}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-emerald-500/20 transition-all duration-300">
                      <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Add User</span>
                      <span className="text-[11px] text-gray-500 transition-colors">Onboard a new team member</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-gray-50 focus:bg-gray-50 transition-all duration-300 group outline-none" onClick={() => router.push('/dashboard/departments?add=true')}>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-amber-500/20 transition-all duration-300">
                      <Building2 className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">New Department</span>
                      <span className="text-[11px] text-gray-500 transition-colors">Expand your organization</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-gray-50 focus:bg-gray-50 transition-all duration-300 group outline-none" onClick={() => router.push('/dashboard/divisions?add=true')}>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-purple-500/20 transition-all duration-300">
                      <Layers className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">New Division</span>
                      <span className="text-[11px] text-gray-500 transition-colors">Create sub-teams and units</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-gray-50 focus:bg-gray-50 transition-all duration-300 group outline-none" onClick={() => router.push('/dashboard/users/holidays?add=true')}>
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-pink-500/20 transition-all duration-300">
                      <CalendarPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Add Holiday</span>
                      <span className="text-[11px] text-gray-500 transition-colors">Schedule company days off</span>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-8 h-px bg-gray-800 my-2" />
          </>
        )}
        <NavItem icon={<Settings className="w-5 h-5" />} tooltip="Settings" href="/dashboard/settings" />
      </div>
    </div>
  );
}

function NavItem({ icon, active, tooltip, href = "#" }: { icon: React.ReactNode; active?: boolean; tooltip: string; href?: string }) {
  return (
    <Link 
      href={href} 
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors group relative ${
        active 
          ? "bg-primary-900/50 text-primary-300" 
          : "hover:bg-gray-800 hover:text-gray-200"
      }`}
      title={tooltip}
    >
      {icon}
      
      {/* Active Indicator Line */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-400 rounded-r-full" />
      )}
    </Link>
  );
}
