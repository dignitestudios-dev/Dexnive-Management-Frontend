"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/utils/cn";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import {
  Clock,
  DollarSign,
  Briefcase,
  Calendar,
  Users,
  Filter,
  AlertCircle,
  FileBarChart,
} from "lucide-react";
import { useGetProjectHoursBreakdownQuery } from "@/features/reports/api/reports.queries";

const MONTH_NAMES = [
  { value: 1, label: "Jan", fullName: "January" },
  { value: 2, label: "Feb", fullName: "February" },
  { value: 3, label: "Mar", fullName: "March" },
  { value: 4, label: "Apr", fullName: "April" },
  { value: 5, label: "May", fullName: "May" },
  { value: 6, label: "Jun", fullName: "June" },
  { value: 7, label: "Jul", fullName: "July" },
  { value: 8, label: "Aug", fullName: "August" },
  { value: 9, label: "Sep", fullName: "September" },
  { value: 10, label: "Oct", fullName: "October" },
  { value: 11, label: "Nov", fullName: "November" },
  { value: 12, label: "Dec", fullName: "December" },
];

export default function HoursBreakdownPage() {
  const currentDate = new Date();
  const currentMonthValue = currentDate.getMonth() + 1;
  const currentYearValue = currentDate.getFullYear();

  // Populate years dynamically from 2024 to current year
  const YEARS = Array.from({ length: currentYearValue - 2024 + 1 }, (_, i) => 2024 + i);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [month, setMonth] = useState<number>(currentMonthValue);
  const [year, setYear] = useState<number>(currentYearValue);

  const { data: reportsData, isLoading, error } = useGetProjectHoursBreakdownQuery({
    month,
    year,
  });

  const responseData = reportsData?.data;
  const result = responseData?.result || [];
  const metrics = responseData?.metrics;

  // Extract department names dynamically
  const departmentNames = result.length > 0 && result[0].hours
    ? Object.keys(result[0].hours).sort()
    : [];

  const displayDeptName = (name: string) => name === "Project Management" ? "PM" : name;

  const selectedMonthObj = MONTH_NAMES.find(m => m.value === month);
  const subtext = selectedMonthObj ? `${selectedMonthObj.label} ${year}` : `${year}`;

  const isCurrentDefault = month === currentMonthValue && year === currentYearValue;

  const handleClearMonth = () => {
    setMonth(currentMonthValue);
  };

  const handleClearYear = () => {
    setYear(currentYearValue);
  };

  const handleClearAll = () => {
    setMonth(currentMonthValue);
    setYear(currentYearValue);
  };

  const handleYearChange = (selectedYear: number) => {
    setYear(selectedYear);
    if (selectedYear === currentYearValue && month > currentMonthValue) {
      setMonth(currentMonthValue);
    }
  };

  // Sum calculations for Hours column totals
  const colHoursBillableTotals = departmentNames.reduce((acc, dept) => {
    acc[dept] = result.reduce((sum, row) => sum + (row.hours?.[dept]?.billable || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const colHoursNonBillableTotals = departmentNames.reduce((acc, dept) => {
    acc[dept] = result.reduce((sum, row) => sum + (row.hours?.[dept]?.nonBillable || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const overallHoursBillableTotal = result.reduce((sum, row) => {
    const rowBillable = Object.values(row.hours || {}).reduce((acc: number, curr: any) => acc + (curr.billable || 0), 0);
    return sum + rowBillable;
  }, 0);

  const overallHoursNonBillableTotal = result.reduce((sum, row) => {
    const rowNonBillable = Object.values(row.hours || {}).reduce((acc: number, curr: any) => acc + (curr.nonBillable || 0), 0);
    return sum + rowNonBillable;
  }, 0);

  // Sum calculations for Amounts column totals
  const colAmountsBillableTotals = departmentNames.reduce((acc, dept) => {
    acc[dept] = result.reduce((sum, row) => sum + (row.amounts?.[dept]?.billable || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const colAmountsNonBillableTotals = departmentNames.reduce((acc, dept) => {
    acc[dept] = result.reduce((sum, row) => sum + (row.amounts?.[dept]?.nonBillable || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const overallAmountsBillableTotal = result.reduce((sum, row) => {
    const rowBillable = Object.values(row.amounts || {}).reduce((acc: number, curr: any) => acc + (curr.billable || 0), 0);
    return sum + rowBillable;
  }, 0);

  const overallAmountsNonBillableTotal = result.reduce((sum, row) => {
    const rowNonBillable = Object.values(row.amounts || {}).reduce((acc: number, curr: any) => acc + (curr.nonBillable || 0), 0);
    return sum + rowNonBillable;
  }, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hours Breakdown</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed billable & non-billable hours and amounts breakdown by department</p>
        </div>

        {/* Right actions: Filters */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* Filter Popup Trigger */}
          <Popover>
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
                  Filter Report Range
                </PopoverTitle>
              </PopoverHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Month</label>
                  <Select
                    value={month.toString()}
                    onValueChange={(val) => setMonth(Number(val))}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <span className="flex-1 text-left truncate">
                        {MONTH_NAMES.find((m) => m.value === month)?.fullName || "Select Month"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.map((m) => {
                        const isFutureMonth = year === currentYearValue && m.value > currentMonthValue;
                        return (
                          <SelectItem 
                            key={m.value} 
                            value={m.value.toString()} 
                            className="text-xs"
                            disabled={isFutureMonth}
                          >
                            {m.fullName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Year</label>
                  <Select
                    value={year.toString()}
                    onValueChange={(val) => handleYearChange(Number(val))}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <span className="flex-1 text-left truncate">
                        {year || "Select Year"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y.toString()} className="text-xs">
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filter Badges */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-2 bg-gray-50 border border-gray-200 p-2.5 rounded-xl">
        <span className="font-medium text-gray-500 mr-1 text-xs select-none">Selected Filters:</span>
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-medium"
        >
          Month: {MONTH_NAMES.find((m) => m.value === month)?.label}
          {month !== currentMonthValue && (
            <button 
              onClick={handleClearMonth} 
              className="hover:text-purple-950 font-bold ml-1.5 focus:outline-none"
            >
              ×
            </button>
          )}
        </Badge>
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-medium"
        >
          Year: {year}
          {year !== currentYearValue && (
            <button 
              onClick={handleClearYear} 
              className="hover:text-purple-950 font-bold ml-1.5 focus:outline-none"
            >
              ×
            </button>
          )}
        </Badge>
        {!isCurrentDefault && (
          <button 
            onClick={handleClearAll} 
            className="text-purple-600 hover:text-purple-800 font-semibold hover:underline text-xs ml-2 focus:outline-none"
          >
            Reset to default
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl shadow-sm gap-3">
          <Loader className="w-8 h-8 text-purple-600" />
          <span className="text-sm font-medium text-gray-500">Generating breakdown...</span>
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

      {/* Reports Dashboard Metrics & Table */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {/* Sleek Metrics Ribbon with Color-Coded Accent Icons */}
          <div className="bg-white border border-gray-300 rounded-2xl shadow-sm overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-200 grid grid-cols-2 md:grid-cols-5">
            <RibbonMetric
              title="TOTAL HOURS"
              value={metrics?.totalHours != null ? metrics.totalHours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
              subtext={subtext}
              icon={<Clock className="w-3.5 h-3.5" />}
              colorTheme="purple"
            />
            <RibbonMetric
              title="BILLABLE HOURS"
              value={metrics?.billableHours != null ? metrics.billableHours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
              subtext={subtext}
              icon={<DollarSign className="w-3.5 h-3.5" />}
              colorTheme="emerald"
            />
            <RibbonMetric
              title="NON-BILLABLE HOURS"
              value={metrics?.nonBillableHours != null ? metrics.nonBillableHours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
              subtext={subtext}
              icon={<Briefcase className="w-3.5 h-3.5" />}
              colorTheme="amber"
            />
            <RibbonMetric
              title="WORKING DAYS"
              value={metrics?.totalWorkingDays ?? "0"}
              subtext={subtext}
              icon={<Calendar className="w-3.5 h-3.5" />}
              colorTheme="blue"
            />
            <RibbonMetric
              title="ACTIVE EMPLOYEES"
              value={metrics?.activeEmployeesCount ?? "0"}
              subtext={subtext}
              icon={<Users className="w-3.5 h-3.5" />}
              colorTheme="indigo"
            />
          </div>

          {/* Table Card container with max-height and scrolling */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
            {result.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
                <FileBarChart className="w-10 h-10 text-gray-300" />
                <h3 className="font-semibold text-gray-900">No Data Available</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  There are no submitted work logs matching the selected month and year filters.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 sticky top-0 z-20">
                    {/* Row 1: High Level categories */}
                    <tr className="border-b border-purple-200 bg-purple-50">
                      <th rowSpan={3} className="px-4 py-3 text-left border-r border-purple-200 font-semibold w-10 bg-purple-50 sticky top-0 z-30">#</th>
                      <th rowSpan={3} className="px-6 py-3 text-left border-r border-purple-200 font-semibold w-52 min-w-[180px] bg-purple-50 sticky top-0 z-30">Project</th>
                      <th rowSpan={3} className="px-4 py-3 text-center border-r border-purple-200 font-semibold w-24 bg-purple-50 sticky top-0 z-30">Type</th>
                      <th rowSpan={3} className="px-6 py-3 text-left border-r border-purple-200 font-semibold w-40 bg-purple-50 sticky top-0 z-30">Division</th>
                      <th colSpan={(departmentNames.length * 2) + 2} className="px-4 py-2 text-center border-b border-r border-purple-200 font-bold bg-purple-50 sticky top-0 z-30">Hours</th>
                      <th colSpan={(departmentNames.length * 2) + 2} className="px-4 py-2 text-center border-b border-purple-200 font-bold bg-purple-50 sticky top-0 z-30">Amounts</th>
                    </tr>
                    {/* Row 2: Department Names */}
                    <tr className="bg-purple-50 border-b border-purple-200">
                      {/* Hours departments list */}
                      {departmentNames.map((dept) => (
                        <th key={`hours-dept-${dept}`} colSpan={2} className="px-3 py-2 text-center border-r border-b border-purple-200 font-bold bg-purple-50 sticky top-[38px] z-25">
                          {displayDeptName(dept)}
                        </th>
                      ))}
                      <th colSpan={2} className="px-3 py-2 text-center border-r border-b border-purple-200 font-bold bg-purple-50 sticky top-[38px] z-25">Total</th>

                      {/* Amounts departments list */}
                      {departmentNames.map((dept) => (
                        <th key={`amounts-dept-${dept}`} colSpan={2} className="px-3 py-2 text-center border-r border-b border-purple-200 font-bold bg-purple-50 sticky top-[38px] z-25">
                          {displayDeptName(dept)}
                        </th>
                      ))}
                      <th colSpan={2} className="px-3 py-2 text-center border-b border-purple-200 font-bold bg-purple-50 sticky top-[38px] z-25">Total</th>
                    </tr>
                    {/* Row 3: Sub headers (Billable & Non-Billable) */}
                    <tr className="bg-purple-50 border-b border-purple-200">
                      {/* Hours Columns */}
                      {departmentNames.map((dept) => (
                        <React.Fragment key={`hours-sub-${dept}`}>
                          <th className="px-2.5 py-2 text-center border-r border-t border-b border-purple-200 font-semibold whitespace-nowrap text-[10px] text-emerald-700 bg-purple-50 sticky top-[76px] z-20">
                            Billable
                          </th>
                          <th className="px-2.5 py-2 text-center border-r border-t border-b border-purple-200 font-semibold whitespace-nowrap text-[10px] text-amber-700 bg-purple-50 sticky top-[76px] z-20">
                            Non-Billable
                          </th>
                        </React.Fragment>
                      ))}
                      <th className="px-2.5 py-2 text-center border-r border-t border-b border-purple-200 font-bold whitespace-nowrap text-[10px] text-emerald-700 bg-purple-50 sticky top-[76px] z-20">
                        Billable
                      </th>
                      <th className="px-2.5 py-2 text-center border-r border-t border-b border-purple-200 font-bold whitespace-nowrap text-[10px] text-amber-700 bg-purple-50 sticky top-[76px] z-20">
                        Non-Billable
                      </th>

                      {/* Amounts Columns */}
                      {departmentNames.map((dept) => (
                        <React.Fragment key={`amounts-sub-${dept}`}>
                          <th className="px-2.5 py-2 text-center border-r border-t border-b border-purple-200 font-semibold whitespace-nowrap text-[10px] text-emerald-700 bg-purple-50 sticky top-[76px] z-20">
                            Billable
                          </th>
                          <th className="px-2.5 py-2 text-center border-r border-t border-b border-purple-200 font-semibold whitespace-nowrap text-[10px] text-amber-700 bg-purple-50 sticky top-[76px] z-20">
                            Non-Billable
                          </th>
                        </React.Fragment>
                      ))}
                      <th className="px-2.5 py-2 text-center border-r border-t border-b border-purple-200 font-bold whitespace-nowrap text-[10px] text-emerald-700 bg-purple-50 sticky top-[76px] z-20">
                        Billable
                      </th>
                      <th className="px-2.5 py-2 text-center border-t border-b border-purple-200 font-bold whitespace-nowrap text-[10px] text-amber-700 bg-purple-50 sticky top-[76px] z-20">
                        Non-Billable
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-xs text-gray-700">
                    {result.map((row, index) => {
                      const rowHoursBillable = Object.values(row.hours || {}).reduce((acc: number, curr: any) => acc + (curr.billable || 0), 0);
                      const rowHoursNonBillable = Object.values(row.hours || {}).reduce((acc: number, curr: any) => acc + (curr.nonBillable || 0), 0);

                      const rowAmountsBillable = Object.values(row.amounts || {}).reduce((acc: number, curr: any) => acc + (curr.billable || 0), 0);
                      const rowAmountsNonBillable = Object.values(row.amounts || {}).reduce((acc: number, curr: any) => acc + (curr.nonBillable || 0), 0);

                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 border-r border-gray-300 border-b border-gray-300 font-medium text-gray-400 text-center">{index + 1}</td>
                          <td className="px-6 py-3 border-r border-gray-300 border-b border-gray-300 font-semibold text-gray-955 whitespace-nowrap">{row.name}</td>
                          <td className="px-4 py-3 border-r border-gray-300 border-b border-gray-300 text-center">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                                row.type.toLowerCase() === "external" 
                                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              )}
                            >
                              {row.type}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 border-r border-gray-300 border-b border-gray-300 text-gray-600 whitespace-nowrap">{row.division}</td>
                          
                          {/* Department Hours cells */}
                          {departmentNames.map((dept) => {
                            const deptData = row.hours?.[dept];
                            const billableVal = deptData?.billable ?? 0;
                            const nonBillableVal = deptData?.nonBillable ?? 0;

                            return (
                              <React.Fragment key={`hours-cells-${dept}`}>
                                <td className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-normal text-emerald-600 bg-emerald-50/10">
                                  {billableVal > 0 ? billableVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                                </td>
                                <td className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-normal text-amber-600 bg-amber-50/10">
                                  {nonBillableVal > 0 ? nonBillableVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                                </td>
                              </React.Fragment>
                            );
                          })}
                          
                          {/* Hours Total cells */}
                          <td className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-bold bg-emerald-50 text-emerald-700 text-sm">
                            {rowHoursBillable > 0 ? rowHoursBillable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                          <td className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-bold bg-amber-50 text-amber-700 text-sm">
                            {rowHoursNonBillable > 0 ? rowHoursNonBillable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>

                          {/* Amounts departments cells */}
                          {departmentNames.map((dept) => {
                            const deptData = row.amounts?.[dept];
                            const billableVal = deptData?.billable ?? 0;
                            const nonBillableVal = deptData?.nonBillable ?? 0;

                            return (
                              <React.Fragment key={`amounts-cells-${dept}`}>
                                <td className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-normal text-emerald-600 bg-emerald-50/10">
                                  {billableVal > 0 ? billableVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                                </td>
                                <td className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-normal text-amber-600 bg-amber-50/10">
                                  {nonBillableVal > 0 ? nonBillableVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                                </td>
                              </React.Fragment>
                            );
                          })}
                          {/* Amounts Total cells */}
                          <td className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-bold bg-emerald-50 text-emerald-700 text-sm">
                            {rowAmountsBillable > 0 ? rowAmountsBillable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                          <td className="px-3 py-2 border-b border-gray-300 text-center font-bold bg-amber-50 text-amber-700 text-sm">
                            {rowAmountsNonBillable > 0 ? rowAmountsNonBillable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-purple-50/70 font-bold border-t-2 border-b-2 border-purple-250 text-xs text-gray-900 sticky bottom-0 z-10">
                    <tr className="bg-purple-50">
                      <td className="px-4 py-3 border-r border-gray-300 text-center"></td>
                      <td className="px-6 py-3 border-r border-gray-300 text-left whitespace-nowrap text-gray-900">Total</td>
                      <td className="px-4 py-3 border-r border-gray-300"></td>
                      <td className="px-6 py-3 border-r border-gray-300"></td>

                      {/* Hours sub-column totals */}
                      {departmentNames.map((dept) => {
                        const billableTotal = colHoursBillableTotals[dept] || 0;
                        const nonBillableTotal = colHoursNonBillableTotals[dept] || 0;
                        return (
                          <React.Fragment key={`total-hours-${dept}`}>
                            <td className="px-3 py-3 border-r border-gray-300 text-center text-emerald-700 bg-emerald-50/20">
                              {billableTotal > 0 ? billableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                            </td>
                            <td className="px-3 py-3 border-r border-gray-300 text-center text-amber-700 bg-amber-50/20">
                              {nonBillableTotal > 0 ? nonBillableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="px-3 py-3 border-r border-gray-300 text-center bg-emerald-100 text-emerald-800 font-extrabold text-sm">
                        {overallHoursBillableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3 border-r border-gray-300 text-center bg-amber-100 text-amber-800 font-extrabold text-sm">
                        {overallHoursNonBillableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>

                      {/* Amounts sub-column totals */}
                      {departmentNames.map((dept) => {
                        const billableTotal = colAmountsBillableTotals[dept] || 0;
                        const nonBillableTotal = colAmountsNonBillableTotals[dept] || 0;
                        return (
                          <React.Fragment key={`total-amounts-${dept}`}>
                            <td className="px-3 py-3 border-r border-gray-300 text-center text-emerald-700 bg-emerald-50/20">
                              {billableTotal > 0 ? billableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                            </td>
                            <td className="px-3 py-3 border-r border-gray-300 text-center text-amber-700 bg-amber-50/20">
                              {nonBillableTotal > 0 ? nonBillableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="px-3 py-3 border-r border-gray-300 text-center bg-emerald-100 text-emerald-800 font-extrabold text-sm">
                        {overallAmountsBillableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3 text-center bg-amber-100 text-amber-800 font-extrabold text-sm">
                        {overallAmountsNonBillableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RibbonMetricProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  colorTheme: "purple" | "emerald" | "amber" | "blue" | "indigo";
}

function RibbonMetric({
  title,
  value,
  subtext,
  icon,
  colorTheme,
}: RibbonMetricProps) {
  const themeClasses = {
    purple: "bg-purple-50 text-purple-600 border-purple-100/70",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100/70",
    amber: "bg-amber-50 text-amber-600 border-amber-100/70",
    blue: "bg-blue-50 text-blue-600 border-blue-100/70",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100/70",
  };

  const currentThemeClass = themeClasses[colorTheme];

  return (
    <div className="p-5 flex flex-col justify-between min-h-[96px] space-y-2 hover:bg-gray-50/30 transition-colors duration-200">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 select-none uppercase tracking-wider">
        <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center shrink-0", currentThemeClass)}>
          {icon}
        </div>
        <span>{title}</span>
      </div>
      <div>
        <h3 className="text-xl font-extrabold text-gray-955 tracking-tight">{value}</h3>
        <p className="text-[10px] text-gray-400 font-medium select-none mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}
