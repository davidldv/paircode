import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-wider transition-transform duration-100 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:shadow-[4px_4px_0px_0px_var(--accent)] focus-visible:-translate-y-0.5 focus-visible:-translate-x-0.5",
  {
    variants: {
      variant: {
        default:
          "border-2 border-[var(--panel-border)] bg-[var(--accent)] text-[var(--background)] shadow-[2px_2px_0px_0px_var(--panel-border)] hover:shadow-[4px_4px_0px_0px_var(--panel-border)] hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_0px_var(--panel-border)]",
        secondary:
          "border-2 border-[var(--panel-border)] bg-[var(--surface-strong)] text-[color:var(--foreground)] shadow-[2px_2px_0px_0px_var(--panel-border)] hover:shadow-[4px_4px_0px_0px_var(--accent)] hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_0px_var(--panel-border)]",
        ghost: "border-2 border-transparent text-[color:var(--muted)] hover:border-[var(--panel-border)] hover:text-[color:var(--foreground)] hover:shadow-[2px_2px_0px_0px_var(--panel-border)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_0px_var(--panel-border)]",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8",
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
