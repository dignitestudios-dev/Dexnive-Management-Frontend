"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next-nprogress-bar";
import { Layers } from "lucide-react";

import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useGetDepartmentsQuery } from "@/features/departments/api/departments.queries";
import { CategoryManager } from "@/features/categories/components/category-manager";

/** The id of the user's own department, whether populated or a bare id. */
function ownDepartmentId(user: unknown): string {
  const department = (user as any)?.department;
  if (!department) return "";
  return typeof department === "string" ? department : (department._id ?? "");
}

/**
 * Department categories.
 *
 * A Lead manages their own department and sees no picker — the API scopes both
 * reads and writes to it. An Admin may switch department, since they can manage
 * any of them.
 */
export default function CategoriesPage() {
  const router = useRouter();
  const { user, isAdmin, isFullManager, isInitialized } = useAuth();

  // Categories are a management concern; everyone else has no business here.
  useEffect(() => {
    if (isInitialized && !isFullManager) {
      router.push("/dashboard");
    }
  }, [isInitialized, isFullManager, router]);

  const { data: departmentsData } = useGetDepartmentsQuery({ limit: 100 } as any);
  const departments = departmentsData?.data ?? [];

  const own = ownDepartmentId(user);
  const [selected, setSelected] = useState<string>("");

  // Admins default to their own department too, just with the option to switch.
  useEffect(() => {
    if (!selected && own) setSelected(own);
  }, [own, selected]);

  if (!isInitialized || !isFullManager) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-6 h-6 text-primary-600" />
      </div>
    );
  }

  const activeDepartment =
    departments.find((d: any) => d._id === selected)?.name ?? "your department";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="flex-shrink-0 border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-600" />
            Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? "Manage the category list for any department."
              : `Manage the category list for ${activeDepartment}.`}
          </p>
        </div>

        {isAdmin && departments.length > 0 && (
          <Select value={selected} onValueChange={(value) => value && setSelected(value)}>
            <SelectTrigger className="w-full sm:w-56 h-9 bg-white">
              {/*
                Base UI renders the raw value unless given a formatter, which
                would show the department's ObjectId instead of its name.
              */}
              <SelectValue placeholder="Select department">
                {(value) =>
                  departments.find((d: any) => d._id === value)?.name ??
                  "Select department"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {departments.map((department: any) => (
                <SelectItem key={department._id} value={department._id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {selected ? (
          <CategoryManager departmentId={selected} />
        ) : (
          <p className="text-sm text-gray-500">
            No department is set on your account, so there is no category list to
            manage.
          </p>
        )}
      </div>
    </div>
  );
}
