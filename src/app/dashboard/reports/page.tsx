"use client";

import { useState } from "react";
import { appNow } from "@/lib/datetime";
import { format, startOfMonth } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  UserX,
  Filter,
  AlertCircle,
  FileBarChart,
  Download,
} from "lucide-react";
import { useGetProjectHoursBreakdownQuery } from "@/features/reports/api/reports.queries";
import XLSX from "xlsx-js-style";

export default function ReportsPage() {
  const defaultStartDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const defaultEndDate = format(new Date(), "yyyy-MM-dd");

  const [appliedStartDate, setAppliedStartDate] = useState<string>(defaultStartDate);
  const [appliedEndDate, setAppliedEndDate] = useState<string>(defaultEndDate);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const { data: reportsData, isLoading, error } = useGetProjectHoursBreakdownQuery({
    startDate: appliedStartDate,
    endDate: appliedEndDate,
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

  const overallHoursBillableTotal = result.reduce((sum, row) => {
    const rowBillable = Object.values(row.hours || {}).reduce((acc: number, curr: any) => acc + (curr.billable || 0), 0);
    return sum + rowBillable;
  }, 0);

  const overallHoursNonBillableTotal = result.reduce((sum, row) => {
    const rowNonBillable = Object.values(row.hours || {}).reduce((acc: number, curr: any) => acc + (curr.nonBillable || 0), 0);
    return sum + rowNonBillable;
  }, 0);

  const colAmountsTotals = departmentNames.reduce((acc, dept) => {
    acc[dept] = result.reduce((sum, row) => sum + (row.amounts?.[dept]?.total || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const overallAmountsTotal = result.reduce((sum, row) => sum + (row.totalAmount || 0), 0);

  const subtext = `${appliedStartDate} to ${appliedEndDate}`;
  const isCurrentDefault = appliedStartDate === defaultStartDate && appliedEndDate === defaultEndDate;

  const handleResetDates = () => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setAppliedStartDate(defaultStartDate);
    setAppliedEndDate(defaultEndDate);
  };

  const handleApplyFilter = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setIsPopoverOpen(false);
  };

  const handleExportExcel = () => {
    if (result.length === 0) return;

    const wb = XLSX.utils.book_new();

    const headerRow1 = [
      "#", "Project", "Type", "Division",
      "Hours", ...Array(departmentNames.length).fill("")
    ];

    const headerRow2 = [
      "", "", "", "",
      ...departmentNames.map(dept => displayDeptName(dept)),
      "Total"
    ];

    const rawRows = [headerRow1, headerRow2];

    result.forEach((row, index) => {
      const rowData = [
        (index + 1).toString(),
        row.name,
        row.type,
        row.division,
        ...departmentNames.map(dept => {
          const val = row.hours?.[dept]?.total ?? 0;
          return val > 0 ? val : 0;
        }),
        row.total ?? 0
      ];
      rawRows.push(rowData as any[]);
    });

    const totalRow = [
      "",
      "Total",
      "",
      "",
      ...departmentNames.map(dept => colHoursTotals[dept] ?? 0),
      overallHoursTotal
    ];
    rawRows.push(totalRow as any[]);

    const ws = XLSX.utils.aoa_to_sheet(rawRows);

    // Apply styles and center alignments dynamically to all cells
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell_address = XLSX.utils.encode_cell({ r, c });
        if (!ws[cell_address]) {
          ws[cell_address] = { t: "s", v: "" };
        }
        const cell = ws[cell_address];
        
        const defaultBorder = {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        };

        cell.s = {
          font: { name: "Arial", sz: 10 },
          alignment: { vertical: "center", horizontal: "center" },
          border: defaultBorder
        };

        if (c === 1 || c === 3) {
          cell.s.alignment.horizontal = "left";
        }

        // Header styles (Row 1 & 2)
        if (r === 0) {
          cell.s.font = { name: "Arial", sz: 11, bold: true };
          cell.s.alignment.horizontal = "center";
        } else if (r === 1) {
          cell.s.font = { name: "Arial", sz: 10, bold: true };
          cell.s.alignment.horizontal = "center";
        }
        // Total row styles
        else if (r === range.e.r) {
          cell.s.font = { name: "Arial", sz: 10, bold: true };
        }
        // Highlight total column cells
        else {
          if (c === 4 + departmentNames.length || c === 5 + departmentNames.length * 2) {
            cell.s.font = { name: "Arial", sz: 10, bold: true };
          }
        }
      }
    }

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
      { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
      { s: { r: 0, c: 4 }, e: { r: 0, c: 4 + departmentNames.length } }
    ];

    ws["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 12 },
      { wch: 18 },
      ...departmentNames.map(() => ({ wch: 12 })),
      { wch: 14 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Production Hours");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

    function s2ab(s: string) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    }

    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `production_hours_report_${appliedStartDate}_to_${appliedEndDate}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Export button */}
          <button
            onClick={handleExportExcel}
            disabled={result.length === 0}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-purple-200 rounded-lg px-3.5 py-2 h-9 gap-2 shadow-sm bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

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
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-9 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 block">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
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
          {/* Sleek Metrics Ribbon displaying the 6 exact Backend Metrics */}
          <div className="bg-white border border-gray-300 rounded-2xl shadow-sm overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <RibbonMetric
              title="TOTAL HOURS"
              value={(metrics?.totalHours ?? metrics?.totalWorkedHours ?? overallHoursTotal).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              subtext={subtext}
              icon={<Clock className="w-3.5 h-3.5" />}
              colorTheme="purple"
            />
            <RibbonMetric
              title="BILLABLE HOURS"
              value={(metrics?.billableHours ?? overallHoursBillableTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              subtext={subtext}
              icon={<Clock className="w-3.5 h-3.5" />}
              colorTheme="emerald"
            />
            <RibbonMetric
              title="NON-BILLABLE HOURS"
              value={(metrics?.nonBillableHours ?? overallHoursNonBillableTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              subtext={subtext}
              icon={<Briefcase className="w-3.5 h-3.5" />}
              colorTheme="amber"
            />
            <RibbonMetric
              title="ABSENT HOURS"
              value={(metrics?.absentHours ?? metrics?.totalAbsentHours ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              subtext={subtext}
              icon={<UserX className="w-3.5 h-3.5" />}
              colorTheme="red"
            />
            <RibbonMetric
              title="WORKING DAYS"
              value={(metrics?.totalWorkingDays ?? 0).toLocaleString()}
              subtext={subtext}
              icon={<Calendar className="w-3.5 h-3.5" />}
              colorTheme="blue"
            />
            <RibbonMetric
              title="ACTIVE EMPLOYEES"
              value={(metrics?.activeEmployeesCount ?? 0).toLocaleString()}
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
                      <th colSpan={departmentNames.length + 1} className="px-4 py-2 text-center border-b border-purple-200 font-bold bg-purple-50 sticky top-0">Hours</th>
                    </tr>
                    <tr className="bg-purple-50 border-b border-purple-200">
                      {/* Hours departments list */}
                      {departmentNames.map((dept) => (
                        <th key={`hours-${dept}`} className="px-3 py-2 text-center border-r border-purple-200 font-medium normal-case w-20 text-xs text-gray-500 bg-purple-50 sticky top-[38px] z-20">
                          {displayDeptName(dept)}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center border-r border-purple-200 font-bold bg-purple-50 w-24 sticky top-[38px] z-20">Total</th>
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
  colorTheme: "purple" | "emerald" | "amber" | "blue" | "indigo" | "red";
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
    red: "bg-red-50 text-red-600 border-red-100/70",
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
