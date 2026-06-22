"use client";

import { useAppSelector } from "@/store";

export function useAuth() {
  const authState = useAppSelector((state) => state.auth);
  
  return {
    user: authState.user,
    accessToken: authState.accessToken,
    isAuthenticated: authState.isAuthenticated,
    isInitialized: authState.isInitialized,
    isLead: authState.user?.isLead || false,
    role: typeof authState.user?.role === 'object' && authState.user.role !== null ? authState.user.role.name : null,
    isAdmin: (typeof authState.user?.role === 'object' && authState.user.role !== null ? authState.user.role.name.toLowerCase() : "") === "admin" || authState.user?.isLead === true,
  };
}
