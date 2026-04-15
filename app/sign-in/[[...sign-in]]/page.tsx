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
        className="flex w-full flex-col gap-5 animate-fade-in"
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
          Email
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-12 px-4 rounded-xl border-(--panel-border-strong) focus-visible:ring-2 focus-visible:ring-(--focus-ring) transition-all bg-(--surface-strong) hover:bg-(--surface)"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
          Password
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 pl-4 pr-12 rounded-xl border-(--panel-border-strong) focus-visible:ring-2 focus-visible:ring-(--focus-ring) transition-all bg-(--surface-strong) hover:bg-(--surface) w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-(--muted) hover:text-foreground transition-colors rounded-r-xl"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 animate-slide-up">
            {error}
          </p>
        ) : null}
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            type="submit" 
            disabled={submitting || guestSubmitting} 
            className="h-12 text-base font-semibold rounded-xl bg-(--accent) hover:bg-(--accent-soft) text-white shadow-(--accent-glow) transition-all hover:scale-[1.02] active:scale-95"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>

          <Button 
            type="button" 
            onClick={submitGuest}
            variant="secondary"
            disabled={submitting || guestSubmitting} 
            className="h-12 text-base font-semibold rounded-xl border border-(--panel-border) bg-(--surface-strong) hover:bg-(--surface) text-foreground transition-all hover:scale-[1.02] active:scale-95"
          >
            {guestSubmitting ? "Creating guest session…" : (
              <>
                <UserCircle2 className="w-5 h-5 mr-2" /> Try as Guest
              </>
            )}
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-(--muted)">
          No account yet?{" "}
          <Link href="/sign-up" className="font-semibold text-foreground hover:text-(--accent) transition-colors">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
