import { cn } from "@/lib/utils";

const capabilityCards = [
  {
    title: "Persistent Context",
    description: "Threaded room context keeps files, requirements, and decisions visible to everyone.",
    icon: "/brand/context-thread.svg",
  },
  {
    title: "Live Presence",
    description: "Operators, memberships, and join state stay synchronized while the room is active.",
    icon: "/brand/live-presence.svg",
  },
  {
    title: "AI Facilitation",
    description: "The room agent works from the shared implementation surface instead of isolated prompts.",
    icon: "/brand/ai-facilitation.svg",
  },
  {
    title: "Implementation History",
    description: "Audit events and room messages persist so the team can reconnect without losing context.",
    icon: "/brand/implementation-history.svg",
  },
] as const;

type BrandConstellationProps = {
  compact?: boolean;
  className?: string;
};

export function BrandConstellation({ compact = false, className }: BrandConstellationProps) {
  return (
    <section
      className={cn(
        "border border-[var(--panel-border)] bg-[var(--surface)] p-6 shadow-sm rounded-xl transition-all duration-300 hover:shadow-md animate-fade-in",
        className,
      )}
    >
      <div className={cn("flex gap-4", compact ? "items-center" : "items-start")}>
        <div
          className={cn(
            "shrink-0 bg-[var(--surface-strong)] rounded-xl flex items-center justify-center transition-all duration-500 hover:scale-105 hover:rotate-3",
            compact ? "p-2.5" : "p-4",
          )}
        >
          <img
            src="/brand/paircode-mark.svg"
            alt="PairCode mark"
            width={compact ? 48 : 56}
            height={compact ? 48 : 56}
            className="animate-pulse-slow"
          />
        </div>

        <div className="min-w-0 space-y-2">
          <h3 className={cn("font-bold tracking-tight text-[var(--foreground)]", compact ? "text-xl" : "text-2xl")}>
            PairCode Capability Constellation
          </h3>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
            The mark and capability icons map the product story directly into the interface: shared context, live presence, AI facilitation, and durable implementation history.
          </p>
        </div>
      </div>

      <div className={cn("mt-8 grid gap-4", compact ? "md:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2")}>
        {capabilityCards.map((card, i) => (
          <article
            key={card.title}
            className="group relative overflow-hidden border border-[var(--panel-border)] bg-[var(--surface)] p-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--accent-glow)] animate-slide-up"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-glow)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--surface-strong)] flex items-center justify-center text-[var(--accent)] transition-transform duration-300 group-hover:scale-110">
                <img src={card.icon} alt="" width={24} height={24} aria-hidden className="opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">{card.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{card.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}