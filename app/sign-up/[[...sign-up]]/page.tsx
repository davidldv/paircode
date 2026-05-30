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
        className="flex w-full flex-col gap-4 animate-fade-in"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
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
            className="h-11"
          />
        </label>
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
              autoComplete="new-password"
              required
              minLength={12}
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
          <span className="text-xs text-(--muted)">
            12+ characters, at least 3 of: uppercase, lowercase, number, symbol.
          </span>
        </label>
        {error ? (
          <p className="rounded-[10px] border border-(--danger)/30 bg-(--danger-tint) px-3.5 py-2.5 text-sm text-(--danger) animate-slide-up">
            {error}
          </p>
        ) : null}

        <div className="mt-2 flex flex-col gap-2.5">
          <Button type="submit" size="lg" disabled={submitting || guestSubmitting} className="text-[15px]">
            {submitting ? "Signing up…" : "Sign up"}
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
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-(--accent) transition-colors hover:text-(--accent-soft)">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
