"use client";

import { ProjectForm } from "@/features/projects/components/project-form";
import { Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next-nprogress-bar";

export default function CreateProjectPage() {
  const router = useRouter();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 w-full">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push("/dashboard/projects")}
          className="rounded-full w-10 h-10 border-gray-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary-600" />
            Add Project
          </h1>
          <p className="text-sm text-gray-500">Create a new project and configure its initial settings.</p>
        </div>
      </div>

      <ProjectForm />
    </div>
  );
}
