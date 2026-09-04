import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* A control on an issued document is a stamped legend, not a pill: square,
   ruled, and pressed down rather than scaled. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[2px] border font-[600] uppercase tracking-[0.11em] [font-stretch:78%] outline-none transition-[background-color,border-color,color] duration-100 ease-linear disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "stamp-press border-(--secure-deep) bg-(--secure) text-(--secure-ink) hover:bg-(--secure-deep)",
        secondary:
          "border-(--rule-strong) bg-(--stock-face) text-(--ink) transition-transform hover:bg-(--stock-rack) active:translate-y-px",
        ghost:
          "border-transparent bg-transparent text-(--ink-2) transition-transform hover:bg-(--secure-tint) hover:text-(--ink) active:translate-y-px",
        cancel:
          "border-(--cancel) bg-transparent text-(--cancel) transition-transform hover:bg-(--cancel-tint) active:translate-y-px",
      },
      size: {
        default: "h-9 px-3.5 text-xs",
        sm: "h-7 px-2.5 text-[0.6875rem]",
        lg: "h-11 px-5 text-[0.8125rem]",
        icon: "h-8 w-8 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
