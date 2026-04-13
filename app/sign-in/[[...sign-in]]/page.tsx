"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { AuthShell } from "@/components/paircode/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch, readJsonError } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const message = await readJsonError(res);
        setError(
          message === "invalid_credentials"
            ? "Incorrect email or password."
            : message === "account_locked"
              ? "Account temporarily locked due to too many failed attempts."
              : message === "rate_limited"
                ? "Too many attempts. Please wait and try again."
                : "Sign-in failed. Please try again.",
        );
        return;
      }
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Sign in to the engineering workspace"
      description="Access collaborative rooms with a verified operator identity, persistent threaded context, and room-level implementation history."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="flex w-full flex-col gap-4"
      >
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Email
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Password
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? (
          <p className="border-2 border-[var(--panel-border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--danger,#b00020)]">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-xs font-mono text-[var(--muted)]">
          No account yet?{" "}
          <Link href="/sign-up" className="underline underline-offset-4">
            Create one
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
