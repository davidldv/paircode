import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  {
    variants: {
      variant: {
        default: "border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_88%,transparent)] text-(--muted)",
        success: "border-[#96c8a8] bg-[#e9f8ee] text-[#236645]",
        danger: "border-[#e7a49b] bg-[#fdeceb] text-[#8d2d2a]",
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
