import type { ReactNode } from "react";

import { BrandConstellation } from "@/components/paircode/brand-constellation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="app-shell relative min-h-screen bg-background text-foreground selection:bg-[var(--accent)] selection:text-background">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,540px)] lg:px-8">
        <section className="fade-up space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl leading-none sm:text-5xl">{title}</h1>
            <p className="max-w-2xl text-base leading-7 text-(--muted)">{description}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="metric-tile">
              <p className="mono-label text-[10px] text-(--muted)">Persistent context</p>
              <p className="mt-2 text-sm font-semibold text-foreground">Threaded room context and implementation history survive reconnects.</p>
            </div>
            <div className="metric-tile">
              <p className="mono-label text-[10px] text-(--muted)">Authenticated operators</p>
              <p className="mt-2 text-sm font-semibold text-foreground">Each collaborator enters the workspace with a verified engineering identity.</p>
            </div>
            <div className="metric-tile">
              <p className="mono-label text-[10px] text-(--muted)">Live facilitation</p>
              <p className="mt-2 text-sm font-semibold text-foreground">Presence, AI facilitation, and room state stay synchronized for the whole team.</p>
            </div>
          </div>

          <BrandConstellation />
        </section>

        <Card className="hero-shell fade-up-delay mx-auto w-full max-w-xl border border-[var(--panel-border)] bg-[var(--surface)] p-8 shadow-xl rounded-2xl transition-all duration-500 animate-slide-up">
          <CardHeader className="space-y-4 pb-8 border-b border-[var(--panel-border)] mb-8">
            <div className="space-y-3">
              <CardTitle className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Enter PairCode</CardTitle>
              <CardDescription className="text-base leading-relaxed text-[var(--muted)]">
                Authenticate to access collaborative engineering rooms with persistent context, live presence, and AI facilitation.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center px-0">
            <div className="w-full">{children}</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}