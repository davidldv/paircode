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
        "flex h-10 w-full min-w-0 rounded-[10px] border border-(--panel-border) bg-(--surface-strong) px-3.5 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-(--muted) hover:border-(--panel-border-strong) focus-visible:border-(--accent) focus-visible:bg-(--surface) focus-visible:ring-4 focus-visible:ring-(--focus-ring) disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
});

export { Input };
