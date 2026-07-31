import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
        muted:
          "border-[var(--color-border)] bg-[var(--color-elevated)] text-[var(--color-muted)]",
        success:
          "border-transparent bg-[var(--color-success)]/15 text-[var(--color-success)]",
        warn:
          "border-transparent bg-[var(--color-warn)]/15 text-[var(--color-warn)]",
        danger:
          "border-transparent bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
