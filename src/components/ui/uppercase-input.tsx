"use client";

import React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A text field that only ever holds uppercase.
 *
 * Used for category and module names, which are compared as exact strings —
 * "Auth" and "AUTH" would otherwise become two entries meaning the same thing.
 * Categories are already uppercased server-side, so typing lowercase there
 * produced a value that silently differed from what came back; modules are not
 * normalised by the API at all, which makes doing it here the only guard.
 *
 * Transforms on the way in rather than only styling with `uppercase`, so what
 * is submitted matches what is displayed.
 */
export function UppercaseInput({
  value,
  onChange,
  className,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      autoCapitalize="characters"
      autoCorrect="off"
      spellCheck={false}
      className={cn("uppercase", className)}
      {...rest}
    />
  );
}
