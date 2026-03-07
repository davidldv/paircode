import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
  {
    variants: {
      variant: {
        default:
          "border border-[color:var(--accent)] bg-[color:var(--accent)] text-[#fff8ef] shadow-[0_8px_20px_-14px_rgba(216,93,45,0.9)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0",
        secondary:
          "border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:-translate-y-0.5 hover:border-[color:var(--accent-soft)] hover:bg-[#fff5e7]",
        ghost: "text-[color:var(--muted)] hover:bg-[#f4e7cf] hover:text-[color:var(--foreground)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6",
        icon: "h-10 w-10",
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
