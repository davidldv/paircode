import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "field-sizing-content flex min-h-16 w-full rounded-xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_82%,transparent)] px-3.5 py-2.5 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] outline-none transition-all placeholder:text-(--muted) focus-visible:border-(--panel-border-strong) focus-visible:ring-2 focus-visible:ring-(--focus-ring)",
        className
      )}
      {...props}
    />
  );
});

export { Textarea };
