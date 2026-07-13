"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/utils/cn";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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

export default function ReportsPage() {
  const currentDate = new Date();
  const currentMonthValue = currentDate.getMonth() + 1;
  const currentYearValue = currentDate.getFullYear();

  // Populate years dynamically from 2024 (inception of logs) to the current year
  const YEARS = Array.from({ length: currentYearValue - 2024 + 1 }, (_, i) => 2024 + i);

  const router = useRouter();
  const pathname = usePathname();
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

  // Extract department names dynamically from the first result item's hours mapping keys
  const departmentNames = result.length > 0 && result[0].hours
    ? Object.keys(result[0].hours).sort()
    : [];

  const displayDeptName = (name: string) => name === "Project Management" ? "PM" : name;

  // Sum calculations for column totals
  const colHoursTotals = departmentNames.reduce((acc, dept) => {
    acc[dept] = result.reduce((sum, row) => sum + (row.hours?.[dept]?.total || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const overallHoursTotal = result.reduce((sum, row) => sum + (row.total || 0), 0);

  const colAmountsTotals = departmentNames.reduce((acc, dept) => {
    acc[dept] = result.reduce((sum, row) => sum + (row.amounts?.[dept]?.total || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const overallAmountsTotal = result.reduce((sum, row) => sum + (row.totalAmount || 0), 0);

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
    // If selecting current year and current month is in the future, automatically reset month to current month
    if (selectedYear === currentYearValue && month > currentMonthValue) {
      setMonth(currentMonthValue);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Production Hours</h1>
          <p className="text-sm text-gray-500 mt-1">Project hours & amount breakdown by department</p>
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
          <span className="text-sm font-medium text-gray-500">Generating report breakdown...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-2xl gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <h3 className="font-semibold text-red-950">Failed to load report</h3>
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
                  <thead className="text-sm font-bold uppercase tracking-wider text-purple-700 bg-purple-50 sticky top-0 z-20">
                    <tr className="border-b border-purple-200 bg-purple-50">
                      <th rowSpan={2} className="px-4 py-3 text-left border-r border-purple-200 font-semibold w-10 bg-purple-50 sticky top-0 z-30">#</th>
                      <th rowSpan={2} className="px-6 py-3 text-left border-r border-purple-200 font-semibold w-52 min-w-[180px] bg-purple-50 sticky top-0 z-30">Project</th>
                      <th rowSpan={2} className="px-4 py-3 text-center border-r border-purple-200 font-semibold w-24 bg-purple-50 sticky top-0 z-30">Type</th>
                      <th rowSpan={2} className="px-6 py-3 text-left border-r border-purple-200 font-semibold w-40 bg-purple-50 sticky top-0 z-30">Division</th>
                      <th colSpan={departmentNames.length + 1} className="px-4 py-2 text-center border-b border-r border-purple-200 font-bold bg-purple-50 sticky top-0">Hours</th>
                      <th colSpan={departmentNames.length + 1} className="px-4 py-2 text-center border-b border-purple-200 font-bold bg-purple-50 sticky top-0">Amounts</th>
                    </tr>
                    <tr className="bg-purple-50 border-b border-purple-200">
                      {/* Hours departments list */}
                      {departmentNames.map((dept) => (
                        <th key={`hours-${dept}`} className="px-3 py-2 text-center border-r border-purple-200 font-medium normal-case w-20 text-xs text-gray-500 bg-purple-50 sticky top-[38px] z-20">
                          {displayDeptName(dept)}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center border-r border-purple-200 font-bold bg-purple-50 w-24 sticky top-[38px] z-20">Total</th>

                      {/* Amounts departments list */}
                      {departmentNames.map((dept) => (
                        <th key={`amounts-${dept}`} className="px-3 py-2 text-center border-r border-purple-200 font-medium normal-case w-20 text-xs text-gray-500 bg-purple-50 sticky top-[38px] z-20">
                          {displayDeptName(dept)}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center font-bold bg-purple-50 w-24 sticky top-[38px] z-20">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-sm text-gray-700">
                    {result.map((row, index) => {
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
                          
                          {/* Hours departments cells - NORMAL font weight */}
                          {departmentNames.map((dept) => {
                            const deptData = row.hours?.[dept];
                            const totalVal = deptData?.total ?? 0;
                            
                            return (
                              <td key={`hours-cell-${dept}`} className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-normal text-gray-700">
                                <div className="flex flex-col items-center justify-center py-1">
                                  <span className="text-gray-900 font-normal text-sm">
                                    {totalVal > 0 ? totalVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                          {/* Hours Total cell - BOLD font weight */}
                          <td className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-bold bg-[#efeaf7]/30 text-gray-955">
                            <div className="flex flex-col items-center justify-center py-1">
                              <span className="text-gray-955 font-bold text-sm">
                                {row.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </td>

                          {/* Amounts departments cells - NORMAL font weight */}
                          {departmentNames.map((dept) => {
                            const value = row.amounts?.[dept]?.total ?? 0;
                            return (
                              <td key={`amounts-cell-${dept}`} className="px-3 py-2 border-r border-gray-300 border-b border-gray-300 text-center font-normal text-gray-700">
                                {value > 0 ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                              </td>
                            );
                          })}
                          {/* Amounts Total cell - BOLD font weight */}
                          <td className="px-3 py-2 border-b border-gray-300 text-center font-bold bg-[#efeaf7]/30 text-gray-955">
                            {row.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-purple-50/70 font-bold border-t-2 border-b-2 border-purple-200 text-sm text-gray-900 sticky bottom-0 z-10">
                    <tr className="bg-purple-50">
                      <td className="px-4 py-3 border-r border-gray-300 text-center"></td>
                      <td className="px-6 py-3 border-r border-gray-300 text-left whitespace-nowrap text-gray-900">Total</td>
                      <td className="px-4 py-3 border-r border-gray-300"></td>
                      <td className="px-6 py-3 border-r border-gray-300"></td>

                      {/* Hours departments totals */}
                      {departmentNames.map((dept) => {
                        const total = colHoursTotals[dept] || 0;
                        return (
                          <td key={`total-hours-${dept}`} className="px-3 py-3 border-r border-gray-300 text-center text-gray-900">
                            {total > 0 ? total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 border-r border-gray-300 text-center bg-[#efeaf7]/50 text-purple-950 font-extrabold text-sm">
                        {overallHoursTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>

                      {/* Amounts departments totals */}
                      {departmentNames.map((dept) => {
                        const total = colAmountsTotals[dept] || 0;
                        return (
                          <td key={`total-amounts-${dept}`} className="px-3 py-3 border-r border-gray-300 text-center text-gray-900">
                            {total > 0 ? total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center bg-[#efeaf7]/50 text-purple-950 font-extrabold text-sm">
                        {overallAmountsTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
        <h3 className="text-xl font-extrabold text-gray-950 tracking-tight">{value}</h3>
        <p className="text-[10px] text-gray-400 font-medium select-none mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}
