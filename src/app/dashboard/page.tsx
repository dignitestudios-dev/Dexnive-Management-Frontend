"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Good morning{user?.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-gray-500 mb-8">
          Here is what's happening in your workspace today.
        </p>

        <div className="bg-primary-50 rounded-xl p-6 border border-primary-100 mb-8">
          <h2 className="text-lg font-medium text-primary-900 mb-1">Your Role: {isAdmin ? "Admin / Lead" : "Employee"}</h2>
          <p className="text-sm text-primary-700">
            {isAdmin 
              ? "You have complete access to manage all teams, settings, and logs."
              : "You can log your daily tasks and view your own entry history."}
          </p>
        </div>

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
