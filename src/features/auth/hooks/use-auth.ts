"use client";

import { useAppSelector } from "@/store";

export function useAuth() {
  const authState = useAppSelector((state) => state.auth);
  
  const rawRole = typeof authState.user?.role === 'object' && authState.user.role !== null 
    ? authState.user.role.name 
    : (typeof authState.user?.role === 'string' ? authState.user.role : '');

  const normalizedRole = rawRole.trim().toLowerCase();

  const isAdmin = normalizedRole === "admin";
  const isLead = normalizedRole === "lead";
  const isProjectManager = normalizedRole === "project manager" || normalizedRole === "pm";
  const isUser = !isAdmin && !isLead && !isProjectManager;

  // 1. Financial access (price, loggedAmount, rates card configuration): Admin strictly
  const hasFinancialAccess = isAdmin;

  // 2. Full application management access (Team, Org, Reports, Operations): Admin and Lead
  const isFullManager = isAdmin || isLead;

  // 3. Projects management pages (/dashboard/projects/*): Admin, Lead, Project Manager
  const canManageProjects = isAdmin || isLead || isProjectManager;

  return {
    user: authState.user,
    accessToken: authState.accessToken,
    isAuthenticated: authState.isAuthenticated,
    isInitialized: authState.isInitialized,
    role: rawRole || null,
    isAdmin,
    isLead,
    isProjectManager,
    isUser,
    hasFinancialAccess,
    isFullManager,
    canManageProjects,
  };
}
