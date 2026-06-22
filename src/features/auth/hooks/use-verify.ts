"use client";

import { useVerifyOTPMutation } from "@/features/auth/api/auth.mutations";
import { step2Schema } from "@/features/auth/schemas/forgot.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next-nprogress-bar";
import { useEffect, useState } from "react";

export function useVerify() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const { mutate: verifyOTP, isPending, error } = useVerifyOTPMutation();

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("forgot-email");
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      router.push("/auth/forgot");
    }
  }, [router]);

  const form = useForm({ resolver: zodResolver(step2Schema), defaultValues: { otp: "" } });

  function onSubmit(data: { otp: string }) {
    verifyOTP({ email, otp: data.otp }, {
      onSuccess: (response) => {
        const { token } = response.data;
        sessionStorage.setItem("reset-token", token);
        router.push("/auth/reset");
      },
      onError: () => {
        form.setValue("otp", "");
      }
    });
  }

  return { form, email, onSubmit, isPending, error };
}
