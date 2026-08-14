"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  STANDARD_WORK_MINUTES,
  formatMinutes,
  type DayBalanceResult,
} from "../lib/day-balance";

/**
 * The 8-hour day rendered as a budget that has to fill up.
 *
 * The visual grammar carries the rule so the user doesn't have to read it:
 *   solid  = time the user controls (project work, free, lead work)
 *   hatched = non-billable, which the server derives from what's left over
 *   beyond the 8h marker = overtime
 *
 * Everything shown here comes from validateDayBalance() — this component does
 * no arithmetic of its own.
 */
export function DayBudgetBar({
  balance,
  freeMinutes,
  leadWorkMinutes,
  className,
}: {
  balance: DayBalanceResult;
  freeMinutes: number;
  leadWorkMinutes: number;
  className?: string;
}) {
  const { loggedMinutes, remaining, case: dayCase } = balance;

  const isOvertime = dayCase === "overtime";
  const overtimeMinutes = Math.max(0, loggedMinutes - STANDARD_WORK_MINUTES);

  // On an overtime day the track represents the whole logged span, so the 8h
  // marker sits proportionally rather than at the far right.
  const trackTotal = isOvertime ? loggedMinutes : STANDARD_WORK_MINUTES;
  const pct = (value: number) => (trackTotal > 0 ? (value / trackTotal) * 100 : 0);

  const billableWidth = pct(Math.min(loggedMinutes, STANDARD_WORK_MINUTES));
  const freeWidth = pct(freeMinutes);
  const leadWidth = pct(leadWorkMinutes);
  const derivedWidth = pct(remaining);
  const overtimeWidth = pct(overtimeMinutes);

  const isComplete = balance.valid && remaining === 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between mb-2 gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Your day
        </span>
        <StatusLine balance={balance} />
      </div>

      <div className="relative">
        <div
          className="relative h-9 w-full rounded-lg bg-gray-100 overflow-hidden flex ring-1 ring-inset ring-gray-200"
          role="img"
          aria-label={[
            `${formatMinutes(loggedMinutes)} logged to projects`,
            freeMinutes > 0 ? `${formatMinutes(freeMinutes)} free` : null,
            leadWorkMinutes > 0
              ? `${formatMinutes(leadWorkMinutes)} lead work`
              : null,
            `${formatMinutes(remaining)} still to account for`,
          ]
            .filter(Boolean)
            .join(", ")}
        >
        <Segment
          width={billableWidth}
          className="bg-primary-600"
          label={formatMinutes(Math.min(loggedMinutes, STANDARD_WORK_MINUTES))}
        />
        <Segment width={freeWidth} className="bg-sky-500" label={formatMinutes(freeMinutes)} />
        <Segment
          width={leadWidth}
          className="bg-violet-500"
          label={formatMinutes(leadWorkMinutes)}
        />
        {/* Derived, not chosen — hatched so it reads as consequence, not input. */}
        <Segment
          width={derivedWidth}
          className="bg-amber-400/70 [background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.55)_4px,rgba(255,255,255,0.55)_8px)]"
          label={formatMinutes(remaining)}
          labelClassName="text-amber-950"
        />
        <Segment
          width={overtimeWidth}
          className="bg-orange-600"
          label={formatMinutes(overtimeMinutes)}
        />

          {/* Boundary between a standard day and overtime. */}
          {isOvertime && (
            <div
              className="absolute inset-y-0 w-px bg-white/80 shadow-[0_0_0_1px_rgba(17,24,39,0.55)]"
              style={{ left: `${pct(STANDARD_WORK_MINUTES)}%` }}
              aria-hidden
            />
          )}
        </div>

        {/* Marker label sits below the track: the bar itself is overflow-hidden
            (to clip the rounded segment corners), so anything inside it gets cut off. */}
        {isOvertime && (
          <span
            className="absolute top-full mt-1 -translate-x-1/2 text-[10px] font-semibold text-gray-500 whitespace-nowrap"
            style={{ left: `${pct(STANDARD_WORK_MINUTES)}%` }}
            aria-hidden
          >
            8h
          </span>
        )}
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-x-4 gap-y-1.5",
          isOvertime ? "mt-6" : "mt-2.5",
        )}
      >
        {loggedMinutes > 0 && (
          <Legend className="bg-primary-600" label="Project time" value={Math.min(loggedMinutes, STANDARD_WORK_MINUTES)} />
        )}
        {freeMinutes > 0 && <Legend className="bg-sky-500" label="Free" value={freeMinutes} />}
        {leadWorkMinutes > 0 && (
          <Legend className="bg-violet-500" label="Lead work" value={leadWorkMinutes} />
        )}
        {remaining > 0 && (
          <Legend
            className="bg-amber-400/70"
            label="Non-billable (auto)"
            value={remaining}
            hint="Calculated by the system and spread across your projects"
          />
        )}
        {overtimeMinutes > 0 && (
          <Legend className="bg-orange-600" label="Overtime" value={overtimeMinutes} />
        )}
        {isComplete && loggedMinutes === 0 && freeMinutes === 0 && leadWorkMinutes === 0 && (
          <span className="text-xs text-gray-400">Nothing logged yet</span>
        )}
      </div>
    </div>
  );
}

function Segment({
  width,
  className,
  label,
  labelClassName,
}: {
  width: number;
  className: string;
  label: string;
  labelClassName?: string;
}) {
  if (width <= 0) return null;
  return (
    <div
      className={cn(
        "h-full flex items-center justify-center transition-[width] duration-300 ease-out overflow-hidden",
        className,
      )}
      style={{ width: `${width}%` }}
      title={label}
    >
      {/* Only label a segment wide enough to hold text without clipping. */}
      {width > 12 && (
        <span
          className={cn(
            "text-[11px] font-semibold text-white whitespace-nowrap px-1",
            labelClassName,
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function Legend({
  className,
  label,
  value,
  hint,
}: {
  className: string;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-gray-600" title={hint}>
      <span className={cn("w-2.5 h-2.5 rounded-sm shrink-0", className)} />
      <span className="font-medium text-gray-700">{label}</span>
      <span className="text-gray-500 tabular-nums">{formatMinutes(value)}</span>
    </span>
  );
}

/** The single most important line on the screen: what's left, or what's wrong. */
function StatusLine({ balance }: { balance: DayBalanceResult }) {
  if (!balance.valid) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 text-right">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {balance.message}
      </span>
    );
  }

  if (balance.case === "overtime") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
        <Zap className="w-3.5 h-3.5 shrink-0" />
        {formatMinutes(balance.loggedMinutes - STANDARD_WORK_MINUTES)} overtime
      </span>
    );
  }

  if (balance.remaining > 0) {
    return (
      <span className="text-xs text-gray-500">
        <span className="font-semibold text-amber-700 tabular-nums">
          {formatMinutes(balance.remaining)}
        </span>{" "}
        will be logged as non-billable
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      Full day accounted for
    </span>
  );
}
