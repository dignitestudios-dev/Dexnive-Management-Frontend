"use client";
import { Loader } from "@/components/ui/loader";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO, startOfMonth, subDays } from "date-fns";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  PlaySquare,
  ChevronRight,
  Clock,
  ArrowRight,
  Info
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useGetProjectsQuery } from "@/features/projects/api/projects.queries";
import { 
  useGetMyWorklogByDateQuery, 
  useGetNonBillableReasonsQuery,
  useGetMyMissingEntriesQuery
} from "@/features/worklogs/api/worklogs.queries";
import { useRouter } from "next-nprogress-bar";
import { 
  useSaveDraftMutation, 
  useSubmitWorklogMutation 
} from "@/features/worklogs/api/worklogs.mutations";

const entrySchema = z.object({
  project: z.string().min(1, "Required"),
  hours: z.number().min(0),
  minutes: z.number().min(0).max(59),
  description: z.string().optional(),
}).refine(data => data.hours > 0 || data.minutes > 0, {
  message: "Required",
  path: ["minutes"],
});

const draftFormSchema = z.object({
  entries: z.array(entrySchema).min(1, "At least one entry is required"),
}).refine(data => {
  const totalMinutes = data.entries.reduce((acc, entry) => acc + (entry.hours * 60) + entry.minutes, 0);
  return totalMinutes <= 24 * 60;
}, {
  message: "Total logged time cannot exceed 24 hours per day",
  path: ["root"], // Use root to easily display form-level errors
});

