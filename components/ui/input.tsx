import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function Input(
  { className, type, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_82%,transparent)] px-3.5 py-1 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] outline-none transition-all placeholder:text-(--muted) focus-visible:border-(--panel-border-strong) focus-visible:ring-2 focus-visible:ring-(--focus-ring)",
        className
      )}
      {...props}
    />
  );
});

export { Input };
