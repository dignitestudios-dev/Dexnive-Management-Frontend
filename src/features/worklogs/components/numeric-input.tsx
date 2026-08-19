"use client";

import React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A whole-number field for durations.
 *
 * Deliberately `type="text"` rather than `type="number"`. A number input lets
 * the mouse wheel silently change a value the user is only scrolling past, and
 * accepts `e`, `+`, `-` and `.` because it parses scientific notation — neither
 * is wanted for a count of hours or minutes.
 *
 * Non-digits are stripped as they are typed, and the value is clamped to
 * [min, max] on blur rather than on every keystroke, so typing "15" into a
 * field capped at 59 isn't rewritten to "5" the moment "1" is entered.
 *
 * `inputMode="numeric"` keeps the numeric keypad on mobile.
 */
export function NumericInput({
  value,
  onChange,
  min = 0,
  max,
  className,
  ...rest
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
} & Omit<
  React.ComponentProps<typeof Input>,
  "value" | "min" | "max" | "onChange" | "type"
>) {
  const clamp = (n: number) => Math.max(min, Math.min(n, max));

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      // Blank rather than a literal 0, so the placeholder shows and the user
      // doesn't have to clear a zero before typing.
      value={value === 0 ? "" : String(value)}
      placeholder="0"
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        if (digits === "") {
          onChange(0);
          return;
        }
        // Cap length so a long paste can't produce an absurd intermediate value.
        onChange(Math.min(Number(digits.slice(0, 4)), max));
      }}
      onBlur={(e) => {
        onChange(clamp(Number(e.target.value.replace(/\D/g, "") || 0)));
        rest.onBlur?.(e);
      }}
      className={cn(
        "text-center text-sm font-semibold tabular-nums bg-white border-gray-200",
        className,
      )}
      {...rest}
    />
  );
}
