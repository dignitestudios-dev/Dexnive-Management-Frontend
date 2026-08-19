"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next-nprogress-bar";
import { Boxes, Briefcase, Info, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appNow } from "@/lib/datetime";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useGetCategoryModuleBreakdownQuery } from "@/features/reports/api/reports.queries";
import type {
  CategoryModuleCount,
  CategoryModuleUserRow,
} from "@/features/reports/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Which projects, categories and modules people worked on.
 *
 * Counts of entries and distinct days, never hours — minutes are tracked per
 * project entry and there is no per-category split, so presenting time here
 * would be inventing it.
 */
export default function CategoryModuleReportPage() {
  const router = useRouter();
  const { isFullManager, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && !isFullManager) {
      router.push("/dashboard");
    }
  }, [isInitialized, isFullManager, router]);

  const now = appNow();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const years = Array.from({ length: Math.max(1, year - 2025 + 1) }, (_, i) => 2025 + i);

  const { data, isLoading } = useGetCategoryModuleBreakdownQuery({ month, year });
  // Rows are nested under `result`; `data` itself also carries the resolved
  // range, matching the hours-breakdown envelope.
  const rows = data?.data?.result ?? [];

  if (!isInitialized || !isFullManager) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-6 h-6 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="w-full p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Category &amp; Module Breakdown
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              What each person worked on, by project, category and module.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={String(month)}
              onValueChange={(value) => value && setMonth(Number(value))}
            >
              <SelectTrigger className="w-36 h-9 bg-white">
                {/* Value is the month number; show its name. */}
                <SelectValue>
                  {(value) => MONTHS[Number(value) - 1] ?? "Month"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((label, index) => (
                  <SelectItem key={label} value={String(index + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(year)}
              onValueChange={(value) => value && setYear(Number(value))}
            >
              <SelectTrigger className="w-24 h-9 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
          Counts of entries and days worked. Hours are tracked per project, not per
          category or module, so no time is shown here.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-6 h-6 text-primary-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed rounded-xl bg-gray-50/50">
            <Layers className="w-8 h-8 mb-2 text-gray-400" />
            <p className="text-sm">Nothing logged for this month</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <UserCard key={row.user._id} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({ row }: { row: CategoryModuleUserRow }) {
  return (
    <Card className="shadow-sm border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <h2 className="text-sm font-semibold text-gray-900">{row.user.name}</h2>
        <p className="text-xs text-gray-500">{row.user.email}</p>
      </div>

      <div className="divide-y divide-gray-100">
        {row.projects.map((project) => (
          <div key={project.project._id} className="p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <Briefcase className="w-4 h-4 text-primary-600 shrink-0" />
                <span className="font-medium text-gray-900 text-sm truncate">
                  {project.project.name}
                </span>
                {project.project.code && (
                  <span className="text-xs text-gray-400 shrink-0">
                    {project.project.code}
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-500 tabular-nums shrink-0">
                {project.entryCount} {project.entryCount === 1 ? "entry" : "entries"} ·{" "}
                {project.daysTouched} {project.daysTouched === 1 ? "day" : "days"}
              </span>
            </div>

            <CountGroup
              icon={<Layers className="w-3 h-3" />}
              label="Categories"
              items={project.categories}
              className="bg-primary-50 text-primary-700 border-primary-100"
            />
            <CountGroup
              icon={<Boxes className="w-3 h-3" />}
              label="Modules"
              items={project.modules}
              className="bg-violet-50 text-violet-700 border-violet-100"
              emptyHint="No modules — this department logs descriptions only."
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function CountGroup({
  icon,
  label,
  items,
  className,
  emptyHint,
}: {
  icon: React.ReactNode;
  label: string;
  items: CategoryModuleCount[];
  className: string;
  emptyHint?: string;
}) {
  if (items.length === 0) {
    return emptyHint ? (
      <p className="text-[11px] text-gray-400 italic">{emptyHint}</p>
    ) : null;
  }

  return (
    <div>
      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1 mb-1.5">
        {icon}
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge
            key={item._id}
            variant="outline"
            className={`text-[11px] font-medium px-2 py-0.5 gap-1.5 ${className}`}
          >
            {item.name ?? "Unnamed"}
            <span className="tabular-nums opacity-70">
              {item.entryCount}× · {item.daysTouched}d
            </span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
