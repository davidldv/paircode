import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-black/15 bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-black/50 focus-visible:border-black/40 focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:placeholder:text-white/50 dark:focus-visible:border-white/40 dark:focus-visible:ring-white/20",
        className
      )}
      {...props}
    />
  );
}

export { Input };
