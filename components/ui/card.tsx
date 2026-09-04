import * as React from "react";

import { cn } from "@/lib/utils";

/* A sheet of the room's paperwork: ruled, square, flat. The only rounded
   things on this surface are issued credentials. */
function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="card" className={cn("sheet", className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("sheet-head", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="card-title" className={cn("legend legend-lg text-(--secure-ink)", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("px-3 pt-2.5 text-[0.8125rem] leading-relaxed text-(--ink-2)", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-3", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
