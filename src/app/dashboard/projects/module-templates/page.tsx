"use client";

import { useEffect } from "react";
import { useRouter } from "next-nprogress-bar";
import { Boxes } from "lucide-react";

import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ModuleTemplateManager } from "@/features/module-templates/components/module-template-manager";

/**
 * The module list every new project is seeded with.
 *
 * Visible to Admin, Lead and Project Manager; only Admin can change it, which
 * is what the API enforces — GET is open to any authenticated user while the
 * write verbs are Admin-only.
 */
export default function ModuleTemplatesPage() {
  const router = useRouter();
  const { isAdmin, canManageProjects, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && !canManageProjects) {
      router.push("/dashboard");
    }
  }, [isInitialized, canManageProjects, router]);

  if (!isInitialized || !canManageProjects) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-6 h-6 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="flex-shrink-0 border-b border-gray-100 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Boxes className="w-5 h-5 text-primary-600" />
          Module Templates
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          The starting module list for every new project.
          {!isAdmin && " Managed by an admin."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <ModuleTemplateManager canManage={isAdmin} />
      </div>
    </div>
  );
}