export function DailyWorklog({ defaultDate }: { defaultDate?: string }) {
  const router = useRouter();
  const defaultDateOnly = defaultDate ? defaultDate.split('T')[0] : undefined;
  const today = defaultDateOnly || format(new Date(), "yyyy-MM-dd");
  
  const { data: myWorklog, isLoading: isLoadingWorklog, refetch } = useGetMyWorklogByDateQuery(today);
  const { data: projectsData } = useGetProjectsQuery({ status: "active", limit: 100 });
  const { data: reasonsData } = useGetNonBillableReasonsQuery();

  const { data: missingEntriesData } = useGetMyMissingEntriesQuery({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(subDays(new Date(), 1), "yyyy-MM-dd")
  });

  const handleSubmissionSuccess = () => {
    setSubmittingAction(null);
    const missingEntries = missingEntriesData?.data || [];
    const remainingMissing = missingEntries.filter((entry: any) => {
      const sd = typeof entry === 'string' ? entry : entry.shiftDate;
      return sd && sd.split('T')[0] !== today;
    });

    if (defaultDate && remainingMissing.length > 0) {
      const nextDate = typeof remainingMissing[0] === 'string' ? remainingMissing[0] : remainingMissing[0].shiftDate;
      const nextDateClean = nextDate.split('T')[0];
      toast.success(`Worklog submitted! Redirecting to next missing log: ${format(parseISO(nextDateClean), "MMM d")}`);
      router.push(`/dashboard/daily-log?date=${nextDateClean}`);
    } else {
      toast.success("Worklog submitted and locked!");
      if (defaultDate) {
        router.push("/dashboard");
      } else {
        refetch().then(() => {
          setSubmittingAction(null);
          setStep(2);
        });
      }
    }
  };

  const saveDraftMutation = useSaveDraftMutation();
  const submitWorklogMutation = useSubmitWorklogMutation();

  const [step, setStep] = useState<1 | 2>(1); // 1: Draft, 2: Allocation/Submit
  const [allocations, setAllocations] = useState<Record<string, { reason: string; minutes: number; note?: string }[]>>({});
  const [submittingAction, setSubmittingAction] = useState<'draft' | 'continue' | null>(null);

  const draftForm = useForm<z.infer<typeof draftFormSchema>>({
    resolver: zodResolver(draftFormSchema),
    defaultValues: {
      entries: [{ project: "", hours: 0, minutes: 0, description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: draftForm.control,
    name: "entries",
  });

  const watchedEntries = useWatch({
    control: draftForm.control,
    name: "entries",
  });

  // Calculate live total minutes from the form
  const liveTotalMinutes = (watchedEntries || []).reduce((acc, entry) => {
    const hrs = parseInt(entry.hours as any) || 0;
    const mins = parseInt(entry.minutes as any) || 0;
    return acc + (hrs * 60) + mins;
  }, 0);

  const targetMinutes = 8 * 60;
  const currentMaxMinutes = Math.max(targetMinutes, liveTotalMinutes);
  const primaryWidth = (Math.min(liveTotalMinutes, targetMinutes) / currentMaxMinutes) * 100;
  const draftOvertimeWidth = (Math.max(0, liveTotalMinutes - targetMinutes) / currentMaxMinutes) * 100;
  const isOvertime = liveTotalMinutes > targetMinutes;

  useEffect(() => {
    if (!myWorklog) return;

    if (!myWorklog.data) {
      // It's a completely new/empty day
      draftForm.reset({ entries: [{ project: "", hours: 0, minutes: 0, description: "" }] });
      setStep(1);
      setAllocations({});
      return;
    }

    const data = myWorklog.data;
    if (data.status === "draft") {
      const newAllocations: Record<string, { reason: string; minutes: number }[]> = {};
      let needsAlloc = false;

      (data.entries || []).forEach((entry: any) => {
        if (entry.nonBillableMinutes > 0) {
          needsAlloc = true;
          newAllocations[entry._id] = entry.reasonAllocations?.length 
            ? entry.reasonAllocations 
            : [{ reason: "", minutes: entry.nonBillableMinutes }];
        }
      });

      setAllocations(newAllocations);
      
      const formEntries = (data.entries || []).map((entry: any) => ({
        project: typeof entry.project === "string" ? entry.project : entry.project._id,
        hours: Math.floor(entry.loggedMinutes / 60),
        minutes: entry.loggedMinutes % 60,
        description: entry.description || "",
      }));
      
      if (formEntries.length > 0) {
        draftForm.reset({ entries: formEntries });
      } else {
        draftForm.reset({ entries: [{ project: "", hours: 0, minutes: 0, description: "" }] });
      }

    } else if (data.status === "submitted") {
      setStep(2); // Keep it on the review view
    }
  }, [myWorklog, draftForm]);

  const onDraftSubmit = (values: z.infer<typeof draftFormSchema>, goToNextStep: boolean = true) => {
    setSubmittingAction(goToNextStep ? 'continue' : 'draft');
    const payload = {
      shiftDate: today,
      entries: values.entries.map(e => ({
        project: e.project,
        minutes: (e.hours * 60) + e.minutes,
        description: e.description,
      })),
    };

    saveDraftMutation.mutate(payload, {
      onSuccess: () => {
        if (goToNextStep) {
          if (liveTotalMinutes >= 480) {
            // Auto submit if 8 hours or more
            submitWorklogMutation.mutate({ shiftDate: today, reasonAllocations: {} }, {
              onSuccess: () => {
                handleSubmissionSuccess();
              },
              onError: (error: any) => {
                toast.error(error.message || "Draft saved, but failed to auto-submit.");
                refetch().then(() => {
                  setSubmittingAction(null);
                  setStep(2);
                });
              }
            });
          } else {
            toast.success("Draft saved, proceeding...");
            refetch().then(() => {
              setSubmittingAction(null);
              setStep(2);
            });
          }
        } else {
          toast.success("Draft saved successfully");
          refetch().then(() => setSubmittingAction(null));
        }
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to save draft");
        setSubmittingAction(null);
      }
    });
  };

  const onFinalSubmit = () => {
    if (!myWorklog?.data) return;
    
    let isValid = true;
    const entries = myWorklog.data.entries || [];
    
    for (const entry of entries) {
      if (entry.nonBillableMinutes > 0) {
        const entryAllocs = allocations[entry._id] || [];
        const totalAllocated = entryAllocs.reduce((sum, a) => sum + (a.minutes || 0), 0);
        
        if (totalAllocated !== entry.nonBillableMinutes) {
          toast.error(`Please allocate exactly ${entry.nonBillableMinutes} minutes for missing time.`);
          isValid = false;
          break;
        }
        
        for (const a of entryAllocs) {
          if (!a.reason) {
            toast.error("Please select a reason for all non-billable time");
            isValid = false;
            break;
          }
          const reasonObj = reasonsData?.data?.find((r: any) => r._id === a.reason);
          if (reasonObj?.requiresNote && !a.note?.trim()) {
            toast.error(`Please provide a note for the reason: ${reasonObj.name}`);
            isValid = false;
            break;
          }
        }
      }
    }

    if (!isValid) return;

    submitWorklogMutation.mutate({
      shiftDate: today,
      reasonAllocations: allocations,
    }, {
      onSuccess: () => {
        handleSubmissionSuccess();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to submit worklog");
      }
    });
  };

  if (isLoadingWorklog) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-xl w-full"></div>;
  }

  const worklog = myWorklog?.data;
  const isSubmitted = worklog?.status === "submitted";
  const isDraft = worklog?.status === "draft";
  const needsAllocations = isDraft && worklog?.entries?.some(e => e.nonBillableMinutes > 0);

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="w-full">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {defaultDate ? "Timesheet for" : "Today's Timesheet"}
          </h2>
          <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary-600" />
            {format(parseISO(today), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div>
          {isSubmitted ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Locked & Submitted
            </Badge>
          ) : isDraft ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 flex items-center gap-1.5 font-medium">
              <PlaySquare className="w-4 h-4" /> Draft Saved
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 px-3 py-1 flex items-center gap-1.5 font-medium">
              <Info className="w-4 h-4" /> Pending Log
            </Badge>
          )}
        </div>
      </div>

      <Card className="shadow-sm rounded-xl overflow-hidden bg-white border border-gray-200">
        {/* Progress Bar Header */}
        <div className="bg-gray-50/50 border-b border-gray-100 p-6">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Time Logged</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900">
                  {step === 2 && worklog 
                    ? formatMins(worklog.totalLoggedMinutes)
                    : formatMins(liveTotalMinutes)}
                </span>
                <span className="text-gray-500 text-sm font-medium">/ 8h 0m</span>
              </div>
            </div>
            {isOvertime && step === 1 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
                +{formatMins(liveTotalMinutes - targetMinutes)} Overtime
              </Badge>
            )}
          </div>
          
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex">
            {step === 2 && worklog ? (
              (() => {
                const maxMins = Math.max(targetMinutes, worklog.totalLoggedMinutes);
                return (
                  <>
                    <div 
                      style={{ width: `${(worklog.totalBillableMinutes / maxMins) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all duration-300"
                    />
                    <div 
                      style={{ width: `${(worklog.totalNonBillableMinutes / maxMins) * 100}%` }}
                      className="bg-amber-400 h-full transition-all duration-300"
                    />
                    <div 
                      style={{ width: `${(worklog.totalOvertimeMinutes / maxMins) * 100}%` }}
                      className="bg-purple-500 h-full transition-all duration-300"
                    />
                  </>
                );
              })()
            ) : (
              <>
                <div 
                  className="bg-primary-600 h-full transition-all duration-300"
                  style={{ width: `${primaryWidth}%` }}
                />
                {isOvertime && (
                  <div 
                    className="bg-purple-500 h-full transition-all duration-300"
                    style={{ width: `${draftOvertimeWidth}%` }}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-6">
          {isSubmitted ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Time", val: worklog.totalLoggedMinutes, color: "text-gray-900", bg: "bg-gray-50 border-gray-100" },
                  { label: "Billable", val: worklog.totalBillableMinutes, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
                  { label: "Non-Billable", val: worklog.totalNonBillableMinutes, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
                  { label: "Overtime", val: worklog.totalOvertimeMinutes, color: "text-purple-700", bg: "bg-purple-50 border-purple-100" }
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${stat.bg}`}>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className={`text-lg font-semibold ${stat.color}`}>{formatMins(stat.val)}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Project Entries
                </h3>
                <div className="space-y-4">
                  {worklog.entries?.map((entry: any, idx: number) => (
                    <div key={idx} className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-gray-300">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4 bg-gray-50/30">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-50 p-2.5 rounded-lg border border-primary-100">
                            <Briefcase className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-base">
                              {typeof entry.project === "object" ? `${entry.project.code} - ${entry.project.name}` : "Project"}
                            </h4>
                            {entry.stage && (
                              <p className="text-xs text-gray-500 font-medium mt-0.5">Stage: {entry.stage.name}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                           <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                            {entry.billableMinutes > 0 && (
                              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                                {formatMins(entry.billableMinutes)} Billable
                              </Badge>
                            )}
                            {entry.nonBillableMinutes > 0 && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 font-medium">
                                {formatMins(entry.nonBillableMinutes)} Non-Billable
                              </Badge>
                            )}
                            {entry.overtimeMinutes > 0 && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 font-medium">
                                {formatMins(entry.overtimeMinutes)} Overtime
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col items-start md:items-end md:text-right border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-6 border-gray-200">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Total Time</span>
                            <span className="text-lg font-bold text-gray-900">{formatMins(entry.loggedMinutes)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {(entry.description || entry.reasonAllocations?.length > 0) && (
                        <div className="p-5 border-t border-gray-100">
                          {entry.description && (
                            <div className={entry.reasonAllocations?.length > 0 ? "mb-5" : ""}>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Description</span>
                                <p className="text-gray-700 text-sm leading-relaxed">{entry.description}</p>
                            </div>
                          )}
                          
                          {entry.reasonAllocations?.length > 0 && (
                            <div className={entry.description ? "pt-5 border-t border-gray-100/60" : ""}>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block">Non-Billable Allocations</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {entry.reasonAllocations.map((alloc: any, i: number) => (
                                  <div key={i} className="flex items-start justify-between bg-amber-50/40 border border-amber-100/50 p-3.5 rounded-lg hover:bg-amber-50/80 transition-colors">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                        <span className="text-sm font-semibold text-gray-800">{alloc.reason?.name || 'Unknown'}</span>
                                      </div>
                                      {alloc.note && (
                                        <p className="text-xs text-gray-600 ml-3.5 flex items-start gap-1 mt-1.5">
                                          <Info className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
                                          {alloc.note}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-sm font-bold text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded ml-3 shrink-0">
                                      {formatMins(alloc.minutes)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {step === 1 && (
                <div>
                  <Form {...draftForm}>
                    <form onSubmit={draftForm.handleSubmit(v => onDraftSubmit(v, true))} className="space-y-5">
                      {missingEntriesData?.data && missingEntriesData.data.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-amber-50/50 border border-amber-100 p-4 rounded-xl mb-4 gap-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-amber-900">Log Date</span>
                            <span className="text-xs text-amber-700">Select which missing day to log</span>
                          </div>
                          <Select 
                            value={today} 
                            onValueChange={(val) => {
                              const todayStr = format(new Date(), "yyyy-MM-dd");
                              if (val === todayStr) {
                                router.push("/dashboard");
                              } else {
                                router.push(`/dashboard/daily-log?date=${val}`);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full sm:w-[240px] bg-white border-amber-200 text-amber-900 focus:ring-amber-300">
                              <SelectValue placeholder="Select date" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={format(new Date(), "yyyy-MM-dd")}>
                                Today ({format(new Date(), "MMM d")})
                              </SelectItem>
                              {missingEntriesData.data.map((entry: any) => {
                                const sd = typeof entry === 'string' ? entry : entry.shiftDate;
                                const d = sd.split('T')[0];
                                return (
                                  <SelectItem key={d} value={d} className="text-amber-700 font-medium">
                                    Missing: {format(parseISO(d), "MMM d, yyyy")}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <div 
                            key={field.id}
                            className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 relative group transition-all hover:border-gray-300 hover:shadow-sm"
                          >
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                              <div className="md:col-span-4">
                                <FormField
                                  control={draftForm.control}
                                  name={`entries.${index}.project`}
                                  render={({ field }: any) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700 font-semibold">Project</FormLabel>
                                      <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                          <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                                            <SelectValue placeholder="Select project">
                                              {projectsData?.data?.find((p: any) => p._id === field.value)?.name || "Select project"}
                                            </SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            {projectsData?.data?.map((project: any) => {
                                              const isSelectedElsewhere = watchedEntries?.some((e: any, i: number) => i !== index && e.project === project._id);
                                              return (
                                                <SelectItem key={project._id} value={project._id} disabled={isSelectedElsewhere}>
                                                  {project.name}
                                                </SelectItem>
                                              );
                                            })}
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <div className="md:col-span-5">
                                <FormField
                                  control={draftForm.control}
                                  name={`entries.${index}.description`}
                                  render={({ field }: any) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700 font-semibold">Description</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="What did you do?" className="bg-white border-gray-200 shadow-sm resize-none h-10 min-h-10 py-2" rows={1} {...field} />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="md:col-span-3">
                                <FormLabel className="text-gray-700 font-semibold block mb-2">Time Spent</FormLabel>
                                <div className="flex gap-2">
                                  <FormField
                                    control={draftForm.control}
                                    name={`entries.${index}.hours`}
                                    render={({ field }: any) => (
                                      <FormItem className="flex-1 space-y-0">
                                        <FormControl>
                                          <div className="relative">
                                            <Input 
                                              type="number" 
                                              min={0} 
                                              placeholder="0"
                                              className="bg-white border-gray-200 shadow-sm pr-6 text-center" 
                                              {...field} 
                                              value={field.value === 0 ? "" : field.value}
                                              onChange={e => {
                                                const raw = e.target.value;
                                                if (raw === "") {
                                                  field.onChange(0);
                                                  return;
                                                }
                                                let val = parseInt(raw) || 0;
                                                const currentHours = parseInt(field.value) || 0;
                                                const otherMinutes = liveTotalMinutes - (currentHours * 60);
                                                const maxAllowedHours = Math.floor((24 * 60 - otherMinutes) / 60);
                                                if (val > maxAllowedHours) val = Math.max(0, maxAllowedHours);
                                                field.onChange(val);
                                              }} 
                                            />
                                            <span className="absolute right-2.5 top-2.5 text-xs text-gray-400 font-medium">h</span>
                                          </div>
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={draftForm.control}
                                    name={`entries.${index}.minutes`}
                                    render={({ field }: any) => (
                                      <FormItem className="flex-1 space-y-0">
                                        <FormControl>
                                          <div className="relative">
                                            <Input 
                                              type="number" 
                                              min={0} 
                                              max={59} 
                                              placeholder="0"
                                              className="bg-white border-gray-200 shadow-sm pr-6 text-center" 
                                              {...field} 
                                              value={field.value === 0 ? "" : field.value}
                                              onChange={e => {
                                                const raw = e.target.value;
                                                if (raw === "") {
                                                  field.onChange(0);
                                                  return;
                                                }
                                                let val = parseInt(raw) || 0;
                                                const currentMins = parseInt(field.value) || 0;
                                                const otherMinutes = liveTotalMinutes - currentMins;
                                                const maxAllowedMinutes = (24 * 60) - otherMinutes;
                                                const finalMax = Math.min(59, Math.max(0, maxAllowedMinutes));
                                                if (val > finalMax) val = finalMax;
                                                field.onChange(val);
                                              }} 
                                            />
                                            <span className="absolute right-2.5 top-2.5 text-xs text-gray-400 font-medium">m</span>
                                          </div>
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {draftForm.formState.errors.root && (
                          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {draftForm.formState.errors.root.message}
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full border-dashed border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                          onClick={() => append({ project: "", hours: 0, minutes: 0, description: "" })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Project Entry
                        </Button>
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={draftForm.handleSubmit(v => onDraftSubmit(v, false))}
                          disabled={submittingAction !== null || liveTotalMinutes === 0}
                          className="border-gray-200 text-gray-700 hover:bg-gray-50 min-w-[120px]"
                        >
                          {submittingAction === 'draft' ? <Loader className="w-4 h-4 mr-2" /> : null}
                          Save Draft
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={submittingAction !== null || liveTotalMinutes === 0}
                          className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm min-w-[150px]"
                        >
                          {submittingAction === 'continue' ? (
                            <>
                              <Loader className="w-4 h-4 mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              {liveTotalMinutes >= 480 ? "Submit Worklog" : "Review & Continue"}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              {step === 2 && (
                <div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setStep(1)} 
                    className="mb-4 -ml-4 text-gray-500 hover:text-gray-900"
                  >
                    <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Edit
                  </Button>

                  {needsAllocations ? (
                    <div className="space-y-5">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-amber-900">Missing Time Allocation</h3>
                            <p className="text-sm text-amber-700 mt-1">
                              You logged {formatMins(worklog.totalLoggedMinutes)} today, which is under the 8-hour target. 
                              Please specify reasons for the non-billable time.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {worklog.entries?.filter(e => e.nonBillableMinutes > 0).map(entry => {
                          const entryAllocs = allocations[entry._id] || [];
                          const totalAllocated = entryAllocs.reduce((sum, a) => sum + (a.minutes || 0), 0);
                          const remaining = entry.nonBillableMinutes - totalAllocated;
                          const projectName = typeof entry.project === "object" ? entry.project.name : "Unknown Project";

                          return (
                            <div key={entry._id} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h4 className="font-medium text-gray-900">{projectName}</h4>
                                  <p className="text-gray-500 text-xs mt-0.5">Requires {entry.nonBillableMinutes}m allocation</p>
                                </div>
                                <Badge variant="outline" className={`px-2 py-0.5 text-xs font-medium ${remaining === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                  {remaining === 0 ? "Perfectly Allocated" : `${remaining}m left`}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                {entryAllocs.map((alloc, idx) => {
                                  const selectedReasonObj = reasonsData?.data?.find((r: any) => r._id === alloc.reason);
                                  const showNoteField = selectedReasonObj?.requiresNote;

                                  return (
                                    <div key={idx} className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-100 rounded-lg shadow-sm">
                                      <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <Select 
                                          value={alloc.reason} 
                                          onValueChange={(val) => {
                                            setAllocations(prev => {
                                              const current = [...(prev[entry._id] || [])];
                                              current[idx] = { ...current[idx], reason: val || "", note: "" };
                                              return { ...prev, [entry._id]: current };
                                            });
                                          }}
                                        >
                                          <SelectTrigger className="flex-1 bg-white border-gray-200 shadow-sm focus:ring-primary-500">
                                            <SelectValue placeholder="Select Reason">
                                              {reasonsData?.data?.find((r: any) => r._id === alloc.reason)?.name || "Select Reason"}
                                            </SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            {reasonsData?.data?.map((reason: any) => (
                                              <SelectItem key={reason._id} value={reason._id}>
                                                <div className="flex items-center gap-2">
                                                  <span>{reason.name}</span>
                                                  {reason.requiresNote && <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-gray-100 text-gray-500">Note Required</Badge>}
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        
                                        <div className="w-full sm:w-32 flex items-center gap-2">
                                          <div className="relative w-full shadow-sm rounded-md">
                                            <Input 
                                              type="number" 
                                              className="bg-white border-gray-200 pr-7 text-center focus-visible:ring-primary-500"
                                              value={alloc.minutes} 
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setAllocations(prev => {
                                                  const current = [...(prev[entry._id] || [])];
                                                  current[idx] = { ...current[idx], minutes: val };
                                                  return { ...prev, [entry._id]: current };
                                                });
                                              }}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-semibold">min</span>
                                          </div>
                                        </div>
                                        
                                        <Button 
                                          type="button" 
                                          variant="ghost" 
                                          size="icon"
                                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0 h-10 w-10 border border-transparent hover:border-red-100 transition-colors"
                                          onClick={() => {
                                            setAllocations(prev => {
                                              const current = [...(prev[entry._id] || [])];
                                              current.splice(idx, 1);
                                              return { ...prev, [entry._id]: current };
                                            });
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      
                                      {showNoteField && (
                                        <div className="w-full animate-in fade-in slide-in-from-top-2 duration-200">
                                          <div className="relative">
                                            <Info className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input 
                                              placeholder="Provide a mandatory note for this reason..." 
                                              className="bg-white border-amber-200 pl-9 focus-visible:ring-amber-500 placeholder:text-gray-400"
                                              value={alloc.note || ""}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setAllocations(prev => {
                                                  const current = [...(prev[entry._id] || [])];
                                                  current[idx] = { ...current[idx], note: val };
                                                  return { ...prev, [entry._id]: current };
                                                });
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {remaining > 0 && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  className="mt-3 text-primary-600 hover:text-primary-700 hover:bg-primary-50 h-8 px-3 text-sm"
                                  onClick={() => {
                                    setAllocations(prev => {
                                      const current = prev[entry._id] || [];
                                      return {
                                        ...prev,
                                        [entry._id]: [...current, { reason: "", minutes: remaining > 0 ? remaining : 0 }]
                                      };
                                    });
                                  }}
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Split remaining {remaining}m
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-medium text-emerald-900 mb-1">Everything Looks Perfect!</h3>
                      <p className="text-sm text-emerald-700 max-w-md mx-auto">
                        {isOvertime 
                          ? `You've logged ${formatMins(worklog?.totalLoggedMinutes || 0)}, which includes overtime. No missing time allocations required.`
                          : "You've perfectly met your 8-hour target for today."}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
                    <Button 
                      type="button" 
                      onClick={onFinalSubmit}
                      disabled={submitWorklogMutation.isPending}
                      className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm px-6"
                    >
                      {submitWorklogMutation.isPending ? "Locking..." : "Submit & Lock Timesheet"}
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}




