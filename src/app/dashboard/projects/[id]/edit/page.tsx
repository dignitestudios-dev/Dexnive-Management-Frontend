"use client";

import { use, useEffect } from "react";
import { ProjectForm } from "@/features/projects/components/project-form";
import { Button } from "@/components/ui/button";
import { useGetProjectByIdQuery } from "@/features/projects/api/projects.queries";
import { Briefcase, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next-nprogress-bar";
import { toast } from "sonner";

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const { data, isLoading, isError } = useGetProjectByIdQuery(resolvedParams.id);
  const project = data?.data;

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load project details");
      router.push("/dashboard/projects");
    }
  }, [isError, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 w-full">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push("/dashboard/projects")}
          className="h-9 w-9 text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary-600" />
            Edit Project: {project.name}
          </h1>
          <p className="text-sm text-gray-500">Update project details and configuration.</p>
        </div>
      </div>

      <ProjectForm initialData={project} />
    </div>
  );
}
