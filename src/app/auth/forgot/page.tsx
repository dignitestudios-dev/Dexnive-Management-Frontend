"use client";

import { useForgot } from "@/features/auth/hooks/use-forgot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { form, onSubmit, isPending, error } = useForgot();

  return (
    <div className="w-full relative">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 mb-2">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Reset password
          </h1>
          <p className="text-sm text-gray-500">
            Enter your email and we'll send a 6-digit verification code.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
              {error.message || "Failed to process request."}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@company.com" 
              className={form.formState.errors.email ? "border-red-500" : ""}
              {...form.register("email")} 
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="mt-2 w-full" isLoading={isPending}>
            Send Code
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
