"use client";

import React, { useState } from "react";
import { startOfMonthKey, todayKey, dayKey, formatDay } from "@/lib/datetime";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import {
  Filter,
  AlertCircle,
  FileBarChart,
  CalendarDays,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useGetShiftsQuery } from "@/features/reports/api/reports.queries";

export default function ShiftsReportPage() {
  const defaultStartDate = startOfMonthKey(todayKey());
  const defaultEndDate = todayKey();

  const [appliedStartDate, setAppliedStartDate] = useState<string>(defaultStartDate);
  const [appliedEndDate, setAppliedEndDate] = useState<string>(defaultEndDate);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);

  const { data: shiftsData, isLoading, error } = useGetShiftsQuery({
    startDate: appliedStartDate,
    endDate: appliedEndDate,
    page,
    limit,
  });

  const responseData = shiftsData?.data || [];
  const pagination = shiftsData?.pagination;

  const isCurrentDefault = appliedStartDate === defaultStartDate && appliedEndDate === defaultEndDate;

  const handleResetDates = () => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setAppliedStartDate(defaultStartDate);
    setAppliedEndDate(defaultEndDate);
    setPage(1);
  };

  const handleApplyFilter = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setIsPopoverOpen(false);
    setPage(1);
  };

  // Extract unique department names from all shifts
  const departmentNamesSet = new Set<string>();
  responseData.forEach((shift) => {
    shift.departments.forEach((dept) => {
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

  const overallTotalTotal = responseData.reduce((sum, row) => {
    return sum + row.departments.reduce((deptSum, dept) => deptSum + (dept.totalHours || 0), 0);
  }, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Shifts Breakdown</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed hours breakdown by day</p>
        </div>

        {/* Right actions: Filters */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Filter Popup Trigger */}
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger className={cn(
              "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input rounded-md px-4 py-2 h-9 gap-2 shadow-sm cursor-pointer",
              !isCurrentDefault
                ? "bg-purple-600 hover:bg-purple-700 text-white border-0" 
                : "bg-white hover:bg-accent hover:text-accent-foreground"
            )}>
              <Filter className="w-4 h-4" />
              Filters
              {!isCurrentDefault && (
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20 text-xs font-semibold">
                  2
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-4" align="end">
              <PopoverHeader className="px-0 pt-0 pb-2 border-b border-gray-100">
                <PopoverTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-purple-600" />
                  Filter Date Range
                </PopoverTitle>
              </PopoverHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 block">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-9 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 block">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-9 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStartDate(appliedStartDate);
                    setEndDate(appliedEndDate);
                    setIsPopoverOpen(false);
                  }}
                  className="h-8 text-xs px-3"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyFilter}
                  className="h-8 text-xs px-3.5 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                >
                  Apply Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filter Badges */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-2 bg-gray-50 border border-gray-200 p-2.5 rounded-xl">
        <span className="font-medium text-gray-500 mr-1 text-xs select-none">Selected Range:</span>
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-medium"
        >
          From: {appliedStartDate}
        </Badge>
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-medium"
        >
          To: {appliedEndDate}
        </Badge>
        {!isCurrentDefault && (
          <button 
            onClick={handleResetDates} 
            className="text-purple-600 hover:text-purple-800 font-semibold hover:underline text-xs ml-2 focus:outline-none"
          >
            Reset to default (This Month)
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl shadow-sm gap-3">
          <Loader className="w-8 h-8 text-purple-600" />
          <span className="text-sm font-medium text-gray-500">Generating report...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-2xl gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <h3 className="font-semibold text-red-955">Failed to load report</h3>
          <p className="text-sm text-red-700 max-w-md">
            {(error as any)?.response?.data?.message || "An unexpected error occurred while fetching report data."}
          </p>
        </div>
      )}

      {/* Reports Table */}
      {!isLoading && !error && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
            {responseData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
                <FileBarChart className="w-10 h-10 text-gray-300" />
                <h3 className="font-semibold text-gray-900">No Data Available</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  There are no submitted shifts matching the selected date filters.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="text-sm font-bold uppercase tracking-wider text-purple-700 bg-purple-50 sticky top-0 z-20">
                    <tr className="border-b border-purple-200 bg-purple-50">
                      <th rowSpan={2} className="px-4 py-3 text-left border-r border-purple-200 font-semibold w-10 sticky top-0 z-30 bg-purple-50">#</th>
                      <th rowSpan={2} className="px-6 py-3 text-left border-r border-purple-200 font-semibold w-40 min-w-[140px] sticky top-0 z-30 bg-purple-50">Date</th>
                      <th rowSpan={2} className="px-6 py-3 text-center border-r border-purple-200 font-semibold w-32 sticky top-0 z-30 bg-purple-50">Projects</th>
                      
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
                      const rowTotal = row.departments.reduce((sum, d) => sum + (d.totalHours || 0), 0);
                      
                      const actualIndex = (page - 1) * limit + index + 1;

                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-3 border-r border-b border-gray-300 font-medium text-gray-400 text-center">{actualIndex}</td>
                          <td className="px-6 py-3 border-r border-b border-gray-300 font-semibold text-gray-955 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                              {formatDay(row.shiftDate)}
                            </div>
                          </td>
                          <td className="px-6 py-3 border-r border-b border-gray-300 text-center text-gray-600 whitespace-nowrap">
                            {row.projectCount} Projects
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
                            <Link href={`/dashboard/reports/shifts/${dayKey(row.shiftDate)}`}>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs hover:bg-purple-50 hover:text-purple-700 border-gray-200">
                                View Projects
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
                        <td colSpan={3} className="px-6 py-3 border-r border-gray-300 text-right whitespace-nowrap text-gray-900">
                          Total Hours for Current Page
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

          {/* Pagination Controls */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <div>
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} shifts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <span className="px-2 font-medium">Page {page} of {pagination.pages}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
