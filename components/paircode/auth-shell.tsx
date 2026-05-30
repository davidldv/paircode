import type { ReactNode } from "react";

import { BrandConstellation } from "@/components/paircode/brand-constellation";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen bg-background text-foreground selection:bg-(--accent) selection:text-(--accent-contrast)">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,500px)] lg:px-8">
        <section className="fade-up space-y-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--surface) ring-1 ring-(--panel-border)">
                <img src="/brand/paircode-mark.svg" alt="" width={20} height={20} className="opacity-90" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground">PairCode</span>
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-xl text-base leading-7 text-(--muted)">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="metric-tile">
              <p className="mono-label text-[11px] text-(--accent)">Persistent context</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Threaded room context and implementation history survive reconnects.
              </p>
            </div>
            <div className="metric-tile">
              <p className="mono-label text-[11px] text-(--accent)">Authenticated operators</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Each collaborator enters the workspace with a verified engineering identity.
              </p>
            </div>
            <div className="metric-tile">
              <p className="mono-label text-[11px] text-(--accent)">Live facilitation</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Presence, AI facilitation, and room state stay synchronized for the whole team.
              </p>
            </div>
          </div>

          <BrandConstellation />
        </section>

        <div className="hero-shell fade-up-delay mx-auto w-full max-w-md p-8">
          <div className="mb-8 space-y-2 border-b border-(--panel-border) pb-7">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Enter PairCode</h2>
            <p className="text-sm leading-relaxed text-(--muted)">
              Authenticate to access collaborative engineering rooms with persistent context, live presence, and AI
              facilitation.
            </p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
