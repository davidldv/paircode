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
        "field-sizing-content flex min-h-16 w-full rounded-[10px] border border-(--panel-border) bg-(--surface-strong) px-3.5 py-2.5 text-sm leading-relaxed text-foreground outline-none transition-all duration-150 placeholder:text-(--muted) hover:border-(--panel-border-strong) focus-visible:border-(--accent) focus-visible:bg-(--surface) focus-visible:ring-4 focus-visible:ring-(--focus-ring) disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
});

export { Textarea };
