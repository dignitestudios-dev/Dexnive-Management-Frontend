import React from "react";
import { Loader } from "@/components/ui/loader";
import { Clock } from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useGetStagesByProjectQuery, projectStagesKeys } from "@/features/projects/api/project-stages.queries";
import { projectStagesService } from "@/features/projects/api/project-stages.service";

export function ProjectTimeline({ projectId }: { projectId: string }) {
  const { data: stagesData, isLoading: isLoadingStages } = useGetStagesByProjectQuery(projectId);
  const stages = stagesData?.data || [];

  const stageQueries = useQueries({
    queries: stages.map((stage: any) => ({
      queryKey: projectStagesKeys.detail(stage._id),
      queryFn: () => projectStagesService.getStageById(stage._id),
      enabled: !!stage._id,
    })),
  });

  const isLoadingDetails = stageQueries.some((q) => q.isLoading);
  const isLoading = isLoadingStages || isLoadingDetails;

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center h-[400px] items-center">
        <Loader className="w-8 h-8 text-primary" />
      </div>
    );
  }

  const allLogs: any[] = [];
  stageQueries.forEach((q) => {
    if (q.data?.data) {
      const stage = q.data.data;
      if (stage.auditLog) {
        stage.auditLog.forEach((log: any) => {
          allLogs.push({
            ...log,
            stageName: stage.name,
            stageId: stage._id,
          });
        });
      }
    }
  });

  allLogs.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

  if (allLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-12">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timeline Activity</h3>
        <p className="text-gray-500 max-w-md">There are no status updates or audit logs for the stages in this project yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-8 px-4">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          Activity Timeline
        </h3>
        <p className="text-sm text-gray-500 mt-1">A chronological history of all stage status changes</p>
      </div>
      
      <div className="relative border-l border-gray-200 ml-4 space-y-8 pb-8">
        {allLogs.map((log, idx) => (
          <div key={idx} className="relative pl-8 group">
            {/* Timeline dot */}
            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-primary shadow-[0_0_0_4px_white] transition-colors group-hover:border-blue-600 group-hover:bg-blue-600" />
            
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-900">
                    {log.changedBy?.name || "System"}
                  </span>
                  <span className="text-gray-500">changed status of</span>
                  <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                    {log.stageName}
                  </span>
                  <span className="text-gray-500">to</span>
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                    log.newStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    log.newStatus === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    log.newStatus === 'delayed' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {log.newStatus.replace('-', ' ')}
                  </span>
                </div>
                <div className="text-xs text-gray-400 shrink-0 mt-1 md:mt-0">
                  {new Date(log.changedAt).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
              
              {log.note && (
                <div className="mt-3 bg-gray-50/80 rounded-lg p-3 border border-gray-100 text-sm text-gray-600 italic flex gap-3">
                  <div className="w-1 h-full bg-gray-300 rounded-full shrink-0" />
                  <p>"{log.note}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
