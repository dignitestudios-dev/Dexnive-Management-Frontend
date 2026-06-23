import { LogOut, User as UserIcon, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAppDispatch } from "@/store";
import { logout } from "@/store/slices/auth.slice";
import { useRouter } from "next-nprogress-bar";
import { useLogoutMutation } from "@/features/auth/api/auth.mutations";
import { useGetMyUserQuery } from "@/features/users/api/users.queries";

export function Header() {
  const { user: localUser } = useAuth();
  const { data: myUserData } = useGetMyUserQuery();
  const user = myUserData?.data || localUser;
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    // Call backend logout API
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        // Clear local state regardless of API success to ensure user is logged out locally
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-user");
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        dispatch(logout());
        router.push("/auth/login");
      }
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="h-14 w-full bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
      
      {/* Breadcrumbs / Title */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 hover:text-gray-900 cursor-pointer">Dexnive</span>
        <span className="text-gray-400">/</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 cursor-pointer">{typeof user?.department === 'object' ? user?.department?.name : (user?.department || "")}</span>
          {user?.isLead && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">Lead</span>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-medium text-sm hover:ring-2 hover:ring-primary-500 hover:ring-offset-1 transition-all"
          >
            {getInitials()}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
              </div>
              <button 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                {logoutMutation.isPending ? "Logging out..." : "Log out"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen loading overlay during logout */}
      {logoutMutation.isPending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            <p className="text-lg font-medium text-gray-900">Logging out safely...</p>
          </div>
        </div>
      )}
    </header>
  );
}
