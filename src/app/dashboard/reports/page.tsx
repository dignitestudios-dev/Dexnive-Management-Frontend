"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

const YEARS = Array.from({ length: 7 }, (_, i) => 2024 + i);

export default function ReportsPage() {
  const currentDate = new Date();
  const [month, setMonth] = useState<number | undefined>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number | undefined>(currentDate.getFullYear());
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  const { data: reportsData, isLoading, error } = useGetProjectHoursBreakdownQuery({
    month,
    year,
  });

  const responseData = reportsData?.data;
  const result = responseData?.result || [];
  const metrics = responseData?.metrics;

  const activeFilterCount = (month ? 1 : 0) + (year ? 1 : 0);

  // Extract department names dynamically from the first result item's hours mapping keys
  const departmentNames = result.length > 0 && result[0].hours
    ? Object.keys(result[0].hours).sort()
    : [];

  const displayDeptName = (name: string) => name === "Project Management" ? "PM" : name;

  const selectedMonthObj = month ? MONTH_NAMES.find(m => m.value === month) : null;
  const subtext = selectedMonthObj && year 
    ? `${selectedMonthObj.label} ${year}` 
    : year 
    ? `${year}` 
    : selectedMonthObj 
    ? `${selectedMonthObj.label}` 
    : "Overall";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Production Hours</h1>
          <p className="text-sm text-gray-500 mt-1">Project hours & amount breakdown by department</p>
        </div>

        {/* Right actions: Toggle + Filters */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* Toggle "Show Hours Breakdown" */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-1.5 shadow-sm">
            <span className="text-xs font-medium text-gray-700 select-none">Show Hours Breakdown</span>
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                showBreakdown ? "bg-purple-650" : "bg-gray-250"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  showBreakdown ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Filter Popup Trigger */}
          <Popover>
            <PopoverTrigger className={cn(
              "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input rounded-md px-4 py-2 h-9 gap-2 shadow-sm cursor-pointer",
              activeFilterCount > 0 
                ? "bg-purple-600 hover:bg-purple-700 text-white border-0" 
                : "bg-white hover:bg-accent hover:text-accent-foreground"
            )}>
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20 text-xs font-semibold">
                  {activeFilterCount}
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
                    value={month?.toString() || "none"}
                    onValueChange={(val) => setMonth(val === "none" ? undefined : Number(val))}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">All Months</SelectItem>
                      {MONTH_NAMES.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()} className="text-xs">
                          {m.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Year</label>
                  <Select
                    value={year?.toString() || "none"}
                    onValueChange={(val) => setYear(val === "none" ? undefined : Number(val))}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">All Years</SelectItem>
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
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-2 bg-gray-50 border border-gray-200 p-2.5 rounded-xl">
          <span className="font-medium text-gray-500 mr-1 text-xs">Active filters:</span>
          {month && (
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-medium"
            >
              Month: {MONTH_NAMES.find((m) => m.value === month)?.label}
              <button 
                onClick={() => setMonth(undefined)} 
                className="hover:text-purple-950 font-bold ml-1.5 focus:outline-none"
              >
                ×
              </button>
            </Badge>
          )}
          {year && (
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-medium"
            >
              Year: {year}
              <button 
                onClick={() => setYear(undefined)} 
                className="hover:text-purple-950 font-bold ml-1.5 focus:outline-none"
              >
                ×
              </button>
            </Badge>
          )}
          <button 
            onClick={() => {
              setMonth(undefined);
              setYear(undefined);
            }} 
            className="text-purple-600 hover:text-purple-800 font-semibold hover:underline text-xs ml-2 focus:outline-none"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl shadow-sm gap-3">
          <Loader className="w-8 h-8 text-purple-600" />
          <span className="text-sm font-medium text-gray-500">Generating report breakdown...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-2xl gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <h3 className="font-semibold text-red-900">Failed to load report</h3>
          <p className="text-sm text-red-700 max-w-md">
            {(error as any)?.response?.data?.message || "An unexpected error occurred while fetching report data."}
          </p>
        </div>
      )}

      {/* Reports Dashboard Metrics & Table */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                title="TOTAL HOURS"
                value={metrics?.totalHours != null ? metrics.totalHours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                subtext={subtext}
                icon={<Clock className="w-4 h-4 text-purple-600" />}
              />
              <KpiCard
                title="BILLABLE HOURS"
                value={metrics?.billableHours != null ? metrics.billableHours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                subtext={subtext}
                icon={<DollarSign className="w-4 h-4 text-purple-600" />}
              />
              <KpiCard
                title="NON-BILLABLE HOURS"
                value={metrics?.nonBillableHours != null ? metrics.nonBillableHours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                subtext={subtext}
                icon={<Briefcase className="w-4 h-4 text-purple-600" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <KpiCard
                title="WORKING DAYS"
                value={metrics?.totalWorkingDays ?? "0"}
                subtext={subtext}
                icon={<Calendar className="w-4 h-4 text-purple-600" />}
              />
              <KpiCard
                title="ACTIVE EMPLOYEES"
                value={metrics?.activeEmployeesCount ?? "0"}
                subtext={subtext}
                icon={<Users className="w-4 h-4 text-purple-600" />}
              />
            </div>
          </div>

          {/* Table Card container */}
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
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50/70">
                    <tr className="border-b border-purple-250">
                      <th rowSpan={2} className="px-4 py-3 text-left border-r border-purple-250 font-semibold w-10">#</th>
                      <th rowSpan={2} className="px-6 py-3 text-left border-r border-purple-250 font-semibold w-52 min-w-[180px]">Project</th>
                      <th rowSpan={2} className="px-4 py-3 text-center border-r border-purple-250 font-semibold w-24">Type</th>
                      <th rowSpan={2} className="px-6 py-3 text-left border-r border-purple-250 font-semibold w-40">Division</th>
                      <th colSpan={departmentNames.length + 1} className="px-4 py-2 text-center border-b border-r border-purple-250 font-bold bg-purple-100/30">Hours</th>
                      <th colSpan={departmentNames.length + 1} className="px-4 py-2 text-center border-b border-purple-250 font-bold bg-purple-100/30">Amounts</th>
                    </tr>
                    <tr className="bg-purple-50/30 border-b border-purple-250">
                      {/* Hours departments list */}
                      {departmentNames.map((dept) => (
                        <th key={`hours-${dept}`} className="px-3 py-2 text-center border-r border-purple-200 font-medium normal-case w-20 text-[10px] text-gray-500">
                          {displayDeptName(dept)}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center border-r border-purple-250 font-bold bg-purple-100/20 w-24">Total</th>

                      {/* Amounts departments list */}
                      {departmentNames.map((dept) => (
                        <th key={`amounts-${dept}`} className="px-3 py-2 text-center border-r border-purple-200 font-medium normal-case w-20 text-[10px] text-gray-500">
                          {displayDeptName(dept)}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center font-bold bg-purple-100/20 w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-xs text-gray-700">
                    {result.map((row, index) => {
                      const rowBillable = Object.values(row.hours || {}).reduce((acc, curr) => acc + (curr.billable || 0), 0);
                      const rowNonBillable = Object.values(row.hours || {}).reduce((acc, curr) => acc + (curr.nonBillable || 0), 0);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 border-r border-gray-300 border-b border-gray-300 font-medium text-gray-400 text-center">{index + 1}</td>
                          <td className="px-6 py-3 border-r border-gray-300 border-b border-gray-300 font-semibold text-gray-900 whitespace-nowrap">{row.name}</td>
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
                          
                          {/* Hours departments cells */}
                          {departmentNames.map((dept) => {
                            const deptData = row.hours?.[dept];
                            const totalVal = deptData?.total ?? 0;
                            const billableVal = deptData?.billable ?? 0;
                            const nonBillableVal = deptData?.nonBillable ?? 0;
                            
                            return (
                              <td key={`hours-cell-${dept}`} className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-medium">
                                <div className="flex flex-col items-center justify-center">
                                  <span className="text-gray-900 font-semibold">
                                    {totalVal > 0 ? totalVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                                  </span>
                                  {showBreakdown && (billableVal > 0 || nonBillableVal > 0) && (
                                    <span className="text-[10px] text-gray-500 font-normal mt-0.5 whitespace-nowrap block">
                                      B: {billableVal} • NB: {nonBillableVal}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-bold bg-purple-50/10 text-gray-900">
                            <div className="flex flex-col items-center justify-center">
                              <span>
                                {row.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                              {showBreakdown && (rowBillable > 0 || rowNonBillable > 0) && (
                                <span className="text-[10px] text-purple-700 font-semibold mt-0.5 whitespace-nowrap block">
                                  B: {rowBillable} • NB: {rowNonBillable}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Amounts departments cells */}
                          {departmentNames.map((dept) => {
                            const value = row.amounts?.[dept]?.total ?? 0;
                            return (
                              <td key={`amounts-cell-${dept}`} className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-medium">
                                {value > 0 ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 border-b border-gray-300 text-center font-bold bg-purple-50/10 text-gray-900">
                            {row.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtext,
  icon,
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-4 border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all duration-200 flex items-center justify-between rounded-xl">
      <div className="space-y-1">
        <span className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase select-none">{title}</span>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">{value}</h3>
        <p className="text-[10px] text-gray-400 select-none">{subtext}</p>
      </div>
      <div className="w-9 h-9 rounded-full bg-purple-50/70 border border-purple-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </Card>
  );
}
