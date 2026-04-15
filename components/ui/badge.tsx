import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border-2 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--panel-border)]",
  {
    variants: {
      variant: {
        default: "border-(--panel-border) bg-(--surface-strong) text-foreground",
        success: "border-(--panel-border) bg-(--success) text-(--background)",
        danger: "border-(--panel-border) bg-[#ff0000] text-[#ffffff]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
