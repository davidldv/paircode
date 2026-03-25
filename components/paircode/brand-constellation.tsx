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
        "rounded-[1.6rem] border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_72%,transparent)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
        className,
      )}
    >
      <div className={cn("flex gap-4", compact ? "items-center" : "items-start")}>
        <div
          className={cn(
            "shrink-0 rounded-[1.3rem] border border-(--panel-border) bg-[linear-gradient(180deg,rgba(255,248,233,0.96),rgba(244,229,205,0.92))]",
            compact ? "p-2.5" : "p-3",
          )}
        >
          <Image
            src="/brand/paircode-mark.svg"
            alt="PairCode mark"
            width={compact ? 52 : 64}
            height={compact ? 52 : 64}
            priority
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <h3 className={cn("font-semibold tracking-tight text-foreground", compact ? "text-xl" : "text-2xl")}>PairCode Capability Constellation</h3>
          <p className="max-w-3xl text-sm leading-6 text-(--muted)">
            The mark and capability icons now map the product story directly into the interface: shared context, live presence, AI facilitation, and durable implementation history.
          </p>
        </div>
      </div>

      <div className={cn("mt-4 grid gap-3", compact ? "md:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2")}>
        {capabilityCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.25rem] border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-strong)_92%,transparent)] p-3"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-(--panel-border) bg-[rgba(255,255,255,0.66)] p-2">
                <Image src={card.icon} alt="" width={40} height={40} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                <p className="mt-1 text-xs leading-5 text-(--muted)">{card.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}