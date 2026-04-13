"use client";

import { useCallback, useEffect, useState } from "react";

import { authFetch } from "@/lib/auth-client";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type SessionState = {
  status: "loading" | "authenticated" | "unauthenticated";
  user: SessionUser | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function usePaircodeSession(): SessionState {
  const [status, setStatus] = useState<SessionState["status"]>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/auth/me");
      if (res.status === 401) {
        const refreshed = await authFetch("/api/auth/refresh", { method: "POST" });
        if (!refreshed.ok) {
          setUser(null);
          setStatus("unauthenticated");
          return;
        }
        const retry = await authFetch("/api/auth/me");
        if (!retry.ok) {
          setUser(null);
          setStatus("unauthenticated");
          return;
        }
        setUser((await retry.json()) as SessionUser);
        setStatus("authenticated");
        return;
      }

      if (!res.ok) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      setUser((await res.json()) as SessionUser);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const signOut = useCallback(async () => {
    await authFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setStatus("unauthenticated");
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
  }, []);

  return { status, user, signOut, refresh: load };
}
