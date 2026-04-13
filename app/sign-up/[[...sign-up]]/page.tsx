"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AuthShell } from "@/components/paircode/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch, readJsonError } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });
      if (!res.ok) {
        const message = await readJsonError(res);
        setError(
          message === "email_in_use"
            ? "An account with this email already exists."
            : message === "weak_password"
              ? "Password must be at least 12 characters and mix upper, lower, numbers, or symbols."
              : message === "rate_limited"
                ? "Too many sign-ups from this network. Please wait and try again."
                : "Sign-up failed. Please verify your details and try again.",
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
        className="flex w-full flex-col gap-4"
      >
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-(--muted)">
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
          />
        </label>
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
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <span className="text-[10px] font-mono text-(--muted)">
            12+ characters, mix of upper / lower / numbers / symbols.
          </span>
        </label>
        {error ? (
          <p className="border-2 border-(--panel-border) bg-(--surface) px-3 py-2 text-xs font-mono text-(--danger,#b00020)">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-xs font-mono text-(--muted)">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline underline-offset-4">
            Sign in
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
