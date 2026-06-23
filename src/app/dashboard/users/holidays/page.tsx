"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useGetHolidaysQuery } from "@/features/holidays/api/holidays.queries";
import { useCreateHolidayMutation, useDeleteHolidayMutation } from "@/features/holidays/api/holidays.mutations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
type ModeType = "single" | "multiple" | "range";

function HolidaysPageContent() {
  const currentYear = new Date().getFullYear();
  const searchParams = useSearchParams();
  const [year, setYear] = useState(currentYear.toString());
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get("add") === "true");
  
  // Years from 2025 to current year
  const years = Array.from({ length: Math.max(1, currentYear - 2025 + 1) }, (_, i) => (2025 + i).toString());
  
  const { data, isLoading } = useGetHolidaysQuery({ year });
  const holidays = data?.data || [];

  const deleteMutation = useDeleteHolidayMutation();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this holiday?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Holiday deleted successfully");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to delete holiday");
        }
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Holidays</h1>
          <p className="text-sm text-gray-500">Manage organization holidays and breaks</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28 bg-white h-9 shadow-sm">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-primary-600 hover:bg-primary-700 text-white">
            <Plus className="w-4 h-4" />
            Create Holiday
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 border border-dashed rounded-lg bg-gray-50/50">
            <CalendarIcon className="w-8 h-8 mb-2 text-gray-400" />
            <p>No holidays found for {year}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {holidays.map((holiday) => (
              <div key={holiday._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden relative">
                <div className="p-4 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-8 h-8 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <button 
                      onClick={() => handleDelete(holiday._id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                      disabled={deleteMutation.isPending}
                      title="Delete holiday"
                    >
                      {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 truncate text-sm" title={holiday.reason}>{holiday.reason}</h3>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100 mt-3 flex items-center gap-2 text-xs text-gray-600">
                    <CalendarIcon className="w-3.5 h-3.5 text-primary-500" />
                    <span className="font-medium text-gray-700">
                      {format(new Date(holiday.shiftDate), "EEE, MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateHolidayDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}

export default function HolidaysPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <HolidaysPageContent />
    </Suspense>
  );
}

function CreateHolidayDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (val: boolean) => void }) {
  const [mode, setMode] = useState<ModeType>("single");
  const [reason, setReason] = useState("");
  
  // States for calendar
  const [date, setDate] = useState<Date>();
  const [dates, setDates] = useState<Date[]>([]);
  const [range, setRange] = useState<DateRange>();

  const createMutation = useCreateHolidayMutation();

  const handleSave = () => {
    if (!reason.trim()) return toast.error("Please enter a reason");

    const payload: any = { reason };

    if (mode === "single") {
      if (!date) return toast.error("Please select a date");
      payload.shiftDate = format(date, "yyyy-MM-dd");
    } else if (mode === "multiple") {
      if (!dates.length) return toast.error("Please select dates");
      payload.dates = dates.map(d => format(d, "yyyy-MM-dd"));
    } else if (mode === "range") {
      if (!range?.from || !range?.to) return toast.error("Please select a date range");
      payload.startDate = format(range.from, "yyyy-MM-dd");
      payload.endDate = format(range.to, "yyyy-MM-dd");
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Holiday(s) created successfully");
        onOpenChange(false);
        // Reset state
        setReason("");
        setDate(undefined);
        setDates([]);
        setRange(undefined);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to create holiday");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create Holiday</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode("single")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === "single" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              Single Date
            </button>
            <button
              onClick={() => setMode("multiple")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === "multiple" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              Multiple Dates
            </button>
            <button
              onClick={() => setMode("range")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === "range" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              Date Range
            </button>
          </div>

          <div className="space-y-2">
            <Label>Holiday Reason</Label>
            <Input 
              placeholder="e.g. Christmas, New Year..." 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
            />
          </div>

          <div className="flex flex-col items-center border rounded-xl p-3 bg-gray-50/50">
            {mode === "single" && (
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate as any}
                className="bg-transparent"
              />
            )}
            {mode === "multiple" && (
              <Calendar
                mode="multiple"
                selected={dates}
                onSelect={setDates as any}
                className="bg-transparent"
              />
            )}
            {mode === "range" && (
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange as any}
                className="bg-transparent"
              />
            )}

            <div className="mt-4 pt-3 border-t border-gray-200 w-full text-center text-sm">
              {mode === "single" && (
                date ? (
                  <p className="text-gray-700">
                    Selected Date: <span className="font-semibold text-primary-700">{format(date, "PPP")}</span>
                  </p>
                ) : (
                  <p className="text-amber-600 font-medium">No date selected yet</p>
                )
              )}
              
              {mode === "multiple" && (
                dates.length > 0 ? (
                  <div className="text-gray-700">
                    <p>Selected {dates.length} date{dates.length > 1 ? "s" : ""}:</p>
                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                      {dates.map(d => (
                        <span key={d.toISOString()} className="px-2 py-1 bg-primary-50 text-primary-700 border border-primary-100 rounded text-xs font-medium">
                          {format(d, "MMM d, yyyy")}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-600 font-medium">No dates selected yet</p>
                )
              )}

              {mode === "range" && (
                (range?.from || range?.to) ? (
                  <p className="text-gray-700">
                    Selected Range: 
                    <span className="font-semibold text-primary-700 ml-1">
                      {range.from ? format(range.from, "PPP") : "..."} — {range.to ? format(range.to, "PPP") : "..."}
                    </span>
                  </p>
                ) : (
                  <p className="text-amber-600 font-medium">No date range selected yet</p>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending} className="bg-primary-600 hover:bg-primary-700">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
