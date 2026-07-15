"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next-nprogress-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetUserByIdQuery } from "@/features/users/api/users.queries";
import { useUpdateUserMutation } from "@/features/users/api/users.mutations";
import { useGetRolesQuery, useGetDepartmentsQuery } from "@/features/users/api/options.queries";
import { Loader } from "@/components/ui/loader";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(20, "Name cannot exceed 20 characters"),
  password: z.string().refine((val) => val === "" || /^\S+$/.test(val), {
    message: "Password must not contain spaces",
  }).optional(),
  employeeCode: z.string().regex(/^\d{1,8}$/, "Employee Code must be a number with up to 8 digits"),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  isLead: z.boolean(),
  isActive: z.boolean(),
});

type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [error, setError] = useState("");
  
  // In Next.js 15+, params is a Promise
  const resolvedParams = React.use(params);
  const userId = resolvedParams.id;

  const { data: userData, isLoading: isLoadingUser, refetch: refetchUser } = useGetUserByIdQuery(userId);
  const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery();
  const { data: deptsData, isLoading: isLoadingDepts } = useGetDepartmentsQuery();
  
  const user = userData?.data;
  const roles = rolesData?.data || [];
  const departments = deptsData?.data || [];

  const updateUserMutation = useUpdateUserMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
      password: "",
      employeeCode: "",
      role: "",
      department: "",
      isLead: false,
      isActive: true,
    }
  });

  useEffect(() => {
    if (user) {
      // Handle either string IDs or populated objects safely
      const roleId = typeof user.role === "string" ? user.role : (user.role?._id || (user.role as any)?.id || "");
      const deptId = typeof user.department === "string" ? user.department : (user.department?._id || (user.department as any)?.id || "");

      reset({
        name: user.name || "",
        employeeCode: user.employeeCode || "",
        role: roleId,
        department: deptId,
        isLead: user.isLead || false,
        isActive: !user.isDeleted,
        password: "", // Don't pre-fill password
      });
    }
  }, [user, reset]);

  const onSubmit = (data: UpdateUserFormValues) => {
    setError("");
    const { isActive, ...restData } = data;
    // Map isActive to isDeleted if backend requires it, or just pass if backend ignores it.
    // Assuming backend takes isDeleted instead of isActive
    const payload = { ...restData, isDeleted: !isActive, userId };
    
    // Remove empty password so we don't update it unless typed
    if (!payload.password) {
      delete payload.password;
    }

    updateUserMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("User updated successfully");
        refetchUser(); // Refresh the user data
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || "Failed to update user");
      },
    });
  };

  if (isLoadingUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader className="w-10 h-10 text-primary" />
        <p className="mt-4 text-gray-500 font-medium">Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900">User Not Found</h1>
        <Link href="/dashboard/users">
          <Button variant="outline" className="mt-4">Go Back to Team</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 w-full">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users">
          <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-gray-200">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit User</h1>
          <p className="text-sm text-gray-500 mt-1">Update details and permissions for {user.name}.</p>
          {user.updatedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {new Date(user.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="John Doe"
                maxLength={20}
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Reset Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank to keep current"
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeCode">Employee Code <span className="text-red-500">*</span></Label>
              <Input
                id="employeeCode"
                placeholder="1001"
                maxLength={8}
                {...register("employeeCode", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "");
                  }
                })}
                className={errors.employeeCode ? "border-red-500" : ""}
              />
              {errors.employeeCode && <p className="text-xs text-red-500">{errors.employeeCode.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingRoles}>
                    <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                      <span className="flex-1 text-left truncate">
                        {field.value ? (roles.find((r) => r._id === field.value)?.name || "") : "Select a role..."}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="department"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingDepts}>
                    <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                      <span className="flex-1 text-left truncate">
                        {field.value ? (departments.find((d) => d._id === field.value)?.name || "") : "Select a department..."}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d._id} value={d._id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col gap-4 mt-2">
              <Controller
                control={control}
                name="isLead"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div>
                      <p className="font-medium text-gray-900">Is Lead</p>
                      <p className="text-sm text-gray-500">Mark this user as a team lead.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-sm font-medium transition-colors", !field.value ? "text-gray-900" : "text-gray-400")}>Standard</span>
                      <Switch
                        id="isLead"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-purple-600"
                      />
                      <span className={cn("text-sm font-medium transition-colors", field.value ? "text-purple-700" : "text-gray-400")}>Lead</span>
                    </div>
                  </div>
                )}
              />

              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div>
                      <p className="font-medium text-gray-900">Account Status</p>
                      <p className="text-sm text-gray-500">User account is currently {field.value ? "active" : "inactive"}.</p>
                    </div>
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-md border ${field.value ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <Label htmlFor="isActive" className={`cursor-pointer text-sm font-medium ${field.value ? 'text-green-700' : 'text-gray-700'}`}>
                        {field.value ? "Active" : "Inactive"}
                      </Label>
                      <Switch
                        id="isActive"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Link href="/dashboard/users">
              <Button type="button" variant="outline" className="mr-4 rounded-xl px-6">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={!isDirty || updateUserMutation.isPending}
              className="rounded-md px-8 shadow-md shadow-primary-500/20 h-9"
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 " />
                  Saving...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
