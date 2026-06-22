"use client";

import { useForgotPasswordMutation } from "@/features/auth/api/auth.mutations";
import { step1Schema } from "@/features/auth/schemas/forgot.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next-nprogress-bar";

export function useForgot() {
  const router = useRouter();
  const { mutate: forgotPassword, isPending, error } = useForgotPasswordMutation();

  const form = useForm({ resolver: zodResolver(step1Schema), defaultValues: { email: "" } });

  function onSubmit(data: { email: string }) {
    sessionStorage.setItem("forgot-email", data.email);
    forgotPassword(data, {
      onSuccess: () => {
        router.push("/auth/verify");
      },
    });
  }

  return { form, onSubmit, isPending, error };
}
