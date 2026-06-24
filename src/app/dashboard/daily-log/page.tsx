"use client";

import { DailyWorklog } from "@/features/worklogs/components/daily-worklog";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next-nprogress-bar";

export default function DailyLogPage() {
  const router = useRouter();

  return (
    <div className="w-full p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/dashboard")}
            className="rounded-full w-10 h-10 border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-600" />
              Daily Logs
            </h1>
            <p className="text-sm text-gray-500">Record your daily work activities and submit them.</p>
          </div>
        </div>
        <DailyWorklog />
      </div>
    </div>
  );
}
