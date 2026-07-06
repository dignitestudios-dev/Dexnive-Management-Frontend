"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="w-full p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
          Welcome back, {user?.name || "User"}!
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Welcome to the Dexnive Management Portal. From here, you can manage projects, track worklogs, oversee user accounts, and maintain organizational structures like departments and divisions. 
          Use the sidebar navigation to access different modules.
        </p>
      </div>
    </div>
  );
}

