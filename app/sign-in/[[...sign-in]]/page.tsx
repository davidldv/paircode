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
      title="Present your credential"
      description="PairCode issues every operator a verified identity before they reach a room. Sign in and the server — not this page — decides what you may read, write, and administer inside it."
      bearerName={email ? email.split("@")[0].replace(/[._-]+/g, " ") : ""}
      bearerSeed={email}
      formTitle="Present credential"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="flex w-full flex-col gap-3.5"
      >
        <label className="block">
          <span className="legend mb-1 block">Email</span>
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-10"
          />
        </label>

        <label className="block">
          <span className="legend mb-1 block">Password</span>
          <span className="relative block">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-(--ink-3) transition-colors hover:text-(--ink)"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        {error ? (
          <p className="print-in border border-(--cancel) bg-(--cancel-tint) px-2.5 py-2 text-[0.8125rem] leading-relaxed text-(--cancel)">
            <span className="legend mr-1.5 text-(--cancel)">Refused</span>
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={submitting || guestSubmitting}>
          {submitting ? "Reading credential…" : "Sign in"}
        </Button>

        <div className="flex items-center gap-2.5">
          <span className="h-px flex-1 bg-(--rule)" />
          <span className="legend">or</span>
          <span className="h-px flex-1 bg-(--rule)" />
        </div>

        <Button
          type="button"
          onClick={submitGuest}
          variant="secondary"
          size="lg"
          disabled={submitting || guestSubmitting}
        >
          <UserCircle2 className="h-3.5 w-3.5" />
          {guestSubmitting ? "Issuing visitor pass…" : "Issue a visitor pass"}
        </Button>
        <p className="note">
          A visitor pass is a real, short-lived guest session. It opens rooms you create; it is not a demo mode.
        </p>

        <p className="mt-1 border-t border-(--rule) pt-3 text-center text-[0.8125rem] text-(--ink-2)">
          No account yet?{" "}
          <Link
            href="/sign-up"
            className="font-[600] text-(--secure) underline decoration-(--secure)/40 transition-colors hover:decoration-(--secure)"
          >
            Apply for one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
