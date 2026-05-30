"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserCircle2 } from "lucide-react";

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
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  async function submitGuest() {
    setError("");
    setGuestSubmitting(true);
    try {
      const res = await authFetch("/api/auth/guest", { method: "POST" });
      if (!res.ok) {
        setError("Could not create guest session. Please try regular sign in.");
        return;
      }
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } finally {
      setGuestSubmitting(false);
    }
  }

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
            : authError.code === "invalid_input" || authError.status === 400
              ? "Check your email and password format. Password must be at least 12 characters."
            : authError.code === "auth_misconfigured" || authError.status === 500
              ? "Authentication is temporarily misconfigured. Please contact support."
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
        className="flex w-full flex-col gap-4 animate-fade-in"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Email
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-11"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Password
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[10px] text-(--muted) transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error ? (
          <p className="rounded-[10px] border border-(--danger)/30 bg-(--danger-tint) px-3.5 py-2.5 text-sm text-(--danger) animate-slide-up">
            {error}
          </p>
        ) : null}

        <div className="mt-2 flex flex-col gap-2.5">
          <Button type="submit" size="lg" disabled={submitting || guestSubmitting} className="text-[15px]">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>

          <Button
            type="button"
            onClick={submitGuest}
            variant="secondary"
            size="lg"
            disabled={submitting || guestSubmitting}
            className="text-[15px]"
          >
            {guestSubmitting ? (
              "Creating guest session…"
            ) : (
              <>
                <UserCircle2 className="h-4 w-4" /> Try as guest
              </>
            )}
          </Button>
        </div>

        <p className="mt-2 text-center text-sm text-(--muted)">
          No account yet?{" "}
          <Link href="/sign-up" className="font-medium text-(--accent) transition-colors hover:text-(--accent-soft)">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
