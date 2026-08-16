"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { DATE_FORMATS, dayKey, formatDay, todayKey } from "@/lib/datetime";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useGetProjectsQuery } from "@/features/projects/api/projects.queries";
import { useGetMyWorklogByDateQuery } from "../api/worklogs.queries";
import {
  useSaveDraftMutation,
  useSubmitMissingReasonMutation,
  useSubmitWorklogMutation,
} from "../api/worklogs.mutations";
import { MAX_TASKS_PER_ENTRY, type SaveDraftPayload, type WorklogSubmission } from "../types";
import {
  STANDARD_WORK_MINUTES,
  clampNonProjectTime,
  combineMinutes,
  formatMinutes,
  validateDayBalance,
} from "../lib/day-balance";
import { TaskBreakdownFields, EMPTY_TASK } from "./task-breakdown-fields";
import { DayBudgetBar } from "./day-budget-bar";
import { NonProjectTimeCard } from "./non-project-time-card";
import { ProjectSelectCombobox } from "./project-select-combobox";
import { UnassignedNoteDialog } from "./unassigned-note-dialog";
import { DayResultPanel } from "./day-result-panel";
import {
  DayModeChooser,
  type DayMode,
  type WholeDayMode,
} from "./day-mode-chooser";

/* ==========================================================================
 * Form schema — mirrors the server's accepted shape, with the balance rule
 * checked by the same function the UI displays from.
 * ========================================================================== */

const entrySchema = z.object({
  project: z.string().min(1, "Pick a project"),
  hours: z.coerce.number().min(0).max(24),
  minutes: z.coerce.number().min(0).max(59),
  // Every entry carries a structured breakdown. The API wants exactly one of
  // description / tasks and this app always chooses tasks, so `description` is
  // not part of the form at all.
  tasks: z
    .array(
      z.object({
        module: z.string().trim().min(1, "Module is required").max(200),
        task: z.string().trim().min(1, "Task is required").max(500),
        difficulty: z.enum(["LOW", "MEDIUM", "HIGH"]),
      }),
    )
    .min(1, "Add at least one task")
    .max(MAX_TASKS_PER_ENTRY, `Up to ${MAX_TASKS_PER_ENTRY} tasks per project`),
});

/**
 * Built per-user rather than at module scope: the balance message wording
 * depends on whether this user can log lead work, and non-Leads must never see
 * the term.
 */
const makeComposerSchema = (canLogLeadWork: boolean) =>
  z
    .object({
      entries: z.array(entrySchema).default([]),
      freeMinutes: z.coerce.number().min(0).default(0),
      leadWorkMinutes: z.coerce.number().min(0).default(0),
    })
    .superRefine((values, ctx) => {
      // Every row that exists must carry time — a blank row is a user mistake.
      values.entries.forEach((entry, index) => {
        if (combineMinutes(entry.hours, entry.minutes) <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Add some time",
            path: ["entries", index, "minutes"],
          });
        }
      });

      const balance = validateDayBalance({
        entries: values.entries.map((entry) => ({
          project: entry.project,
          minutes: combineMinutes(entry.hours, entry.minutes),
        })),
        freeMinutes: values.freeMinutes,
        leadWorkMinutes: values.leadWorkMinutes,
        canLogLeadWork,
      });

      if (!balance.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: balance.message,
          // Matches where the API reports balance failures, so server-side and
          // client-side rejections surface in the same place.
          path: ["freeMinutes"],
        });
      }
    });

type ComposerValues = z.input<ReturnType<typeof makeComposerSchema>>;

const blankEntry = () => ({
  project: "",
  hours: 0,
  minutes: 0,
  tasks: [{ ...EMPTY_TASK }],
});

/* ==========================================================================
 * Composer
 * ========================================================================== */

