"use client";

import React, { use } from "react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDay } from "@/lib/datetime";
import {
  AlertCircle,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  User,
  Tags,
} from "lucide-react";
import { useGetShiftProjectUsersQuery } from "@/features/reports/api/reports.queries";

interface PageProps {
  params: Promise<{ shiftDate: string; projectId: string }>;
}

export default function ShiftProjectUsersPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const shiftDate = decodeURIComponent(resolvedParams.shiftDate);
  const projectId = decodeURIComponent(resolvedParams.projectId);

  const { data, isLoading, error } = useGetShiftProjectUsersQuery(shiftDate, projectId);
  const responseData = data?.data?.users || [];
  const projectInfo = data?.data?.project;

  const totalBillable = responseData.reduce((sum, row) => sum + (row.billableHours || 0), 0);
  const totalNonBillable = responseData.reduce((sum, row) => sum + (row.nonBillableHours || 0), 0);
  const totalOvertime = responseData.reduce((sum, row) => sum + (row.overtimeHours || 0), 0);
  const overallTotal = responseData.reduce((sum, row) => sum + (row.totalHours || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-300">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <div className="flex items-center text-sm text-gray-500 font-medium overflow-x-auto whitespace-nowrap pb-1 custom-scrollbar">
          <Link href="/dashboard/reports/shifts" className="hover:text-purple-600 transition-colors">
            Shifts Breakdown
          </Link>
          <ChevronRight className="w-4 h-4 mx-1 shrink-0" />
          <Link href={`/dashboard/reports/shifts/${shiftDate}`} className="hover:text-purple-600 transition-colors">
            {formatDay(shiftDate)}
          </Link>
          <ChevronRight className="w-4 h-4 mx-1 shrink-0" />
          <span className="text-gray-900">{projectInfo?.name || "Project"}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Shift Users</h1>
            <p className="text-sm text-gray-500 mt-1">User breakdown for {projectInfo?.name || "Project"} on {formatDay(shiftDate)}</p>
          </div>
          <Link href={`/dashboard/reports/shifts/${shiftDate}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl shadow-sm gap-3">
          <Loader className="w-8 h-8 text-purple-600" />
          <span className="text-sm font-medium text-gray-500">Loading user breakdown...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-2xl gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <h3 className="font-semibold text-red-955">Failed to load users</h3>
          <p className="text-sm text-red-700 max-w-md">
            {(error as any)?.response?.data?.message || "An unexpected error occurred while fetching user data."}
          </p>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !error && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
            {responseData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
                <FileBarChart className="w-10 h-10 text-gray-300" />
                <h3 className="font-semibold text-gray-900">No Users Found</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  No users recorded hours for this project on {formatDay(shiftDate)}.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="text-sm font-bold uppercase tracking-wider text-purple-700 bg-purple-50 sticky top-0 z-20">
                    <tr className="border-b border-purple-200 bg-purple-50">
                      <th className="px-4 py-3 text-left border-r border-purple-200 font-semibold w-10">#</th>
                      <th className="px-6 py-3 text-left border-r border-purple-200 font-semibold w-64 min-w-[200px]">User</th>
                      <th className="px-6 py-3 text-left border-r border-purple-200 font-semibold w-64 min-w-[200px]">Categories</th>
                      <th className="px-4 py-3 text-center border-r border-purple-200 font-semibold w-32 text-emerald-700">Billable</th>
                      <th className="px-4 py-3 text-center border-r border-purple-200 font-semibold w-32 text-amber-700">Non-Billable</th>
                      <th className="px-4 py-3 text-center border-r border-purple-200 font-semibold w-32 text-rose-700">Overtime</th>
                      <th className="px-4 py-3 text-center border-purple-200 font-bold w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-sm text-gray-700">
                    {responseData.map((row, index) => {
                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-3 border-r border-b border-gray-300 font-medium text-gray-400 text-center">{index + 1}</td>
                          <td className="px-6 py-3 border-r border-b border-gray-300 font-semibold text-gray-955 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                              <div className="flex flex-col">
                                <span>{row.user.name}</span>
                                <span className="text-xs text-gray-500 font-normal">{row.user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 border-r border-b border-gray-300">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {row.categories && row.categories.length > 0 ? (
                                row.categories.map((cat, i) => (
                                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                    {cat.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-xs italic">None</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 border-r border-b border-gray-300 text-center font-normal text-emerald-600 bg-emerald-50/10">
                            {row.billableHours > 0 ? row.billableHours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                          <td className="px-4 py-3 border-r border-b border-gray-300 text-center font-normal text-amber-600 bg-amber-50/10">
                            {row.nonBillableHours > 0 ? row.nonBillableHours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                          <td className="px-4 py-3 border-r border-b border-gray-300 text-center font-normal text-rose-600 bg-rose-50/10">
                            {row.overtimeHours > 0 ? row.overtimeHours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-300 text-center font-bold bg-purple-50 text-purple-700">
                            {row.totalHours > 0 ? row.totalHours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  
                  {/* Footer Totals */}
                  {responseData.length > 0 && (
                    <tfoot className="bg-purple-50/70 font-bold border-t-2 border-b-2 border-purple-200 text-sm text-gray-900 sticky bottom-0 z-10">
                      <tr className="bg-purple-50">
                        <td colSpan={3} className="px-6 py-3 border-r border-gray-300 text-right whitespace-nowrap text-gray-900">
                          Total Hours
                        </td>

                        <td className="px-4 py-3 border-r border-gray-300 text-center bg-emerald-100 text-emerald-800 font-extrabold text-sm">
                          {totalBillable > 0 ? totalBillable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                        </td>
                        <td className="px-4 py-3 border-r border-gray-300 text-center bg-amber-100 text-amber-800 font-extrabold text-sm">
                          {totalNonBillable > 0 ? totalNonBillable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                        </td>
                        <td className="px-4 py-3 border-r border-gray-300 text-center bg-rose-100 text-rose-800 font-extrabold text-sm">
                          {totalOvertime > 0 ? totalOvertime.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                        </td>
                        <td className="px-4 py-3 border-gray-300 text-center bg-purple-200 text-purple-900 font-extrabold text-sm">
                          {overallTotal > 0 ? overallTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
