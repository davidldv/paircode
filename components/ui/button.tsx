import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-0",
  {
    variants: {
      variant: {
        default:
          "border border-[color-mix(in_srgb,var(--accent)_76%,white)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_88%,white),color-mix(in_srgb,var(--accent)_78%,black))] text-[#fff8ef] shadow-[0_16px_30px_-18px_rgba(216,93,45,0.95)] hover:-translate-y-0.5 hover:shadow-[0_20px_34px_-18px_rgba(216,93,45,0.85)] active:translate-y-0 active:shadow-[0_10px_22px_-16px_rgba(216,93,45,0.8)]",
        secondary:
          "border border-(--panel-border) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-soft)_80%,transparent),color-mix(in_srgb,var(--panel-strong)_100%,transparent))] text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 hover:border-(--panel-border-strong) hover:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-soft)_92%,transparent),color-mix(in_srgb,var(--panel-strong)_100%,transparent))]",
        ghost: "text-[color:var(--muted)] hover:bg-[color-mix(in_srgb,var(--panel-soft)_90%,transparent)] hover:text-[color:var(--foreground)]",
      },
      size: {
        default: "h-11 px-4.5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-6",
        icon: "h-10 w-10 rounded-xl",
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
