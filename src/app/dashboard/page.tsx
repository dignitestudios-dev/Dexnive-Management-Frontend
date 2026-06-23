"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { DailyWorklog } from "@/features/worklogs/components/daily-worklog";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          {(() => {
            const hour = new Date().getHours();
            if (hour < 12) return "Good Morning";
            if (hour < 17) return "Good Afternoon";
            if (hour < 21) return "Good Evening";
            return "Good Night";
          })()}{user?.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-gray-500 mb-8">
          Here is what's happening in your workspace today.
        </p>

        {/* Daily Worklog Section */}
        {!isAdmin && (
          <div className="mb-8">
            <DailyWorklog />
          </div>
        )}

        {/* Placeholder for content widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-gray-400 border-dashed">
            <span className="text-sm font-medium">Recent Logs Widget</span>
          </div>
          <div className="h-64 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-gray-400 border-dashed">
            <span className="text-sm font-medium">Analytics Widget</span>
          </div>
        </div>
      </div>
    </div>
  );
}
