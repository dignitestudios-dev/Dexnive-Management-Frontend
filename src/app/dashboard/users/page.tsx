"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Search, Loader2, Pencil, Eye, CheckCircle2, XCircle, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useInfiniteUsersQuery } from "@/features/users/api/users.queries";
import { useGetRolesQuery, useGetDepartmentsQuery } from "@/features/users/api/options.queries";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next-nprogress-bar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getRoleBadgeColor(roleName: string) {
  const name = roleName.toLowerCase();
  if (name === "admin") return "bg-purple-100 text-purple-800 border-purple-200";
  if (name === "lead") return "bg-blue-100 text-blue-800 border-blue-200";
  if (name === "manager") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function UsersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [roleIds, setRoleIds] = useState<string[]>(searchParams.getAll("roleId"));
  const [departmentIds, setDepartmentIds] = useState<string[]>(searchParams.getAll("departmentId"));

  const [tempRoleIds, setTempRoleIds] = useState<string[]>([]);
  const [tempDepartmentIds, setTempDepartmentIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleOpenFilter = (open: boolean) => {
    setIsFilterOpen(open);
    if (open) {
      setTempRoleIds(roleIds);
      setTempDepartmentIds(departmentIds);
    }
  };

  const toggleTempRole = (id: string) => setTempRoleIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  const toggleTempDept = (id: string) => setTempDepartmentIds(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  const applyFilters = () => {
    setRoleIds(tempRoleIds);
    setDepartmentIds(tempDepartmentIds);
    setIsFilterOpen(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }

    params.delete("roleId");
    roleIds.forEach(id => params.append("roleId", id));

    params.delete("departmentId");
    departmentIds.forEach(id => params.append("departmentId", id));

    // We use router.push to update URL without reloading the page
    // For next-nprogress-bar, replacing avoids adding tons of history entries for every keystroke
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, roleIds, departmentIds, pathname, router, searchParams]);

  const limit = 20;

  const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery();
  const { data: deptsData, isLoading: isLoadingDepts } = useGetDepartmentsQuery();
  const roles = rolesData?.data || [];
  const departments = deptsData?.data || [];

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteUsersQuery({ 
    limit, 
    search: debouncedSearch, 
    roleId: roleIds.length > 0 ? roleIds : undefined, 
    departmentId: departmentIds.length > 0 ? departmentIds : undefined,
  });

  const activeFilterCount = roleIds.length + departmentIds.length;

  const users = data?.pages.flatMap((page) => page.data) || [];

  // Intersection Observer for Infinite Scroll
  const observerTarget = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Dialog State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDetails = (user: any) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setRoleIds([]);
    setDepartmentIds([]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Members</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your team members and their account permissions here.</p>
        </div>
        <Link href="/dashboard/users/create">
          <Button className="rounded-md px-4 py-2 gap-2 shadow-md shadow-primary-500/20">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-center">
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-md bg-white w-full h-9 shadow-sm"
              />
            </div>
            <Popover open={isFilterOpen} onOpenChange={handleOpenFilter}>
              <PopoverTrigger className={cn("inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input rounded-md px-4 py-2 h-9 gap-2 shadow-sm", activeFilterCount > 0 ? "bg-purple-600 hover:bg-purple-700 text-white border-0" : "bg-white hover:bg-accent hover:text-accent-foreground")}>
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20 text-xs font-semibold">
                      {activeFilterCount}
                    </span>
                  )}
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 rounded-xl shadow-lg border-gray-200" align="start">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                </div>
                <div className="p-4 space-y-6">
                  {/* Department */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Department</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTempDepartmentIds([])}
                        className={cn("px-4 py-1.5 rounded-full text-sm border transition-colors", tempDepartmentIds.length === 0 ? "bg-primary-50 border-primary-200 text-primary-700 font-medium" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}
                      >
                        All
                      </button>
                      {departments.map(d => (
                        <button
                          key={d._id}
                          onClick={() => toggleTempDept(d._id)}
                          className={cn("px-4 py-1.5 rounded-full text-sm border transition-colors", tempDepartmentIds.includes(d._id) ? "bg-primary-50 border-primary-200 text-primary-700 font-medium" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}
                        >
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Role</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTempRoleIds([])}
                        className={cn("px-4 py-1.5 rounded-full text-sm border transition-colors", tempRoleIds.length === 0 ? "bg-primary-50 border-primary-200 text-primary-700 font-medium" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}
                      >
                        All
                      </button>
                      {roles.map(r => (
                        <button
                          key={r._id}
                          onClick={() => toggleTempRole(r._id)}
                          className={cn("px-4 py-1.5 rounded-full text-sm border transition-colors", tempRoleIds.includes(r._id) ? "bg-primary-50 border-primary-200 text-primary-700 font-medium" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl">
                  <Button variant="ghost" className="text-gray-500 rounded-md" onClick={() => { setTempRoleIds([]); setTempDepartmentIds([]); }}>
                    Reset
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-md" onClick={() => setIsFilterOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="rounded-md bg-purple-600 hover:bg-purple-700 text-white px-6 shadow-md" onClick={applyFilters}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {(roleIds.length > 0 || departmentIds.length > 0) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-sm text-gray-500 mr-1">Active filters:</span>
              
              {departmentIds.length > 0 && (
                <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3 mr-1">
                  <span className="text-xs font-semibold text-gray-700">Departments:</span>
                  {departmentIds.map(id => {
                    const d = departments.find(d => d._id === id);
                    if (!d) return null;
                    return (
                      <span key={`dept-${id}`} className="px-2 py-0.5 rounded-md text-xs font-medium border bg-purple-50 border-purple-200 text-purple-700 flex items-center gap-1">
                        {d.name}
                        <button onClick={() => setDepartmentIds(prev => prev.filter(x => x !== id))} className="hover:text-purple-900 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {roleIds.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-700">Roles:</span>
                  {roleIds.map(id => {
                    const r = roles.find(r => r._id === id);
                    if (!r) return null;
                    return (
                      <span key={`role-${id}`} className="px-2 py-0.5 rounded-md text-xs font-medium border bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
                        {r.name}
                        <button onClick={() => setRoleIds(prev => prev.filter(x => x !== id))} className="hover:text-blue-900 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <button 
                onClick={() => { setRoleIds([]); setDepartmentIds([]); }}
                className="text-xs text-gray-500 hover:text-gray-900 ml-2 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50/30">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <p className="text-gray-500 mt-4">Loading team members...</p>
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-red-500">
              Failed to load users. Please try again.
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">No users found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {users.map((user) => {
                const roleName = typeof user.role === 'object' ? user.role.name : user.role;
                const deptName = typeof user.department === 'object' ? user.department.name : user.department;
                
                return (
                  <ContextMenu key={user._id}>
                    <ContextMenuTrigger>
                      <Card className="rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all cursor-context-menu border-gray-200/60 bg-white group">
                        <CardContent className="p-5 flex flex-col gap-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 truncate" title={user.name}>{user.name}</h3>
                                {user.isLead && (
                                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">Lead</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</p>
                            </div>
                            <div title={user.isDeleted ? "Inactive" : "Active"} className="mt-1 flex-shrink-0">
                              {user.isDeleted ? (
                                <span className="flex w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                              ) : (
                                <span className="flex w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                              )}
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">Dept:</span>
                              <span className="font-medium text-gray-900 truncate ml-2" title={deptName}>{deptName}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">Emp Code:</span>
                              <span className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-xs">{user.employeeCode}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56 p-1.5">
                      <ContextMenuItem onClick={() => openDetails(user)} className="gap-3 py-2.5">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gray-50 border border-gray-100 group-hover/context-menu-item:bg-white transition-colors">
                          <Eye className="w-3.5 h-3.5 text-gray-500 group-hover/context-menu-item:text-primary-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">View Profile</span>
                          <span className="text-xs text-gray-500">See full employee details</span>
                        </div>
                      </ContextMenuItem>
                      <ContextMenuSeparator className="my-1.5" />
                      <ContextMenuItem onClick={() => router.push(`/dashboard/users/${user._id}/edit`)} className="gap-3 py-2.5">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gray-50 border border-gray-100 group-hover/context-menu-item:bg-white transition-colors">
                          <Pencil className="w-3.5 h-3.5 text-gray-500 group-hover/context-menu-item:text-primary-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">Edit User</span>
                          <span className="text-xs text-gray-500">Modify permissions & role</span>
                        </div>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          )}

          {/* Infinite Scroll Target */}
          <div ref={observerTarget} className="py-4 mt-4 flex justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                <span className="text-sm">Loading more...</span>
              </div>
            )}
            {!hasNextPage && users.length > 0 && (
              <span className="text-sm text-gray-400">No more users to load</span>
            )}
          </div>
        </div>
      </div>

      {/* User Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg p-0 overflow-hidden border-0 shadow-2xl">
          {selectedUser && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 border-b border-primary-100/50">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedUser.name}
                      {selectedUser.isLead && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">Lead</span>
                      )}
                    </div>
                    {selectedUser.isDeleted ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 font-medium">
                    {selectedUser.email}
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="p-6 space-y-4 bg-white">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Employee Code</p>
                    <p className="font-mono text-gray-900 font-medium bg-gray-50 px-2 py-1 rounded inline-block">
                      {selectedUser.employeeCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Role</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getRoleBadgeColor(typeof selectedUser.role === 'object' ? selectedUser.role.name : selectedUser.role)}`}>
                      {typeof selectedUser.role === 'object' ? selectedUser.role.name : selectedUser.role}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Department</p>
                    <p className="text-gray-900 font-medium">
                      {typeof selectedUser.department === 'object' ? selectedUser.department.name : selectedUser.department}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Joining Date</p>
                    <p className="text-gray-900">
                      {selectedUser.joiningDate ? new Date(selectedUser.joiningDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <Button variant="ghost" className="rounded-md" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  className="rounded-md gap-2 shadow-sm"
                  onClick={() => router.push(`/dashboard/users/${selectedUser._id}/edit`)}
                >
                  <Pencil className="w-4 h-4" />
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPage() {
  return (
    <React.Suspense fallback={
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    }>
      <UsersPageContent />
    </React.Suspense>
  );
}
