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
        "flex h-11 w-full min-w-0 rounded-none border-2 border-[var(--panel-border)] bg-[var(--surface-strong)] px-3.5 py-1 text-sm font-mono font-bold text-[var(--foreground)] shadow-[2px_2px_0px_0px_var(--panel-border)] outline-none transition-all placeholder:text-[var(--muted)] placeholder:font-normal focus-visible:shadow-[4px_4px_0px_0px_var(--accent)] focus-visible:-translate-y-0.5 focus-visible:-translate-x-0.5 focus-visible:border-[var(--accent)]",
        className
      )}
      {...props}
    />
  );
});

export { Input };