export function DayComposer({
  shiftDate,
  /** Set when backfilling a past day through the missing-entry flow. */
  missingReason,
  onCompleted,
}: {
  shiftDate: string;
  missingReason?: "forgot";
  onCompleted?: () => void;
}) {
  const { isLead } = useAuth();

  const day = dayKey(shiftDate) || todayKey();
  const isToday = day === todayKey();

  /* ── Projects (search is local when the whole list fits in one page) ───── */

  const [projectSearch, setProjectSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [allProjectsMap, setAllProjectsMap] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(projectSearch), 300);
    return () => clearTimeout(timer);
  }, [projectSearch]);

  const { data: initialProjectsData } = useGetProjectsQuery({
    availableForLogging: true,
    limit: 100,
  });
  const totalProjects = initialProjectsData?.pagination?.totalItems ?? 0;
  const isAllProjectsLoaded = initialProjectsData?.pagination
    ? totalProjects <= 100
    : false;

  const { data: projectsData, isLoading: isProjectsLoading } = useGetProjectsQuery({
    availableForLogging: true,
    limit: 100,
    search: isAllProjectsLoaded ? undefined : debouncedSearch || undefined,
  });

  useEffect(() => {
    if (!projectsData?.data) return;
    setAllProjectsMap((prev) => {
      const next = new Map(prev);
      projectsData.data.forEach((p: any) => next.set(p._id, p));
      return next;
    });
  }, [projectsData]);

  /* ── Server state ──────────────────────────────────────────────────────── */

  const {
    data: worklogResponse,
    isLoading: isLoadingWorklog,
    refetch,
  } = useGetMyWorklogByDateQuery(day);

  const worklog = worklogResponse?.data ?? null;
  const isSubmitted = worklog?.status === "submitted";

  const saveDraftMutation = useSaveDraftMutation();
  const submitWorklogMutation = useSubmitWorklogMutation();
  const submitMissingReasonMutation = useSubmitMissingReasonMutation();

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"draft" | "submit" | null>(null);

  /**
   * null = the chooser has not been answered yet. A day that already has
   * something saved answers it implicitly, so returning to a draft never
   * re-asks the question.
   */
  const [mode, setMode] = useState<DayMode | null>(null);

  /* ── Form ──────────────────────────────────────────────────────────────── */

  const composerSchema = useMemo(() => makeComposerSchema(isLead), [isLead]);

  const form = useForm<ComposerValues>({
    resolver: zodResolver(composerSchema) as any,
    mode: "onChange",
    defaultValues: {
      entries: [blankEntry()],
      freeMinutes: 0,
      leadWorkMinutes: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  });

  const watchedEntries = useWatch({ control: form.control, name: "entries" }) ?? [];
  const watchedFree = Number(useWatch({ control: form.control, name: "freeMinutes" })) || 0;
  const watchedLead =
    Number(useWatch({ control: form.control, name: "leadWorkMinutes" })) || 0;

  const balance = useMemo(
    () =>
      validateDayBalance({
        entries: (watchedEntries as any[]).map((entry) => ({
          project: entry?.project,
          minutes: combineMinutes(entry?.hours, entry?.minutes),
        })),
        freeMinutes: watchedFree,
        leadWorkMinutes: watchedLead,
        canLogLeadWork: isLead,
      }),
    [watchedEntries, watchedFree, watchedLead, isLead],
  );

  /**
   * Keep non-project time inside the day as project hours grow.
   *
   * Someone logs 2h, marks the remaining 6h free, then realises they actually
   * worked 5h. Rather than rejecting the day as unbalanced, the free time
   * shrinks to fit the 3h that is left. Free is reduced first because it is the
   * residual bucket — lead work is a deliberate categorisation and is only
   * touched once free has reached zero.
   *
   * When a full day is logged to projects there is no room left at all, so both
   * drop to zero and NonProjectTimeCard disables itself.
   */
  useEffect(() => {
    const next = clampNonProjectTime(watchedFree, watchedLead, balance.deficit);

    if (next.freeMinutes !== watchedFree) {
      form.setValue("freeMinutes", next.freeMinutes, { shouldValidate: true });
    }
    if (next.leadWorkMinutes !== watchedLead) {
      form.setValue("leadWorkMinutes", next.leadWorkMinutes, { shouldValidate: true });
    }
  }, [balance.deficit, watchedFree, watchedLead, form]);

  // Hydrate from a saved draft.
  useEffect(() => {
    if (!worklogResponse) return;

    if (!worklog) {
      form.reset({
        entries: [blankEntry()],
        freeMinutes: 0,
        leadWorkMinutes: 0,
      });
      return;
    }

    const entries = (worklog.entries || []).map((entry: any) => {
      return {
        project: typeof entry.project === "string" ? entry.project : entry.project?._id,
        hours: Math.floor((entry.loggedMinutes ?? 0) / 60),
        minutes: (entry.loggedMinutes ?? 0) % 60,
        // Pre-existing entries may carry a legacy freeform description instead
        // of tasks; those reopen with a blank row to fill in, since the API no
        // longer accepts a description alongside a breakdown.
        tasks:
          entry.tasks && entry.tasks.length > 0
            ? entry.tasks.map((t: any) => ({
                module: t.module ?? "",
                task: t.task ?? "",
                difficulty: t.difficulty ?? "LOW",
              }))
            : [{ ...EMPTY_TASK }],
      };
    });

    form.reset({
      entries: entries.length > 0 ? entries : [blankEntry()],
      freeMinutes: worklog.freeMinutes ?? 0,
      leadWorkMinutes: worklog.leadWorkMinutes ?? 0,
    });

    // A saved day has already answered the chooser — infer which way.
    setMode(
      entries.length > 0
        ? "projects"
        : (worklog.leadWorkMinutes ?? 0) > 0
          ? "leadWork"
          : "free",
    );
  }, [worklogResponse, worklog, form]);

  /** Answer the chooser and seed the form for that shape of day. */
  const chooseMode = (next: DayMode) => {
    if (next === "projects") {
      form.reset({
        entries: [blankEntry()],
        freeMinutes: 0,
        leadWorkMinutes: 0,
      });
    } else {
      // A whole day with no project work: the chosen bucket carries all 480.
      form.reset({
        entries: [],
        freeMinutes: next === "free" ? STANDARD_WORK_MINUTES : 0,
        leadWorkMinutes: next === "leadWork" ? STANDARD_WORK_MINUTES : 0,
      });
    }
    setMode(next);
  };

  /* ── Payload ───────────────────────────────────────────────────────────── */

  const buildPayload = (values: ComposerValues): SaveDraftPayload => ({
    shiftDate: day,
    entries: (values.entries ?? []).map((entry: any) => ({
      project: entry.project,
      minutes: combineMinutes(entry.hours, entry.minutes),
      tasks: (entry.tasks ?? []).map((t: any) => ({
        module: String(t.module ?? "").trim().toUpperCase(),
        task: String(t.task ?? "").trim(),
        difficulty: t.difficulty,
      })),
    })),
    freeMinutes: Number(values.freeMinutes) || 0,
    leadWorkMinutes: Number(values.leadWorkMinutes) || 0,
  });

  const handleError = (error: any) => {
    setPendingAction(null);
    toast.error(error?.message || "Something went wrong. Please try again.");
  };

  /** Save without locking the day. */
  const onSaveDraft = form.handleSubmit((values) => {
    setPendingAction("draft");
    saveDraftMutation.mutate(buildPayload(values as ComposerValues), {
      onSuccess: () => {
        setPendingAction(null);
        toast.success("Draft saved.");
        refetch();
      },
      onError: handleError,
    });
  });

  /**
   * Save, then lock. A backfill of a past day goes through the missing-entry
   * endpoint instead, which auto-submits unless it leaves unassigned time.
   */
  const saveAndSubmit = (payload: SaveDraftPayload) => {
    setPendingAction("submit");

    if (missingReason === "forgot") {
      submitMissingReasonMutation.mutate(
        {
          shiftDate: day,
          reason: "forgot",
          entries: payload.entries,
          freeMinutes: payload.freeMinutes,
          leadWorkMinutes: payload.leadWorkMinutes,
        },
        {
          onSuccess: (response: any) => {
            setPendingAction(null);
            const unassigned =
              response?.data?.unassignedNonBillableMinutes ??
              response?.data?.submission?.unassignedNonBillableMinutes ??
              0;
            if (unassigned > 0) {
              refetch();
              setNoteDialogOpen(true);
              return;
            }
            refetch();
            onCompleted?.();
          },
          onError: handleError,
        },
      );
      return;
    }

    saveDraftMutation.mutate(payload, {
      onSuccess: (response) => {
        const unassigned = response?.data?.unassignedNonBillableMinutes ?? 0;
        if (unassigned > 0) {
          setPendingAction(null);
          refetch();
          setNoteDialogOpen(true);
          return;
        }
        submitDay();
      },
      onError: handleError,
    });
  };

  const onSaveAndSubmit = form.handleSubmit((values) =>
    saveAndSubmit(buildPayload(values as ComposerValues)),
  );

  /**
   * Submit a whole day of non-project time straight from the chooser. There is
   * nothing else to collect, so this skips the composer entirely — the
   * confirmation lives in the chooser, since submitting locks the day.
   */
  const submitWholeDay = (wholeDayMode: WholeDayMode) => {
    // Deliberately does not set `mode`: the chooser stays mounted for the whole
    // request, so its dialog can show progress, and a failure leaves the user
    // exactly where they were with the error toast — nothing half-applied.
    // On success the refetched submission drives the switch to the locked view.
    saveAndSubmit({
      shiftDate: day,
      entries: [],
      freeMinutes: wholeDayMode === "free" ? STANDARD_WORK_MINUTES : 0,
      leadWorkMinutes: wholeDayMode === "leadWork" ? STANDARD_WORK_MINUTES : 0,
    });
  };

  const submitDay = (unassignedNonBillableNote?: string) => {
    setPendingAction("submit");
    submitWorklogMutation.mutate(
      { shiftDate: day, ...(unassignedNonBillableNote ? { unassignedNonBillableNote } : {}) },
      {
        onSuccess: () => {
          setPendingAction(null);
          setNoteDialogOpen(false);
          refetch();
          onCompleted?.();
        },
        onError: handleError,
      },
    );
  };

  /* ── Render ────────────────────────────────────────────────────────────── */

  if (isLoadingWorklog) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-6 h-6 text-primary-600" />
      </div>
    );
  }

  if (isSubmitted && worklog) {
    return (
      <SubmittedDay worklog={worklog} day={day} />
    );
  }

  // Nothing saved yet and no answer given — ask before showing any form.
  if (mode === null) {
    return (
      <DayModeChooser
        shiftDate={day}
        canLogLeadWork={isLead}
        isSubmitting={pendingAction === "submit"}
        onChooseProjects={() => chooseMode("projects")}
        onSubmitWholeDay={submitWholeDay}
      />
    );
  }

  const isBusy = pendingAction !== null;
  const projects = projectsData?.data ?? [];
  const isNonProjectDay = mode === "free" || mode === "leadWork";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <ComposerHeader day={day} isToday={isToday} isDraft={worklog?.status === "draft"} />

      <Card className="p-5 sm:p-6 shadow-sm border-gray-200 rounded-xl bg-white">
        <DayBudgetBar
          balance={balance}
          freeMinutes={watchedFree}
          leadWorkMinutes={watchedLead}
        />
      </Card>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          {isNonProjectDay ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <p className="text-sm text-gray-700">
                {mode === "free"
                  ? "Recording a full free day — no project work."
                  : "Recording a full day of lead work — no project work."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => chooseMode("projects")}
                disabled={isBusy}
                className="h-8 text-xs font-medium shrink-0"
              >
                I did work on a project
              </Button>
            </div>
          ) : (
            <Card className="p-5 sm:p-6 shadow-sm border-gray-200 rounded-xl bg-white space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary-600" />
                    Project time
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    What you worked on today. This is always billable.
                  </p>
                </div>
                <span className="text-xs text-gray-500 tabular-nums shrink-0">
                  {formatMinutes(balance.loggedMinutes)} logged
                </span>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <EntryRow
                    key={field.id}
                    index={index}
                    form={form}
                    projects={projects}
                    allProjectsMap={allProjectsMap}
                    isProjectsLoading={isProjectsLoading}
                    isAllProjectsLoaded={isAllProjectsLoaded}
                    projectSearch={projectSearch}
                    onProjectSearch={setProjectSearch}
                    watchedEntries={watchedEntries as any[]}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append(blankEntry() as any)}
                  className="h-8 text-xs font-medium border-dashed border-gray-300 text-gray-600 hover:text-primary-700 hover:border-primary-300"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add project
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode(null)}
                  disabled={isBusy}
                  className="h-8 text-xs font-medium text-gray-500 hover:text-gray-800"
                >
                  I had no project work today
                </Button>
              </div>
            </Card>
          )}

          <NonProjectTimeCard
            freeMinutes={watchedFree}
            leadWorkMinutes={watchedLead}
            onFreeChange={(minutes) =>
              form.setValue("freeMinutes", minutes, { shouldValidate: true })
            }
            onLeadWorkChange={(minutes) =>
              form.setValue("leadWorkMinutes", minutes, { shouldValidate: true })
            }
            balance={balance}
            canLogLeadWork={isLead}
            disabled={isBusy}
          />

          {!balance.valid && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  This day doesn&apos;t add up yet
                </p>
                <p className="text-xs text-red-700 mt-0.5">{balance.message}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={isBusy || !balance.valid}
              className="h-10"
            >
              {pendingAction === "draft" ? (
                <Loader className="w-4 h-4 mr-2" />
              ) : null}
              Save draft
            </Button>
            <Button
              type="button"
              onClick={onSaveAndSubmit}
              disabled={isBusy || !balance.valid}
              className="h-10 bg-primary-600 hover:bg-primary-700 text-white min-w-[160px]"
            >
              {pendingAction === "submit" ? (
                <Loader className="w-4 h-4 mr-2" />
              ) : null}
              Submit day
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </Form>

      <UnassignedNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        minutes={worklog?.unassignedNonBillableMinutes ?? 0}
        isSubmitting={pendingAction === "submit"}
        onConfirm={(note) => submitDay(note)}
      />
    </div>
  );
}

