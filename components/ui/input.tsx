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
        "flex h-10 w-full min-w-0 rounded-lg border border-(--line) bg-(--surface) px-3 py-1 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] outline-none transition-all placeholder:text-(--muted) focus-visible:border-(--accent) focus-visible:ring-2 focus-visible:ring-(--focus-ring)",
        className
      )}
      {...props}
    />
  );
});

export { Input };
