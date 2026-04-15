"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
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
        const authError = await readJsonError(res);
        setError(
          authError.code === "invalid_credentials" || authError.status === 401
            ? "Incorrect email or password."
            : authError.code === "account_locked" || authError.status === 423
              ? "Account temporarily locked due to too many failed attempts."
              : authError.code === "rate_limited" || authError.status === 429
                ? "Too many attempts. Please wait and try again."
                : "We could not sign you in right now. Please try again in a moment.",
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
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-(--muted)">
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
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-(--muted)">
          Password
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-(--muted) hover:text-(--foreground) transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        {error ? (
          <p className="border-2 border-(--panel-border) bg-(--surface) px-3 py-2 text-xs font-mono text-(--danger,#b00020)">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-xs font-mono text-(--muted)">
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
