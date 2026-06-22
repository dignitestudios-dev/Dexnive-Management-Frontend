"use client";

import { useReset } from "@/features/auth/hooks/use-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockKeyhole, CheckCircle2, Eye, EyeOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";

export default function ResetPasswordPage() {
  const { form, onSubmit, isPending, error, isSuccess } = useReset();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordValue = form.watch("password") || "";
  const confirmPasswordValue = form.watch("confirmPassword") || "";
  const hasInteractedWithConfirm = form.formState.dirtyFields.confirmPassword || confirmPasswordValue.length > 0;

  // Force re-validation only if the user has started interacting with confirmPassword
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

  return (
    <div className="w-full relative">
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div 
            key="reset"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 mb-2">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                New Password
              </h1>
              <p className="text-sm text-gray-500">
                Create a new secure password for your account.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
                  {error.message || "Failed to update password."}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input 
                    id="new-password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pr-10"
                    error={!!form.formState.errors.password}
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
                
                {/* Real-time Checklist */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-3 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  {checks.map((check, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {check.met ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                      )}
                      <span className={cn("text-[11px] leading-tight transition-colors", check.met ? "text-green-700" : "text-gray-500")}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input 
                    id="confirm-password" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pr-10"
                    error={!!form.formState.errors.confirmPassword}
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
                  <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="mt-4 w-full" 
                isLoading={isPending || form.formState.isSubmitting} 
                disabled={!form.formState.isValid || isPending || form.formState.isSubmitting}
              >
                Update Password
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-6 text-center py-4"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 mb-2">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Password Updated!
              </h1>
              <p className="text-sm text-gray-500 max-w-[300px] mx-auto">
                Your password has been successfully reset. You can now securely log in to your account.
              </p>
            </div>
            
            <Link prefetch={false} href="/auth/login" className="mt-4">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
