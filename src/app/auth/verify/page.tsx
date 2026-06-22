"use client";

import { useVerify } from "@/features/auth/hooks/use-verify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { OTPInput } from "@/components/ui/otp-input";
import { Controller } from "react-hook-form";

export default function VerifyOTPPage() {
  const { form, email, onSubmit, isPending, error } = useVerify();

  if (!email) return null; // Wait for redirect if no email

  return (
    <div className="w-full relative">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 mb-2">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Verify OTP
          </h1>
          <p className="text-sm text-gray-500">
            Enter the 6-digit code sent to <br/>
            <span className="font-medium text-gray-900">{email}</span>
            <Link 
              prefetch={false} 
              href="/auth/forgot"
              className="ml-2 text-primary-600 hover:text-primary-700 hover:underline text-xs font-medium"
            >
              Change email
            </Link>
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
              {error.message || "Invalid or expired OTP."}
            </div>
          )}

          <div className="flex flex-col gap-2 items-center">
            <Label htmlFor="otp" className="sr-only">Verification Code</Label>
            <Controller
              name="otp"
              control={form.control}
              render={({ field }) => (
                <OTPInput 
                  length={6} 
                  value={field.value} 
                  onChange={field.onChange} 
                  error={!!form.formState.errors.otp} 
                />
              )}
            />
            {form.formState.errors.otp && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.otp.message}</p>
            )}
          </div>

          <Button type="submit" className="mt-2 w-full" isLoading={isPending}>
            Verify & Continue
          </Button>
          
          <Link prefetch={false} href="/auth/login" className="text-center mt-2">
            <span className="text-sm text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </span>
          </Link>
        </form>
      </motion.div>
    </div>
  );
}
