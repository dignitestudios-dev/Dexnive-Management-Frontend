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
  Briefcase,
} from "lucide-react";
import { useGetShiftProjectsQuery } from "@/features/reports/api/reports.queries";

interface PageProps {
  params: Promise<{ shiftDate: string }>;
}

export default function ShiftProjectsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const shiftDate = decodeURIComponent(resolvedParams.shiftDate);

  const { data, isLoading, error } = useGetShiftProjectsQuery(shiftDate);
  const responseData = data?.data?.projects || [];

  // Extract unique department names
  const departmentNamesSet = new Set<string>();
  responseData.forEach((project) => {
    project.departments.forEach((dept) => {
      departmentNamesSet.add(dept.name);
    });
  });
  const departmentNames = Array.from(departmentNamesSet).sort();
  const displayDeptName = (name: string) => name === "Project Management" ? "PM" : name;

  // Calculate Column Totals
  const colBillableTotals = departmentNames.reduce((acc, deptName) => {
    acc[deptName] = responseData.reduce((sum, row) => {
      const dept = row.departments.find(d => d.name === deptName);
      return sum + (dept?.billableHours || 0);
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  const colNonBillableTotals = departmentNames.reduce((acc, deptName) => {
    acc[deptName] = responseData.reduce((sum, row) => {
      const dept = row.departments.find(d => d.name === deptName);
      return sum + (dept?.nonBillableHours || 0);
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  const colTotalTotals = departmentNames.reduce((acc, deptName) => {
    acc[deptName] = responseData.reduce((sum, row) => {
      const dept = row.departments.find(d => d.name === deptName);
      return sum + (dept?.totalHours || 0);
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  const overallBillableTotal = responseData.reduce((sum, row) => {
    return sum + row.departments.reduce((deptSum, dept) => deptSum + (dept.billableHours || 0), 0);
  }, 0);

  const overallNonBillableTotal = responseData.reduce((sum, row) => {
    return sum + row.departments.reduce((deptSum, dept) => deptSum + (dept.nonBillableHours || 0), 0);
  }, 0);

  const overallTotalTotal = responseData.reduce((sum, row) => sum + (row.totalHours || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-300">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <div className="flex items-center text-sm text-gray-500 font-medium">
          <Link href="/dashboard/reports/shifts" className="hover:text-purple-600 transition-colors">
            Shifts Breakdown
          </Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-gray-900">{formatDay(shiftDate)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Shift Projects</h1>
            <p className="text-sm text-gray-500 mt-1">Project breakdown for {formatDay(shiftDate)}</p>
          </div>
          <Link href="/dashboard/reports/shifts">
            <Button variant="outline" size="sm" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Shifts
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl shadow-sm gap-3">
          <Loader className="w-8 h-8 text-purple-600" />
          <span className="text-sm font-medium text-gray-500">Loading project breakdown...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-2xl gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <h3 className="font-semibold text-red-955">Failed to load projects</h3>
          <p className="text-sm text-red-700 max-w-md">
            {(error as any)?.response?.data?.message || "An unexpected error occurred while fetching project data."}
          </p>
        </div>
      )}

      {/* Projects Table */}
      {!isLoading && !error && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
            {responseData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
                <FileBarChart className="w-10 h-10 text-gray-300" />
                <h3 className="font-semibold text-gray-900">No Projects Found</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  No project hours were recorded on {formatDay(shiftDate)}.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="text-sm font-bold uppercase tracking-wider text-purple-700 bg-purple-50 sticky top-0 z-20">
                    <tr className="border-b border-purple-200 bg-purple-50">
                      <th rowSpan={2} className="px-4 py-3 text-left border-r border-purple-200 font-semibold w-10 sticky top-0 z-30 bg-purple-50">#</th>
                      <th rowSpan={2} className="px-6 py-3 text-left border-r border-purple-200 font-semibold w-64 min-w-[200px] sticky top-0 z-30 bg-purple-50">Project</th>
                      
                      {departmentNames.map((dept) => (
                        <th key={`header-dept-${dept}`} colSpan={3} className="px-3 py-2 text-center border-r border-b border-purple-200 font-bold sticky top-0 z-30 bg-purple-50">
                          {displayDeptName(dept)}
                        </th>
                      ))}
                      <th colSpan={3} className="px-3 py-2 text-center border-b border-purple-200 font-bold sticky top-0 z-30 bg-purple-50">
                        Total All Depts
                      </th>
                      <th rowSpan={2} className="px-4 py-3 text-center border-l border-purple-200 font-semibold w-24 sticky top-0 z-30 bg-purple-50">Action</th>
                    </tr>
                    <tr className="bg-purple-50 border-b border-purple-200">
                      {departmentNames.map((dept) => (
                        <React.Fragment key={`sub-${dept}`}>
                          <th className="px-2.5 py-2 text-center border-r border-t border-purple-200 font-semibold text-xs text-emerald-700 sticky top-[38px] z-20 bg-purple-50">Billable</th>
                          <th className="px-2.5 py-2 text-center border-r border-t border-purple-200 font-semibold text-xs text-amber-700 sticky top-[38px] z-20 bg-purple-50">Non-Billable</th>
                          <th className="px-2.5 py-2 text-center border-r border-t border-purple-200 font-bold text-xs text-purple-700 sticky top-[38px] z-20 bg-purple-50">Total</th>
                        </React.Fragment>
                      ))}
                      <th className="px-2.5 py-2 text-center border-r border-t border-purple-200 font-semibold text-xs text-emerald-700 sticky top-[38px] z-20 bg-purple-50">Billable</th>
                      <th className="px-2.5 py-2 text-center border-r border-t border-purple-200 font-semibold text-xs text-amber-700 sticky top-[38px] z-20 bg-purple-50">Non-Billable</th>
                      <th className="px-2.5 py-2 text-center border-t border-purple-200 font-bold text-xs text-purple-700 sticky top-[38px] z-20 bg-purple-50">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-sm text-gray-700">
                    {responseData.map((row, index) => {
                      const rowBillable = row.departments.reduce((sum, d) => sum + (d.billableHours || 0), 0);
                      const rowNonBillable = row.departments.reduce((sum, d) => sum + (d.nonBillableHours || 0), 0);
                      const rowTotal = row.totalHours;

                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-3 border-r border-b border-gray-300 font-medium text-gray-400 text-center">{index + 1}</td>
                          <td className="px-6 py-3 border-r border-b border-gray-300 font-semibold text-gray-955 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                              <div>
                                {row.project.code && <span className="text-xs text-gray-500 font-medium block">{row.project.code}</span>}
                                <span>{row.project.name}</span>
                              </div>
                            </div>
                          </td>

                          {/* Department Data Cells */}
                          {departmentNames.map((deptName) => {
                            const dept = row.departments.find(d => d.name === deptName);
                            const b = dept?.billableHours || 0;
                            const nb = dept?.nonBillableHours || 0;
                            const t = dept?.totalHours || 0;

                            return (
                              <React.Fragment key={`data-${deptName}`}>
                                <td className="px-3 py-2 border-r border-b border-gray-300 text-center font-normal text-emerald-600 bg-emerald-50/10">
                                  {b > 0 ? b.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                                </td>
                                <td className="px-3 py-2 border-r border-b border-gray-300 text-center font-normal text-amber-600 bg-amber-50/10">
                                  {nb > 0 ? nb.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                                </td>
                                <td className="px-3 py-2 border-r border-b border-gray-300 text-center font-semibold text-purple-700 bg-purple-50/30">
                                  {t > 0 ? t.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                                </td>
                              </React.Fragment>
                            );
                          })}

                          {/* Row Totals */}
                          <td className="px-3 py-2 border-r border-b border-gray-300 text-center font-bold bg-emerald-50 text-emerald-700 text-sm">
                            {rowBillable > 0 ? rowBillable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                          <td className="px-3 py-2 border-r border-b border-gray-300 text-center font-bold bg-amber-50 text-amber-700 text-sm">
                            {rowNonBillable > 0 ? rowNonBillable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                          <td className="px-3 py-2 border-b border-gray-300 text-center font-bold bg-purple-100 text-purple-800 text-sm">
                            {rowTotal > 0 ? rowTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                          
                          {/* Action Cell */}
                          <td className="px-4 py-3 border-l border-b border-gray-300 text-center">
                            <Link href={`/dashboard/reports/shifts/${shiftDate}/projects/${row.project._id}`}>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs hover:bg-purple-50 hover:text-purple-700 border-gray-200">
                                View Users
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  
                  {/* Footer Totals */}
                  {responseData.length > 0 && (
                    <tfoot className="bg-purple-50/70 font-bold border-t-2 border-b-2 border-purple-200 text-sm text-gray-900 sticky bottom-0 z-10">
                      <tr className="bg-purple-50">
                        <td colSpan={2} className="px-6 py-3 border-r border-gray-300 text-right whitespace-nowrap text-gray-900">
                          Total Hours
                        </td>

                        {departmentNames.map((deptName) => {
                          const b = colBillableTotals[deptName] || 0;
                          const nb = colNonBillableTotals[deptName] || 0;
                          const t = colTotalTotals[deptName] || 0;

                          return (
                            <React.Fragment key={`total-${deptName}`}>
                              <td className="px-3 py-3 border-r border-gray-300 text-center text-emerald-700 bg-emerald-50/20">
                                {b > 0 ? b.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                              </td>
                              <td className="px-3 py-3 border-r border-gray-300 text-center text-amber-700 bg-amber-50/20">
                                {nb > 0 ? nb.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                              </td>
                              <td className="px-3 py-3 border-r border-gray-300 text-center text-purple-800 bg-purple-100/50">
                                {t > 0 ? t.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        <td className="px-3 py-3 border-r border-gray-300 text-center bg-emerald-100 text-emerald-800 font-extrabold text-sm">
                          {overallBillableTotal > 0 ? overallBillableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                        </td>
                        <td className="px-3 py-3 border-r border-gray-300 text-center bg-amber-100 text-amber-800 font-extrabold text-sm">
                          {overallNonBillableTotal > 0 ? overallNonBillableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                        </td>
                        <td className="px-3 py-3 border-r border-gray-300 text-center bg-purple-200 text-purple-900 font-extrabold text-sm">
                          {overallTotalTotal > 0 ? overallTotalTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                        </td>
                        <td className="px-4 py-3 border-l border-gray-300"></td>
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
