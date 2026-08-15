import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border border-border bg-card p-3 pl-12 text-sm text-foreground overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-[3px] [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3.5 [&>svg]:size-4.5",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-foreground before:bg-primary [&>svg]:text-primary",
        info: "border-border bg-card text-foreground before:bg-info [&>svg]:text-info",
        success: "border-border bg-card text-foreground before:bg-success [&>svg]:text-success",
        warning: "border-border bg-card text-foreground before:bg-warning [&>svg]:text-warning",
        destructive:
          "border-border bg-card text-foreground before:bg-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return (
    // oxlint-disable-next-line jsx-a11y/heading-has-content
    <h5
      data-slot="alert-title"
      className={cn("mb-0.5 font-semibold text-[13px] leading-tight tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-xs text-muted-foreground leading-normal", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
