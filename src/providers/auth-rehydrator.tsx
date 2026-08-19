"use client";

import { useEffect, useState } from "react";

import { useAppDispatch } from "@/store";
import { setCredentials, setInitialized } from "@/store/slices/auth.slice";
import { useGetMyUserQuery } from "@/features/users/api/users.queries";
import type { User } from "@/features/users/types";

/**
 * Pulls the signed-in user from `GET /users/me` on every load and writes the
 * result back over the cached copy.
 *
 * Without this, everything role- and department-driven — the sidebar, the
 * access tiers in `useAuth`, and which worklog format a department gets — runs
 * off whatever was stored at login and only corrects itself on the next
 * sign-in. The backend already re-reads the role from the DB on every request,
 * so a user whose role changed would be refused by the API while the UI still
 * offered them the screens.
 *
 * Deliberately non-blocking: rehydration from localStorage has already marked
 * auth initialized, so the app renders from the cached user and swaps in the
 * fresh one when it lands. A 401 here is handled by the axios interceptor,
 * which clears all three token stores and redirects.
 */
function FreshUserSync({ hasToken }: { hasToken: boolean }) {
  const dispatch = useAppDispatch();
  const { data } = useGetMyUserQuery({ enabled: hasToken });
  const fresh = data?.data;

  useEffect(() => {
    if (!fresh) return;

    const token = localStorage.getItem("auth-token");
    if (!token) return;

    localStorage.setItem("auth-user", JSON.stringify(fresh));
    dispatch(setCredentials({ user: fresh as User, accessToken: token }));
  }, [fresh, dispatch]);

  return null;
}

export default function AuthRehydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [hasToken, setHasToken] = useState(false);

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

    setHasToken(!!token);

    // Always mark as initialized after checking
    dispatch(setInitialized(true));
  }, [dispatch]);

  return (
    <>
      <FreshUserSync hasToken={hasToken} />
      {children}
    </>
  );
}
