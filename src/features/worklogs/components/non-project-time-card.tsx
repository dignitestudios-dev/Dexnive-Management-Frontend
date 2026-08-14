"use client";

import React from "react";
import { Coffee, Info, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  STANDARD_WORK_MINUTES,
  combineMinutes,
  formatMinutes,
  splitMinutes,
  type DayBalanceResult,
} from "../lib/day-balance";

/**
 * Free time and lead work — the two day-level inputs that carve time out of the
 * day's deficit before the rest auto-fills as non-billable.
 *
 * These are minute amounts, not toggles: a day can be part project work, part
 * free and part lead work at the same time. The Lead Work field is only
 * rendered for Leads (the API 400s anyone else who sends it above zero).
 */
export function NonProjectTimeCard({
  freeMinutes,
  leadWorkMinutes,
  onFreeChange,
  onLeadWorkChange,
  balance,
  canLogLeadWork,
  disabled,
}: {
  freeMinutes: number;
  leadWorkMinutes: number;
  onFreeChange: (minutes: number) => void;
  onLeadWorkChange: (minutes: number) => void;
  balance: DayBalanceResult;
  canLogLeadWork: boolean;
  disabled?: boolean;
}) {
  const locked = disabled || balance.nonProjectLocked;

  // How much this field could still absorb, given the other one's current value.
  const headroomFor = (other: number) => Math.max(0, balance.deficit - other);

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-gray-50/60 p-4 transition-opacity",
        locked && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Non-project time</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Time that wasn&apos;t spent on a client project.
          </p>
        </div>
        {balance.deficit > 0 && !locked && (
          <span className="text-[11px] text-gray-500 shrink-0 text-right">
            up to{" "}
            <span className="font-semibold text-gray-700 tabular-nums">
              {formatMinutes(balance.deficit)}
            </span>
          </span>
        )}
      </div>

      {locked ? (
        <p className="flex items-start gap-2 text-xs text-gray-600 bg-white rounded-lg border border-gray-200 p-2.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
          A full day is already logged to projects, so there&apos;s no non-project time
          to record.
        </p>
      ) : (
        <div className="space-y-3">
          <DurationField
            icon={<Coffee className="w-3.5 h-3.5" />}
            label="Free time"
            hint="No project work assigned"
            value={freeMinutes}
            max={headroomFor(leadWorkMinutes)}
            onChange={onFreeChange}
            accent="sky"
          />

          {canLogLeadWork && (
            <DurationField
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              label="Lead work"
              hint="Internal lead duties, not billed to a project"
              value={leadWorkMinutes}
              max={headroomFor(freeMinutes)}
              onChange={onLeadWorkChange}
              accent="violet"
            />
          )}
        </div>
      )}
    </div>
  );
}

const ACCENTS = {
  sky: { dot: "bg-sky-500", chip: "hover:border-sky-300 hover:text-sky-700" },
  violet: { dot: "bg-violet-500", chip: "hover:border-violet-300 hover:text-violet-700" },
} as const;

/**
 * Hours + minutes pair with quick-fill chips. Chips are the fast path — most
 * days are "the rest of the day" or a round half/full day.
 */
function DurationField({
  icon,
  label,
  hint,
  value,
  max,
  onChange,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: number;
  max: number;
  onChange: (minutes: number) => void;
  accent: keyof typeof ACCENTS;
}) {
  const { hours, minutes } = splitMinutes(value);
  const styles = ACCENTS[accent];

  const setPart = (nextHours: number, nextMinutes: number) => {
    onChange(Math.min(combineMinutes(nextHours, nextMinutes), max));
  };

  const chips = [
    { label: "Half day", minutes: STANDARD_WORK_MINUTES / 2 },
    { label: "Full day", minutes: STANDARD_WORK_MINUTES },
    { label: "Rest of day", minutes: max },
  ].filter((chip) => chip.minutes > 0 && chip.minutes <= max);

  return (
    <div className="rounded-lg bg-white border border-gray-200 p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("w-2.5 h-2.5 rounded-sm shrink-0", styles.dot)} />
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              {icon}
              {label}
            </span>
            <span className="text-[11px] text-gray-500 block truncate">{hint}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <NumberBox
            aria-label={`${label} hours`}
            value={hours}
            min={0}
            max={Math.floor(max / 60)}
            onChange={(next) => setPart(next, minutes)}
          />
          <span className="text-xs text-gray-400 font-medium">h</span>
          <NumberBox
            aria-label={`${label} minutes`}
            value={minutes}
            min={0}
            max={59}
            onChange={(next) => setPart(hours, next)}
          />
          <span className="text-xs text-gray-400 font-medium">m</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <Button
            key={chip.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(chip.minutes)}
            className={cn(
              "h-6 px-2 text-[11px] font-medium rounded-full border-gray-200 text-gray-600 bg-white",
              styles.chip,
            )}
          >
            {chip.label}
            <span className="ml-1 text-gray-400 tabular-nums">
              {formatMinutes(chip.minutes)}
            </span>
          </Button>
        ))}
        {value > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(0)}
            className="h-6 px-2 text-[11px] font-medium text-gray-400 hover:text-gray-700"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function NumberBox({
  value,
  min,
  max,
  onChange,
  ...rest
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "min" | "max" | "onChange">) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={value === 0 ? "" : String(value)}
      placeholder="0"
      onChange={(e) => {
        const parsed = parseInt(e.target.value, 10);
        onChange(Number.isNaN(parsed) ? 0 : Math.max(min, Math.min(parsed, max)));
      }}
      className="w-14 h-9 text-center text-sm font-semibold tabular-nums bg-white border-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      {...rest}
    />
  );
}