/* ==========================================================================
 * Pieces
 * ========================================================================== */

function ComposerHeader({
  day,
  isToday,
  isDraft,
}: {
  day: string;
  isToday: boolean;
  isDraft?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {isToday ? "Today's worklog" : "Worklog"}
        </h2>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-600" />
          {formatDay(day, DATE_FORMATS.DAY_FULL)}
        </p>
      </div>
      {isDraft && (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 font-medium"
        >
          Draft — not submitted
        </Badge>
      )}
    </div>
  );
}

function EntryRow({
  index,
  form,
  projects,
  allProjectsMap,
  isProjectsLoading,
  isAllProjectsLoaded,
  projectSearch,
  onProjectSearch,
  watchedEntries,
  onRemove,
  canRemove,
}: any) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
        <div className="flex-1 min-w-0">
          <FormField
            control={form.control}
            name={`entries.${index}.project`}
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormControl>
                  <ProjectSelectCombobox
                    value={field.value}
                    onChange={field.onChange}
                    watchedEntries={watchedEntries}
                    currentIndex={index}
                    projects={projects}
                    allProjectsMap={allProjectsMap}
                    isLoading={isProjectsLoading}
                    searchQuery={projectSearch}
                    onSearchChange={onProjectSearch}
                    isAllProjectsLoaded={isAllProjectsLoaded}
                  />
                </FormControl>
                <FormMessage className="text-[11px] font-normal" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-start gap-1.5 shrink-0">
          <FormField
            control={form.control}
            name={`entries.${index}.hours`}
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={24}
                    inputMode="numeric"
                    aria-label="Hours"
                    placeholder="0"
                    className="w-16 h-10 text-center text-sm font-semibold tabular-nums bg-white border-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...field}
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <span className="text-xs text-gray-400 font-medium pt-3">h</span>
          <FormField
            control={form.control}
            name={`entries.${index}.minutes`}
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    inputMode="numeric"
                    aria-label="Minutes"
                    placeholder="0"
                    className="w-16 h-10 text-center text-sm font-semibold tabular-nums bg-white border-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...field}
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage className="text-[11px] font-normal" />
              </FormItem>
            )}
          />
          <span className="text-xs text-gray-400 font-medium pt-3">m</span>

          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="w-9 h-10 text-gray-300 hover:text-red-500 hover:bg-red-50"
              aria-label="Remove project"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <TaskBreakdownFields control={form.control} entryIndex={index} />
    </div>
  );
}

function SubmittedDay({
  worklog,
  day,
}: {
  worklog: WorklogSubmission;
  day: string;
}) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Worklog submitted</h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-600" />
            {formatDay(day, DATE_FORMATS.DAY_FULL)}
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Locked
        </Badge>
      </div>

      <DayResultPanel worklog={worklog} />

      <p className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
        This day is locked. Ask an admin or lead to reset it if something needs
        correcting.
      </p>
    </div>
  );
}
