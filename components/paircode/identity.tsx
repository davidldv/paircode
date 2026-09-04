import { Guilloche } from "@/components/paircode/guilloche";
import { initialsFromName } from "@/lib/paircode";
import { cn } from "@/lib/utils";

/**
 * The portrait panel of an issued credential. Where a badge would carry a
 * photograph, this carries the operator's guilloché — a figure engraved from
 * their own id — with their initials struck over it.
 */
export function IdentityPanel({
  seed,
  name,
  className,
  machine = false,
}: {
  seed: string;
  name: string;
  className?: string;
  machine?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border",
        machine
          ? "border-(--secure-deep) bg-(--secure) text-(--secure-ink)"
          : "border-(--rule) bg-(--stock-sunk) text-(--secure)",
        className
      )}
    >
      <Guilloche seed={seed} detail={4} className="absolute inset-0 h-full w-full" opacity={0.9} />
      <span
        className={cn(
          "relative text-[0.8125rem] font-[700] tracking-[0.06em] [font-stretch:78%]",
          machine ? "text-(--secure-ink)" : "text-(--ink)"
        )}
      >
        {initialsFromName(name)}
      </span>
    </span>
  );
}

/** The same figure at register-entry scale, for a line in the access log. */
export function IdentityChip({
  seed,
  name,
  machine = false,
  className,
}: {
  seed: string;
  name: string;
  machine?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border",
        machine
          ? "border-(--secure-deep) bg-(--secure) text-(--secure-ink)"
          : "border-(--rule) bg-(--stock-sunk) text-(--secure)",
        className
      )}
    >
      <Guilloche seed={seed} detail={1} className="absolute inset-0 h-full w-full" opacity={0.75} />
      <span
        className={cn(
          "relative text-[0.5625rem] font-[700] tracking-[0.04em] [font-stretch:78%]",
          machine ? "text-(--secure-ink)" : "text-(--ink)"
        )}
      >
        {initialsFromName(name)}
      </span>
    </span>
  );
}
