"use client";

import { useState } from "react";
import { useRouter } from "next-nprogress-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateUserMutation } from "@/features/users/api/users.mutations";
import { useGetRolesQuery, useGetDepartmentsQuery } from "@/features/users/api/options.queries";

// Password regex exactly like the user requested: \S+ (no spaces)
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^\S+$/, "Password must not contain spaces")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  employeeCode: z.string().min(1, "Employee Code is required"),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  joiningDate: z.string().min(1, "Joining Date is required"),
  isLead: z.boolean(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export default function CreateUserPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery();
  const { data: deptsData, isLoading: isLoadingDepts } = useGetDepartmentsQuery();
  
  const roles = rolesData?.data || [];
  const departments = deptsData?.data || [];

  const createUserMutation = useCreateUserMutation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      isLead: false,
    },
  });

  const onSubmit = (data: CreateUserFormValues) => {
    setError("");
    createUserMutation.mutate(data, {
      onSuccess: () => {
        router.push("/dashboard/users");
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || "Failed to create user");
      },
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 w-full">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users">
          <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-gray-200">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New User</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new team member and assign their role.</p>
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@dexnive.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeCode">Employee Code</Label>
              <Input
                id="employeeCode"
                placeholder="EMP-1001"
                {...register("employeeCode")}
                className={errors.employeeCode ? "border-red-500" : ""}
              />
              {errors.employeeCode && <p className="text-sm text-red-500">{errors.employeeCode.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingRoles}>
                    <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                      <span className="flex-1 text-left truncate">
                        {field.value ? roles.find((r) => r._id === field.value)?.name : "Select a role..."}
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
              {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Controller
                control={control}
                name="department"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingDepts}>
                    <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                      <span className="flex-1 text-left truncate">
                        {field.value ? departments.find((d) => d._id === field.value)?.name : "Select a department..."}
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
              {errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input
                id="joiningDate"
                type="date"
                {...register("joiningDate")}
                className={errors.joiningDate ? "border-red-500" : ""}
              />
              {errors.joiningDate && <p className="text-sm text-red-500">{errors.joiningDate.message}</p>}
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              <div className="flex items-center gap-3 mt-4">
                <Controller
                  control={control}
                  name="isLead"
                  render={({ field }) => (
                    <Switch
                      id="isLead"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isLead" className="cursor-pointer">Is Team Lead?</Label>
              </div>
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
              disabled={createUserMutation.isPending}
              className="rounded-xl px-8 shadow-md shadow-primary-500/20"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
