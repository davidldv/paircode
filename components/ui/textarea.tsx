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
        "field-sizing-content flex min-h-16 w-full rounded-none border-2 border-(--panel-border) bg-(--surface-strong) px-3.5 py-2.5 text-sm font-mono font-bold text-foreground shadow-[2px_2px_0px_0px_var(--panel-border)] outline-none transition-all placeholder:text-(--muted) placeholder:font-normal focus-visible:shadow-[4px_4px_0px_0px_var(--accent)] focus-visible:-translate-y-0.5 focus-visible:-translate-x-0.5 focus-visible:border-(--accent)",
        className
      )}
      {...props}
    />
  );
});

export { Textarea };
