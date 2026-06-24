"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { RecentWorklogs } from "@/features/worklogs/components/recent-worklogs";
import { useGetMyWorklogByDateQuery, useGetMyMissingEntriesQuery } from "@/features/worklogs/api/worklogs.queries";
import { format, subDays, startOfMonth } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Clock, Plus, CheckCircle2, AlertCircle, CalendarCheck, FileText, Briefcase, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next-nprogress-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseISO } from "date-fns";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const todayDateStr = format(new Date(), "yyyy-MM-dd");
  
  const { data: dailyWorklogData, isLoading } = useGetMyWorklogByDateQuery(todayDateStr);
  const myWorklog = dailyWorklogData?.data;

  const { data: missingEntriesData, isLoading: isLoadingMissing } = useGetMyMissingEntriesQuery({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(subDays(new Date(), 1), "yyyy-MM-dd")
  });
  const missingEntries = (missingEntriesData?.data || []).filter((e: any) => {
    const d = typeof e === "string" ? e : e?.shiftDate;
    return d && d !== "null";
  });

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="w-full p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return "Good Morning";
              if (hour < 17) return "Good Afternoon";
              if (hour < 21) return "Good Evening";
              return "Good Night";
            })()}{user?.name ? `, ${user.name}` : ""}!
          </h1>
          <p className="text-gray-500 text-lg">
            Here is what's happening in your workspace today.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {!isAdmin && missingEntries.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 text-lg">Missing Logs Detected</h3>
                  <p className="text-red-700 text-sm">
                    You have {missingEntries.length} day{missingEntries.length > 1 ? "s" : ""} from this month without submitted worklogs.
                  </p>
                </div>
              </div>
              {(() => {
                const firstEntry = missingEntries[0];
                const shiftDateRaw = typeof firstEntry === 'string' ? firstEntry : firstEntry.shiftDate;
                const shiftDateClean = shiftDateRaw ? shiftDateRaw.split('T')[0] : '';
                return (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <Select 
                      onValueChange={(val) => router.push(`/dashboard/daily-log?date=${val}`)}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] bg-white border-red-200 text-red-700 h-10">
                        <SelectValue placeholder="Pick a missing date" />
                      </SelectTrigger>
                      <SelectContent>
                        {missingEntries.map((entry: any) => {
                          const sdRaw = typeof entry === 'string' ? entry : entry.shiftDate;
                          const d = sdRaw.split('T')[0];
                          return (
                            <SelectItem key={d} value={d} className="text-red-700 font-medium">
                              {format(parseISO(d), "MMM d, yyyy")}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    
                    <Link href={`/dashboard/daily-log?date=${shiftDateClean}`}>
                      <Button variant="destructive" className="shrink-0 gap-2 w-full h-10 shadow-sm">
                        <Plus className="w-4 h-4" /> Fill Next Missing
                      </Button>
                    </Link>
                  </div>
                );
              })()}
            </div>
          )}

          {!isAdmin && (
            <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-lg">
                  <CalendarCheck className="w-5 h-5 text-primary-500" /> Today's Status
                </h3>
                <span className="text-sm font-medium text-gray-500">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader className="w-8 h-8 text-primary-600" />
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50/50 border border-gray-100 rounded-xl p-5 gap-6">
                    <div className="flex items-center gap-4">
                      {myWorklog?.status === 'submitted' ? (
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      ) : myWorklog?.status === 'draft' ? (
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                          <Clock className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-lg">
                            {myWorklog?.status === 'submitted' ? 'Logs Submitted' : 
                             myWorklog?.status === 'draft' ? 'Draft Saved' : 'No Logs Yet'}
                          </p>
                          {myWorklog?.status && (
                            <Badge variant="outline" className={
                              myWorklog.status === 'submitted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              myWorklog.status === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }>
                              {myWorklog.status.charAt(0).toUpperCase() + myWorklog.status.slice(1)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {myWorklog?.status === 'submitted' || myWorklog?.status === 'draft' 
                            ? `You have logged ${formatMins(myWorklog?.totalLoggedMinutes || 0)} today.`
                            : "You haven't added any work logs for today yet."}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex shrink-0">
                      <Link href="/dashboard/daily-log" className="w-full">
                        <Button className="w-full gap-2 shadow-sm">
                          {myWorklog?.status === 'submitted' ? (
                            <>
                              <FileText className="w-4 h-4" /> View Log
                            </>
                          ) : myWorklog?.status === 'draft' ? (
                            <>
                              <FileText className="w-4 h-4" /> Complete Draft
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" /> Add Work Logs
                            </>
                          )}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {myWorklog?.entries && myWorklog.entries.length > 0 && (
                    <div className="mt-2 border-t border-gray-100 pt-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-500" /> Today's Logged Entries
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myWorklog.entries.map((entry: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col gap-2 transition-colors hover:bg-gray-50 hover:border-gray-200">
                            <div className="flex items-start justify-between gap-4">
                              <h5 className="font-semibold text-gray-900 text-sm line-clamp-1">
                                {typeof entry.project === "object" ? `${entry.project.code ? entry.project.code + ' - ' : ''}${entry.project.name || 'Unknown Project'}`.trim() : "Project"}
                              </h5>
                              <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded shrink-0">
                                {formatMins(entry.loggedMinutes)}
                              </span>
                            </div>
                            {entry.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{entry.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {!isAdmin && (
            <div>
              <RecentWorklogs />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
