import Link from "next/link";
import Image from "next/image";
import { 
  Users, 
  Settings, 
  Plus,
  Briefcase,
  Building2
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
                <button className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-600 text-white flex items-center justify-center transition-colors shadow-sm focus:outline-none">
                  <Plus className="w-5 h-5" />
                </button>
              } />
              <DropdownMenuContent align="end" side="right" sideOffset={10} className="w-48 bg-gray-900 text-gray-200 border-gray-800 z-50">
                <div className="px-2 py-1.5 text-sm font-medium text-gray-400">Quick Actions</div>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 focus:text-white focus:bg-gray-800 transition-colors" onClick={() => router.push('/dashboard/projects/create')}>
                  Create Project
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 focus:text-white focus:bg-gray-800 transition-colors" onClick={() => router.push('/dashboard/users/create')}>
                  Create User
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 focus:text-white focus:bg-gray-800 transition-colors" onClick={() => router.push('/dashboard/departments?add=true')}>
                  Create Department
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 focus:text-white focus:bg-gray-800 transition-colors" onClick={() => router.push('/dashboard/divisions?add=true')}>
                  Create Division
                </DropdownMenuItem>
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
