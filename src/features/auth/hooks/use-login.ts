"use client";

import { useRouter } from "next-nprogress-bar";
import { useAppDispatch } from "@/store";
import { setCredentials } from "@/store/slices/auth.slice";
import { useLoginMutation } from "@/features/auth/api/auth.mutations";
import { loginSchema } from "@/features/auth/schemas/login.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type LoginCredentials = z.infer<typeof loginSchema>;

export function useLogin() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { mutate: login, isPending, error } = useLoginMutation();

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data: LoginCredentials) {
    login(data, {
      onSuccess: (response) => {
        const { token, user } = response.data;
        // Persist token for axios interceptor + Redux rehydration
        localStorage.setItem("auth-token", token);
        localStorage.setItem("auth-user", JSON.stringify(user));
        // Cookie for proxy.ts (server-side route protection)
        document.cookie = `auth-token=${token}; path=/; max-age=86400`; // Adjust max-age as needed
        
        dispatch(setCredentials({ user, accessToken: token }));
        router.push("/dashboard");
      },
    });
  }

  return { form, onSubmit, isPending, error };
}
