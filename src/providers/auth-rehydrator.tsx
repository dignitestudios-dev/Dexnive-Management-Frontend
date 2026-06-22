"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { setCredentials, setInitialized } from "@/store/slices/auth.slice";

export default function AuthRehydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    const userStr = localStorage.getItem("auth-user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch(setCredentials({ user, accessToken: token }));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    
    // Always mark as initialized after checking
    dispatch(setInitialized(true));
  }, [dispatch]);

  return <>{children}</>;
}
