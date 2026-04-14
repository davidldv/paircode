import Image from "next/image";

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
        "border-2 border-[var(--panel-border)] bg-[var(--surface-strong)] p-4 shadow-[4px_4px_0px_0px_var(--panel-border)] rounded-none",
        className,
      )}
    >
      <div className={cn("flex gap-4", compact ? "items-center" : "items-start")}>
        <div
          className={cn(
            "shrink-0 border-2 border-[var(--panel-border)] bg-[var(--surface)] shadow-[2px_2px_0px_0px_var(--panel-border)] rounded-none",
            compact ? "p-2.5" : "p-3",
          )}
        >
          <Image
            src="/brand/paircode-mark.svg"
            alt="PairCode mark"
            width={compact ? 52 : 64}
            height={compact ? 52 : 64}
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <h3 className={cn("font-black uppercase tracking-widest text-[var(--foreground)]", compact ? "text-xl" : "text-2xl")}>PairCode Capability Constellation</h3>
          <p className="max-w-3xl text-xs font-mono uppercase tracking-wide leading-6 text-[var(--muted)]">
            The mark and capability icons now map the product story directly into the interface: shared context, live presence, AI facilitation, and durable implementation history.
          </p>
        </div>
      </div>

      <div className={cn("mt-6 grid gap-3", compact ? "md:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2")}>
        {capabilityCards.map((card) => (
          <article
            key={card.title}
            className="border-2 border-[var(--panel-border)] bg-[var(--surface)] p-3 shadow-[2px_2px_0px_0px_var(--panel-border)] transition-transform hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0px_0px_var(--accent)] rounded-none"
          >
            <div className="flex items-start gap-3">
              <div className="border-2 border-[var(--panel-border)] bg-[var(--surface-strong)] p-2 rounded-none">
                <Image src={card.icon} alt="" width={40} height={40} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase text-[var(--foreground)]">{card.title}</p>
                <p className="mt-1 text-xs leading-5 font-mono text-[var(--muted)]">{card.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}