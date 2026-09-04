import type { ReactNode } from "react";

import { IdentityPanel } from "@/components/paircode/identity";

type AuthShellProps = {
  title: string;
  description: string;
  /** Name printed on the credential preview as the applicant types it. */
  bearerName: string;
  /** Identity the guilloché is engraved from — the applicant's email. */
  bearerSeed: string;
  formTitle: string;
  children: ReactNode;
};

/* Every row is enforced in this repository; nothing here is aspirational. */
const CONFORMANCE = [
  ["Password storage", "Argon2id", "lib/auth/password.ts"],
  ["Access tokens", "EdDSA (Ed25519) JWT", "lib/auth/jwt.ts"],
  ["Refresh tokens", "Rotated, reuse detected and revoked", "lib/auth/refresh.ts"],
  ["Form submission", "CSRF token, double submit", "lib/auth/csrf.ts"],
  ["Socket handshake", "Single-use ticket, redeemed by delete", "lib/security/ws-ticket.ts"],
  ["Room authorization", "Server-side RBAC on every event", "server/ws-server.mjs"],
];

export function AuthShell({
  title,
  description,
  bearerName,
  bearerSeed,
  formTitle,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen">
      <div className="flex items-center gap-3 border-b border-(--secure-deep) bg-(--secure) px-3 py-2 text-(--secure-ink) md:px-6">
        <img src="/brand/paircode-mark.svg" alt="" width={26} height={26} />
        <span className="text-[0.9375rem] font-[700] uppercase tracking-[0.2em] [font-stretch:78%]">
          PairCode
        </span>
        <span className="legend ml-auto text-(--secure-ink)/85">Access control</span>
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-3 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-12 lg:py-14">
        {/* The door: what gets checked, and by what. */}
        <section>
          {/* The document's own title voice: the condensed grotesque the
              legends are set in, at the one display size this world has. */}
          <h1 className="max-w-[16ch] text-[2rem] font-[700] uppercase leading-[1.02] tracking-[0.01em] text-(--ink) [font-stretch:80%] sm:text-[2.875rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-[62ch] text-[0.9375rem] leading-[1.7] text-(--ink-2)">
            {description}
          </p>

          <div className="mt-8 border border-(--rule) bg-(--stock-face)">
            <div className="flex items-center gap-2 border-b border-(--secure-deep) bg-(--secure) px-3 py-1.5">
              <span className="legend text-(--secure-ink)">What the door enforces</span>
              <span className="legend ml-auto text-(--secure-ink)/85">In this repository</span>
            </div>
            <dl className="divide-y divide-(--rule)">
              {CONFORMANCE.map(([subject, mechanism, path]) => (
                <div
                  key={subject}
                  className="grid grid-cols-1 gap-x-4 gap-y-1 px-3 py-2.5 sm:grid-cols-[11rem_minmax(0,1fr)]"
                >
                  <dt className="legend pt-px">{subject}</dt>
                  <dd>
                    <span className="block text-[0.875rem] leading-snug text-(--ink)">
                      {mechanism}
                    </span>
                    <span className="value block text-[0.6875rem] text-(--ink-3)">{path}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="note mt-3">No third-party auth service sits behind these rows.</p>
        </section>

        {/* The application: a blank credential, filling in as you type. */}
        <div className="credential overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-(--secure-deep) bg-(--secure) px-3 py-1.5 text-(--secure-ink)">
            <span className="legend text-(--secure-ink)">{formTitle}</span>
            <span className="lamp" aria-hidden />
          </div>

          <div className="flex items-center gap-3 border-b border-(--rule) bg-(--stock-sunk) px-3 py-3">
            <IdentityPanel seed={bearerSeed || "unissued"} name={bearerName || "??"} />
            <div className="min-w-0">
              <span className="legend">Bearer</span>
              <p className="truncate text-[0.9375rem] font-[600] leading-tight text-(--ink)">
                {bearerName || "Unissued"}
              </p>
              <p className="value truncate text-[0.6875rem] text-(--ink-3)">
                {bearerSeed || "no identity presented"}
              </p>
            </div>
          </div>

          <div className="px-3 py-4">{children}</div>

          <div className="mrz" aria-hidden>
            <div>{"PAIRCODE<<ACCESS<CONTROL<".padEnd(30, "<")}</div>
            <div>{(bearerSeed ? "PENDING<VERIFICATION" : "NO<CREDENTIAL<PRESENTED").padEnd(30, "<")}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
