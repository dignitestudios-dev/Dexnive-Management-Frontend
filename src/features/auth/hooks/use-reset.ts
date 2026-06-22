"use client";

import { useUpdatePasswordMutation } from "@/features/auth/api/auth.mutations";
import { step3Schema } from "@/features/auth/schemas/forgot.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next-nprogress-bar";
import { useState, useEffect } from "react";
import { z } from "zod";

export function useReset() {
  const router = useRouter();
  const { mutate: updatePassword, isPending, error } = useUpdatePasswordMutation();
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("reset-token");
    if (!token) {
      router.push("/auth/forgot");
    }
  }, [router]);

  const form = useForm({ 
    resolver: zodResolver(step3Schema), 
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange"
  });

  function onSubmit(data: z.infer<typeof step3Schema>) {
    const token = sessionStorage.getItem("reset-token");
    if (!token) {
      router.push("/auth/forgot");
      return;
    }

    updatePassword({ password: data.password, token }, {
      onSuccess: () => {
        sessionStorage.removeItem("forgot-email");
        sessionStorage.removeItem("reset-token");
        setIsSuccess(true);
      },
    });
  }

  return { form, onSubmit, isPending, error, isSuccess };
}
