import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* A mark printed onto the document. Every variant carries a word, so the
   state never rides on hue alone. */
const badgeVariants = cva(
  "legend inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-[0.15rem]",
  {
    variants: {
      variant: {
        default: "border-(--rule-strong) bg-(--stock-rack) text-(--ink-2)",
        success: "border-transparent bg-(--secure) text-(--secure-ink)",
        provisional: "border-(--provisional) bg-(--provisional-tint) text-(--provisional)",
        danger: "border-(--cancel) bg-(--cancel-tint) text-(--cancel)",
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
