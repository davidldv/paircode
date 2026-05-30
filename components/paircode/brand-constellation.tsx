import { History, Layers, Radio, Sparkles, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const capabilityCards: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Persistent Context",
    description: "Threaded room context keeps files, requirements, and decisions visible to everyone.",
    icon: Layers,
  },
  {
    title: "Live Presence",
    description: "Operators, memberships, and join state stay synchronized while the room is active.",
    icon: Radio,
  },
  {
    title: "AI Facilitation",
    description: "The room agent works from the shared implementation surface instead of isolated prompts.",
    icon: Sparkles,
  },
  {
    title: "Implementation History",
    description: "Audit events and room messages persist so the team can reconnect without losing context.",
    icon: History,
  },
];

type BrandConstellationProps = {
  compact?: boolean;
  className?: string;
};

export function BrandConstellation({ compact = false, className }: BrandConstellationProps) {
  return (
    <section className={cn("surface-card p-6 animate-fade-in", className)}>
      <div className={cn("flex gap-4", compact ? "items-center" : "items-start")}>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl bg-(--surface-strong) ring-1 ring-(--panel-border)",
            compact ? "p-3" : "p-4",
          )}
        >
          <img
            src="/brand/paircode-mark.svg"
            alt="PairCode mark"
            width={compact ? 40 : 48}
            height={compact ? 40 : 48}
            className="opacity-90"
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <h3 className={cn("font-semibold tracking-tight text-foreground", compact ? "text-lg" : "text-xl")}>
            Capability constellation
          </h3>
          <p className="max-w-2xl text-sm leading-relaxed text-(--muted)">
            Shared context, live presence, AI facilitation, and durable implementation history — mapped straight into
            the interface.
          </p>
        </div>
      </div>

      <div className={cn("mt-6 grid gap-3", compact ? "md:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2")}>
        {capabilityCards.map((card, i) => (
          <article
            key={card.title}
            className="group relative overflow-hidden rounded-xl border border-(--panel-border) bg-(--surface-strong)/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-(--panel-border-strong) animate-slide-up"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--accent-tint) text-(--accent) transition-transform duration-300 group-hover:scale-105">
                <card.icon className="h-[18px] w-[18px]" aria-hidden strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{card.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-(--muted)">{card.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
