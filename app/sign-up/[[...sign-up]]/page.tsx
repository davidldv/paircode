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
      title="Create your PairCode account"
      description="Create an authenticated operator account before entering collaborative rooms backed by persistent context and implementation history."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="flex w-full flex-col gap-5 animate-fade-in"
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Display name
          <Input
            type="text"
            autoComplete="name"
            required
            minLength={1}
            maxLength={64}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Ada Lovelace"
            className="h-12 px-4 rounded-xl border-[var(--panel-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-all bg-[var(--surface-strong)] hover:bg-[var(--surface)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Email
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-12 px-4 rounded-xl border-[var(--panel-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-all bg-[var(--surface-strong)] hover:bg-[var(--surface)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Password
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 pl-4 pr-12 rounded-xl border-[var(--panel-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-all bg-[var(--surface-strong)] hover:bg-[var(--surface)] w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-r-xl"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <span className="text-xs text-[var(--muted)]">
            12+ characters, at least 3 of: uppercase, lowercase, number, symbol.
          </span>
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
            className="h-12 text-base font-semibold rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-soft)] text-white shadow-lg shadow-[var(--accent-glow)] transition-all hover:scale-[1.02] active:scale-95"
          >
            {submitting ? "Signing up…" : "Sign up"}
          </Button>

          <Button 
            type="button" 
            onClick={submitGuest}
            variant="secondary"
            disabled={submitting || guestSubmitting} 
            className="h-12 text-base font-semibold rounded-xl border border-[var(--panel-border)] bg-[var(--surface-strong)] hover:bg-[var(--surface)] text-[var(--foreground)] transition-all hover:scale-[1.02] active:scale-95"
          >
            {guestSubmitting ? "Creating guest session…" : (
              <>
                <UserCircle2 className="w-5 h-5 mr-2" /> Try as Guest
              </>
            )}
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
