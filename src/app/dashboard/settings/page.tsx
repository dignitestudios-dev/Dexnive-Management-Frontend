"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { step3Schema } from "@/features/auth/schemas/forgot.schema";
import { useUpdatePasswordMutation } from "@/features/auth/api/auth.mutations";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockKeyhole, CheckCircle2, Eye, EyeOff, X } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";

type ChangePasswordFormValues = z.infer<typeof step3Schema>;

export default function SettingsPage() {
  const { accessToken } = useAuth();
  const updatePasswordMutation = useUpdatePasswordMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const passwordValue = form.watch("password") || "";
  const confirmPasswordValue = form.watch("confirmPassword") || "";
  const hasInteractedWithConfirm = form.formState.dirtyFields.confirmPassword || confirmPasswordValue.length > 0;

  useEffect(() => {
    if (hasInteractedWithConfirm) {
      form.trigger("confirmPassword");
    }
  }, [passwordValue, confirmPasswordValue, form, hasInteractedWithConfirm]);

  const checks = [
    { label: "At least 8 characters", met: passwordValue.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(passwordValue) },
    { label: "One lowercase letter", met: /[a-z]/.test(passwordValue) },
    { label: "One digit", met: /[0-9]/.test(passwordValue) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  const onSubmit = (data: ChangePasswordFormValues) => {
    setError(null);
    setSuccess(null);

    if (!accessToken) {
      setError("You are not authenticated.");
      return;
    }

    updatePasswordMutation.mutate(
      { password: data.password, token: accessToken },
      {
        onSuccess: () => {
          form.reset();
          setSuccess("Password changed successfully.");
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err?.message || "Failed to update password.";
          setError(message);
        },
      }
    );
  };

  return (
    <div className="flex-1 w-full max-w-lg mx-auto py-10 px-4 md:px-0">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Settings
          </h1>
          <p className="text-base text-gray-500">
            Manage your account settings and change your password.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
              <p className="text-base text-gray-500">Update your account password securely.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 text-base text-red-500 bg-red-50 rounded-md border border-red-100">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 text-base text-green-600 bg-green-50 rounded-md border border-green-100">
              {success}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password" className="text-base font-semibold">New Password</Label>
              <div className="relative">
                <Input 
                  id="new-password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className={form.formState.errors.password ? "border-red-500 pr-10 text-base h-10" : "pr-10 text-base h-10"}
                  {...form.register("password")} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 gap-x-3 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                {checks.map((check, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {check.met ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    )}
                    <span className={cn("text-sm leading-tight transition-colors", check.met ? "text-green-700 font-semibold" : "text-gray-500")}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password" className="text-base font-semibold">Confirm Password</Label>
              <div className="relative">
                <Input 
                  id="confirm-password" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className={form.formState.errors.confirmPassword ? "border-red-500 pr-10 text-base h-10" : "pr-10 text-base h-10"}
                  {...form.register("confirmPassword")} 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="mt-2 w-full text-base font-semibold h-10" 
              disabled={!form.formState.isValid || updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending ? <Loader className="w-5 h-5 text-current" /> : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
