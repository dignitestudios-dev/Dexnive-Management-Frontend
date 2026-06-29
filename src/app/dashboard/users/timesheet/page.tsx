"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, parse } from "date-fns";
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
  User as UserIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";

import { useGetUserTimesheetQuery } from "@/features/worklogs/api/worklogs.queries";
import { useGetUsersQuery } from "@/features/users/api/users.queries";

function TimesheetContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const monthParam = searchParams.get("month");
    if (monthParam) {
      try {
        const parsed = parse(monthParam, "yyyy-MM", new Date());
        if (!isNaN(parsed.getTime())) return parsed;
      } catch (e) {}
    }
    return new Date();
  });
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>(searchParams.get("user") || "");
  const [userComboOpen, setUserComboOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    const monthStr = format(currentMonth, "yyyy-MM");
    if (params.get("month") !== monthStr) {
      params.set("month", monthStr);
      changed = true;
    }

    if (selectedUserId) {
      if (params.get("user") !== selectedUserId) {
        params.set("user", selectedUserId);
        changed = true;
      }
    } else {
      if (params.has("user")) {
        params.delete("user");
        changed = true;
      }
    }

    if (changed) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [currentMonth, selectedUserId, pathname, router, searchParams]);

  const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery({ limit: 100, search: debouncedSearch });
  const users = usersData?.data || [];

  const { data: timesheetData, isLoading: isTimesheetLoading, isFetching } = useGetUserTimesheetQuery({
    user: selectedUserId,
    startDate,
    endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = timesheetData?.data?.days || [];

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case "present": return { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CalendarCheck, label: "Logged" };
      case "submitted": return { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CalendarCheck, label: "Logged" };
      case "draft": return { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Draft" };
      case "holiday": return { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Palmtree, label: "Holiday" };
      case "weekend": return { color: "bg-gray-50 text-gray-500 border-gray-200", icon: Coffee, label: "Weekend" };
      case "absent": return { color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle, label: "Absent" };
      default: return { color: "bg-gray-50 text-gray-600 border-gray-200", icon: Clock, label: "Pending" };
    }
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
          <h2 className="text-2xl font-semibold text-gray-900">User Timesheets</h2>
          <p className="text-gray-500 mt-1 text-sm">Review daily logs, weekends, and holidays for a specific user.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          <div className="w-64">
            <Popover open={userComboOpen} onOpenChange={setUserComboOpen}>
              <PopoverTrigger render={
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userComboOpen}
                  className="w-full justify-between h-10 font-normal text-sm bg-white"
                  disabled={isUsersLoading && users.length === 0}
                >
                  <div className="flex items-center gap-2 truncate">
                    <UserIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="truncate">
                      {selectedUserId 
                        ? users.find((u: any) => u._id === selectedUserId)?.name || "User Selected"
                        : "Select a user"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              } />
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search user by name..." 
                    className="h-9"
                    value={searchQuery}
                    onValueChange={setSearchQuery} 
                  />
                  <CommandList>
                    {isUsersLoading && (
                      <div className="py-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4" /> Loading...
                      </div>
                    )}
                    {!isUsersLoading && <CommandEmpty>No user found.</CommandEmpty>}
                    <CommandGroup>
                      {users.map((u: any) => (
                        <CommandItem
                          key={u._id}
                          value={u.name + " " + u._id}
                          onSelect={() => {
                            setSelectedUserId(u._id);
                            setUserComboOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUserId === u._id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {u.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
      </div>

      {!selectedUserId ? (
        <Card className="flex flex-col items-center justify-center py-16 px-4 border-dashed bg-gray-50/50">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a User</h3>
          <p className="text-sm text-gray-500 max-w-sm text-center">
            Please choose a user from the dropdown above to view their timesheet records.
          </p>
        </Card>
      ) : isTimesheetLoading || isFetching ? (
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
                const dateStr = format(date, "yyyy-MM-dd");
                const dayData = days.find((d: any) => d.shiftDate.startsWith(dateStr));
                
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isTodayDate = isToday(date);
                
                const config = dayData ? getStatusConfig(dayData.status) : { color: "bg-transparent text-transparent border-transparent", icon: null, label: "" };
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gray-400" />
              {selectedDay && format(new Date(selectedDay.shiftDate), "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>

          {selectedDay && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Status</p>
                  <Badge variant="outline" className={`${getStatusConfig(selectedDay.status).color} px-2 py-0.5`}>
                    {getStatusConfig(selectedDay.status).label}
                  </Badge>
                </div>
                {selectedDay.workedMinutes > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Time</p>
                    <p className="text-xl font-bold text-gray-900">{formatMins(selectedDay.workedMinutes)}</p>
                  </div>
                )}
              </div>

              {selectedDay.projects?.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
                          <span className="font-bold text-gray-900 text-base">{formatMins(p.loggedMinutes)}</span>
                        </div>
                      </div>
                      {p.description && (
                        <div className="p-3.5 border-t border-gray-100 bg-white">
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{p.description}</p>
                        </div>
                      )}
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

export default function UserTimesheetPage() {
  return (
    <Suspense fallback={
      <div className="w-full p-6 md:p-8 flex items-center justify-center">
        <Loader className="w-6 h-6 text-primary-500" />
      </div>
    }>
      <TimesheetContent />
    </Suspense>
  );
}
