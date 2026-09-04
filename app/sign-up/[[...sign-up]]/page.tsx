"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserCircle2 } from "lucide-react";

import { AuthShell } from "@/components/paircode/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch, readJsonError } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
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
        setError("Could not create guest session. Please try regular sign up.");
        return;
      }
      router.replace("/");
      router.refresh();
    } finally {
      setGuestSubmitting(false);
    }
  }

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });
      if (!res.ok) {
        const authError = await readJsonError(res);
        setError(
          authError.code === "email_taken" || authError.status === 409
            ? "An account with this email already exists."
            : authError.code === "weak_password"
              ? authError.detail ??
                "Password must be at least 12 characters and include 3 of: uppercase, lowercase, number, symbol."
            : authError.code === "auth_misconfigured" || authError.status === 500
              ? "Authentication is temporarily misconfigured. Please contact support."
              : authError.code === "invalid_input" || authError.status === 400
                ? "Please check your details — all fields are required and your email must be valid."
                : authError.code === "rate_limited" || authError.status === 429
                  ? "Too many sign-ups from this network. Please wait and try again."
                  : "We could not create your account right now. Please try again in a moment.",
        );
        return;
      }
      router.replace("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Apply for a credential"
      description="An operator account is the identity every room checks. Create one, and the server issues the access token, the rotating refresh token, and the socket ticket that get you through the door."
      bearerName={displayName}
      bearerSeed={email}
      formTitle="Credential application"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="flex w-full flex-col gap-3.5"
      >
        <label className="block">
          <span className="legend mb-1 block">Name on the credential</span>
          <Input
            type="text"
            autoComplete="name"
            required
            minLength={1}
            maxLength={64}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Ada Lovelace"
            className="h-10"
          />
        </label>

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
              autoComplete="new-password"
              required
              minLength={12}
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
          <span className="note mt-1 block">
            12+ characters, at least 3 of: uppercase, lowercase, number, symbol.
          </span>
        </label>

        {error ? (
          <p className="print-in border border-(--cancel) bg-(--cancel-tint) px-2.5 py-2 text-[0.8125rem] leading-relaxed text-(--cancel)">
            <span className="legend mr-1.5 text-(--cancel)">Refused</span>
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={submitting || guestSubmitting}>
          {submitting ? "Issuing credential…" : "Create account"}
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

        <p className="mt-1 border-t border-(--rule) pt-3 text-center text-[0.8125rem] text-(--ink-2)">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-[600] text-(--secure) underline decoration-(--secure)/40 transition-colors hover:decoration-(--secure)"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
