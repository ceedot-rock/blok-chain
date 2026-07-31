import { cn } from "@/lib/utils";

/**
 * Single brand mark: bold BLoK in stone black with orange-gold edges.
 * Vector SVG — stays sharp at any size (no photo / compression stretch).
 */
export function BrandLogo({
  size = 40,
  className,
  variant = "mark",
}: {
  size?: number;
  className?: string;
  /** mark = square app icon; word = wide BLoK wordmark */
  variant?: "mark" | "word";
}) {
  if (variant === "word") {
    return (
      <img
        src="/logo-blok.svg"
        alt="BLoK"
        height={size}
        draggable={false}
        className={cn("shrink-0 object-contain object-left", className)}
        style={{ height: size, width: "auto", maxWidth: size * 3.2 }}
      />
    );
  }

  return (
    <img
      src="/logo-blok-mark.svg"
      alt="BLoK"
      width={size}
      height={size}
      draggable={false}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function BrandWordmark({
  subtitle = "$bLOkz protocol puzzle",
  className,
}: {
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandLogo size={40} variant="mark" />
      <div className="min-w-0">
        <div className="truncate text-base font-semibold tracking-tight sm:text-lg">
          bLOK CHaiN
        </div>
        <p className="truncate text-[11px] text-[var(--color-muted)]">{subtitle}</p>
      </div>
    </div>
  );
}
