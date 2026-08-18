"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from "date-fns";
import { DATE_FORMATS, appNow, dayKey, formatDay, isToday } from "@/lib/datetime";
import {
  EMPTY_DAY_STATUS,
  getDayStatusConfig,
  isNoProjectWorkDay,
} from "@/features/worklogs/lib/timesheet-status";
import { TimesheetDayExtras } from "@/features/worklogs/components/timesheet-day-extras";
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Briefcase,
  AlertCircle,
  Coffee,
  CalendarCheck,
  Palmtree,
  Hourglass,
  FileQuestion
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRouter } from "next-nprogress-bar";
import { useEffect } from "react";
import { useGetMyTimesheetQuery } from "@/features/worklogs/api/worklogs.queries";
import { cn } from "@/lib/utils";
import { WorklogDescription } from "@/features/worklogs/components/worklog-description";

export default function MyTimesheetPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  // Admins don't file their own worklogs. Leads do — they have a Lead-only
  // leadWorkMinutes input, and may backfill a missed day via the "forgot"
  // reason — so they must not be redirected away from their own worklog pages.
  useEffect(() => {
    if (isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, router]);

  const [currentMonth, setCurrentMonth] = useState(appNow);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const { data: timesheetData, isLoading } = useGetMyTimesheetQuery({ startDate, endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = timesheetData?.data?.days || [];

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };


  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">My Timesheet</h2>
          <p className="text-gray-500 mt-1 text-sm">Review your daily logs, weekends, and holidays.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-primary-50 hover:text-primary-600 h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="w-32 text-center font-medium text-gray-800 text-sm">
            {format(currentMonth, "MMMM yyyy")}
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-primary-50 hover:text-primary-600 h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse h-16 bg-gray-100 rounded-xl w-full"></div>
          <div className="animate-pulse h-[600px] bg-gray-100 rounded-xl w-full"></div>
        </div>
      ) : (
        <Card className="shadow-sm rounded-xl overflow-hidden bg-white border border-gray-200">
          <div className="bg-gray-50/50 border-b border-gray-100 p-6 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Monthly Overview
            </h3>
            <div className="text-right">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">Total Logged Time</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatMins(timesheetData?.data?.totalWorkedMinutes || 0)}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 gap-3 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((date, i) => {
                const dateStr = dayKey(date);
                const dayData = days.find((d: any) => dayKey(d.shiftDate) === dateStr);

                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isTodayDate = isToday(date);
                
                const config = dayData
                  ? getDayStatusConfig(dayData.status, dayData)
                  : EMPTY_DAY_STATUS;
                const Icon = config.icon;

                return (
                  <div 
                    key={i}
                    onClick={() => {
                      if (dayData && isCurrentMonth) {
                        setSelectedDay(dayData);
                      }
                    }}
                    className={`min-h-[100px] rounded-xl border p-2.5 flex flex-col transition-all duration-200 ${
                      !isCurrentMonth 
                        ? 'bg-gray-50/50 border-gray-100 opacity-40 cursor-default' 
                        : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-md cursor-pointer hover:-translate-y-0.5'
                    } ${isTodayDate ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-base font-semibold ${isTodayDate ? 'text-primary-600' : 'text-gray-800'}`}>
                        {format(date, "d")}
                      </span>
                      {dayData && isCurrentMonth && dayData.workedMinutes > 0 && (
                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {formatMins(dayData.workedMinutes)}
                        </span>
                      )}
                    </div>
                    
                    {dayData && isCurrentMonth && (
                      <div className="mt-auto flex flex-col gap-1">
                        <Badge variant="outline" className={`w-fit ${config.color} px-1.5 py-0 text-[10px] font-medium leading-4`}>
                          {Icon && <Icon className="w-3 h-3 mr-1" />}
                          {config.label}
                        </Badge>
                        {dayData.status === 'holiday' && dayData.holidayReason && (
                          <span className="text-[10px] text-gray-500 truncate mt-1">
                            {dayData.holidayReason}
                          </span>
                        )}
                        {dayData.status === 'absent' && dayData.missingReason && (
                          <span className="text-[10px] text-red-500 truncate mt-1">
                            {dayData.missingReason}
                          </span>
                        )}
                        {dayData.projects?.length > 0 && (
                          <span className="text-[10px] text-gray-500 truncate mt-1">
                            {dayData.projects.length} project{dayData.projects.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-5xl md:max-w-6xl lg:max-w-7xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gray-400" />
              {selectedDay && formatDay(selectedDay.shiftDate, DATE_FORMATS.DAY_FULL)}
            </DialogTitle>
          </DialogHeader>

          {selectedDay && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Status</p>
                  <Badge variant="outline" className={`${getDayStatusConfig(selectedDay.status, selectedDay).color} px-2 py-0.5`}>
                    {getDayStatusConfig(selectedDay.status, selectedDay).label}
                  </Badge>
                </div>
                {selectedDay.workedMinutes > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Time</p>
                    <p className="text-xl font-bold text-gray-900 whitespace-nowrap">
                      {formatMins(selectedDay.workedMinutes)}
                      {selectedDay.totalOvertimeMinutes > 0 && (
                        <span className="text-xs ml-1.5 text-gray-500 font-normal">
                          ({formatMins(selectedDay.totalOvertimeMinutes)} OT)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <TimesheetDayExtras day={selectedDay} />

              {isNoProjectWorkDay(selectedDay) ? (
                <div className="bg-sky-50 border border-sky-100 p-4 rounded-lg flex items-start gap-3">
                  <Hourglass className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sky-900">Free day</p>
                    <p className="text-sm text-sky-700 mt-1">
                      A full day was logged with no project work assigned.
                    </p>
                  </div>
                </div>
              ) : selectedDay.projects?.length > 0 ? (
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Projects Worked</p>
                  {selectedDay.projects.map((p: any, i: number) => (
                    <div key={i} className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-primary-50 p-2 rounded-lg border border-primary-100 shrink-0">
                            <Briefcase className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{p.project.name}</h4>
                            {p.stage && (
                               <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">Stage: {p.stage.name}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] uppercase text-gray-500 font-bold block mb-0.5 tracking-wider">Time</span>
                          <span className="font-bold text-gray-900 text-base whitespace-nowrap">
                            {formatMins(p.loggedMinutes)}
                            {p.overtimeMinutes > 0 && (
                              <span className="text-xs ml-1 text-gray-500 font-normal">
                                ({formatMins(p.overtimeMinutes)} OT)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <WorklogDescription categoryEntries={p.categoryEntries} />
                    </div>
                  ))}
                </div>
              ) : selectedDay.status === "holiday" ? (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
                  <Palmtree className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Public Holiday</p>
                    <p className="text-sm text-blue-700 mt-1">{selectedDay.holidayReason || "Enjoy your day off!"}</p>
                  </div>
                </div>
              ) : selectedDay.status === "absent" ? (
                <div className="bg-red-50 border border-red-100 p-4 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Absent</p>
                    {selectedDay.missingReason && (
                      <p className="text-sm text-red-700 mt-1 font-medium">{selectedDay.missingReason}</p>
                    )}
                    {selectedDay.missingNote && (
                      <p className="text-sm text-red-600 mt-1">{selectedDay.missingNote}</p>
                    )}
                    {!selectedDay.missingReason && !selectedDay.missingNote && (
                      <p className="text-sm text-red-700 mt-1">No time was logged for this date.</p>
                    )}
                  </div>
                </div>
              ): selectedDay.status === "other" ? (
                <div className="bg-violet-50 border border-violet-100 p-4 rounded-lg flex items-start gap-3">
                  <FileQuestion className="w-5 h-5 text-violet-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-violet-900">Excused</p>
                    <p className="text-sm text-violet-700 mt-1">
                      {selectedDay.missingNote || "A reason was filed for this day."}
                    </p>
                  </div>
                </div>
              ) : selectedDay.status === "weekend" ? (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-center gap-3 text-gray-500 py-8">
                  <Coffee className="w-6 h-6" />
                  <p className="font-medium">Weekend Rest Day</p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-center text-gray-500 py-8">
                  <p className="font-medium">No details available.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
