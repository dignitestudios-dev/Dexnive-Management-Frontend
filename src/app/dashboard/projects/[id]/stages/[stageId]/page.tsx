"use client";

import * as React from "react";
import { useState, use } from "react";
import { useRouter } from "next-nprogress-bar";
import { ArrowLeft, Calendar, Clock, FileText, User } from "lucide-react";
import { useGetStageByIdQuery, useGetStageEntriesQuery } from "@/features/projects/api/project-stages.queries";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";

const formatDisplayDate = (dateString?: string | null) => {
  if (!dateString) return "--";
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function StageDetailsPage({ params }: { params: Promise<{ id: string, stageId: string }> }) {
  const resolvedParams = use(params);
  const { id: projectId, stageId } = resolvedParams;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"timeline" | "entries">("timeline");

  const { data: stageDetailsData, isLoading: isLoadingStageDetails } = useGetStageByIdQuery(stageId);
  const stageDetails = stageDetailsData?.data;

  const { data: entriesData, isLoading: isLoadingEntries } = useGetStageEntriesQuery(stageId);
  const entries = entriesData?.data || [];

  if (isLoadingStageDetails) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!stageDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <h2 className="text-xl font-bold text-gray-900">Stage Not Found</h2>
        <Button onClick={() => router.push(`/dashboard/projects/${projectId}`)} className="mt-4">Back to Project</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex flex-col gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <button onClick={() => router.push(`/dashboard/projects/${projectId}`)} className="hover:text-gray-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Project Details
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">Stage Details</span>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
            {stageDetails.name}
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${
              stageDetails.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              stageDetails.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              stageDetails.status === 'delayed' ? 'bg-red-50 text-red-700 border-red-200' :
              'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
              {stageDetails.status.replace('-', ' ')}
            </span>
            {stageDetails.scheduleStatus && (
              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${
                stageDetails.scheduleStatus === 'Completed On Time' || stageDetails.scheduleStatus === 'On Track'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {stageDetails.scheduleStatus}
              </span>
            )}
          </h1>
          <div className="flex gap-6 mt-3 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 opacity-70" />
              <span>Planned: {formatDisplayDate(stageDetails.plannedStartDate)} - {formatDisplayDate(stageDetails.plannedEndDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 opacity-70" />
              <span>Actual: {formatDisplayDate(stageDetails.actualStartDate)} - {formatDisplayDate(stageDetails.actualEndDate)}</span>
            </div>
          </div>

          {/* Hours Breakdown */}
          <div className="mt-4 grid grid-cols-5 gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100 max-w-3xl">
            <div className="text-center">
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Budget</div>
              <div className="text-sm font-semibold text-gray-900">{stageDetails.budgetedHours || 0}h</div>
              {stageDetails.budgetStatus && (
                <div className={`mt-0.5 text-[10px] font-medium ${stageDetails.budgetStatus === 'Over Budget' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {stageDetails.budgetStatus} {stageDetails.budgetUsedPercent != null && `(${stageDetails.budgetUsedPercent}%)`}
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Billable</div>
              <div className="text-sm font-semibold text-emerald-600">
                {stageDetails.totalBillableHours || 0}h
                {stageDetails.totalOvertimeHours ? <span className="text-[10px] opacity-75 ml-1">({stageDetails.totalOvertimeHours}h OT)</span> : null}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Non-Billable</div>
              <div className="text-sm font-semibold text-amber-600">
                {stageDetails.totalNonBillableHours || 0}h
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Total</div>
              <div className="text-sm font-bold text-gray-900">{stageDetails.totalHours || 0}h</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mt-2">
          <button 
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'timeline' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline & Audit
            {activeTab === 'timeline' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button 
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'entries' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setActiveTab('entries')}
          >
            Entries
            {activeTab === 'entries' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'timeline' && (
          <div className="max-w-3xl">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <FileText className="w-4 h-4 text-gray-400" />
              Audit Log & Status History
            </h4>
            
            {stageDetails.auditLog && stageDetails.auditLog.length > 0 ? (
              <div className="space-y-4">
                {stageDetails.auditLog.map((log: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      {idx < stageDetails.auditLog.length - 1 && (
                        <div className="w-px h-full bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 flex-1 mb-2">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{log.changedBy?.name || "User"}</span> changed status to <span className="font-semibold uppercase text-xs">{log.newStatus}</span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(log.changedAt).toLocaleString()}</span>
                      </div>
                      {log.note && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                          "{log.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                No status history found for this stage.
              </div>
            )}
          </div>
        )}

        {activeTab === 'entries' && (
          <div className="max-w-4xl">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <FileText className="w-4 h-4 text-gray-400" />
              Stage Entries
            </h4>

            {isLoadingEntries ? (
              <div className="flex justify-center p-8">
                <Loader className="w-6 h-6 text-primary" />
              </div>
            ) : entries.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[minmax(200px,1fr)_100px_100px_100px_100px_120px] gap-4 p-3 border-b border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div>User</div>
                  <div className="text-right">Entries</div>
                  <div className="text-right">Billable</div>
                  <div className="text-right">Non-Billable</div>
                  <div className="text-right">Total</div>
                  <div className="text-right">Last Logged</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {entries.map((entry: any, index: number) => {
                    const totalHrs = (entry.totalBillableHours || 0) + (entry.totalNonBillableHours || 0);
                    return (
                      <div key={index} className="grid grid-cols-[minmax(200px,1fr)_100px_100px_100px_100px_120px] items-center gap-4 p-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 truncate">{entry.user?.name || "Unknown"}</span>
                          <span className="text-xs text-gray-500 truncate">{entry.user?.email || ""}</span>
                        </div>
                        <div className="text-right text-gray-600">{entry.entryCount}</div>
                        <div className="text-right text-emerald-600 font-medium">
                          {entry.totalBillableHours || 0}h
                          {entry.totalOvertimeHours ? <span className="block text-[10px] opacity-75">({entry.totalOvertimeHours}h OT)</span> : null}
                        </div>
                        <div className="text-right text-amber-600 font-medium">{entry.totalNonBillableHours || 0}h</div>
                        <div className="text-right font-bold text-gray-900">{totalHrs}h</div>
                        <div className="text-right text-xs text-gray-500">{formatDisplayDate(entry.lastLoggedAt)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
                No entries logged against this stage yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
