"use client";

import { useGetMyWorklogsQuery } from "../api/worklogs.queries";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card } from "@/components/ui/card";
import { Briefcase, CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";

export function RecentWorklogs() {
  const currentMonth = new Date();
  const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const { data: worklogsResponse, isLoading } = useGetMyWorklogsQuery({
    startDate,
    endDate,
    status: "submitted",
    page: 1,
    limit: 10,
  });

  const worklogs = worklogsResponse?.data || [];

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  if (isLoading) {
    return (
      <div className="h-64 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-center">
        <Loader className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (worklogs.length === 0) {
    return (
      <Card className="h-64 border-gray-200 shadow-sm flex flex-col items-center justify-center p-6 text-center bg-white">
        <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-3">
          <CalendarDays className="w-6 h-6" />
        </div>
        <h3 className="text-gray-900 font-medium mb-1">No Recent Logs</h3>
        <p className="text-sm text-gray-500 max-w-[250px]">
          You haven't submitted any worklogs this month yet.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden flex flex-col h-[400px]">
      <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-500" /> Recent Logs
        </h3>
        <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
          This Month
        </Badge>
      </div>
      <div className="overflow-y-auto custom-scrollbar p-3 flex-1">
        <div className="space-y-2">
          {worklogs.map((log: any) => (
            <div key={log._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-all flex items-center justify-between group">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-0.5">
                  {format(new Date(log.shiftDate), "MMM dd, yyyy")}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0">
                    Submitted
                  </Badge>
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {log.entries?.length || 0} Projects
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Logged</p>
                <p className="text-sm font-bold text-gray-700 bg-white border border-gray-100 px-2.5 py-1 rounded shadow-sm group-hover:border-gray-200">
                  {formatMins(log.totalLoggedMinutes)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
