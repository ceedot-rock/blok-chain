import type { CSSProperties } from "react";
import {
  ASSETS,
  type BlockCell,
  type PortMask,
  E,
  N,
  S,
  W,
  portCount,
  shapeLabel,
} from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface BlockTileProps {
  cell: BlockCell;
  linked: { n: boolean; e: boolean; s: boolean; w: boolean };
  onRotate: () => void;
  disabled?: boolean;
  highlight?: boolean;
  sizePx: number;
}

function PortArm({
  dir,
  linked,
  color,
  thick,
}: {
  dir: "n" | "e" | "s" | "w";
  linked: boolean;
  color: string;
  thick: boolean;
}) {
  const w = thick ? "w-[28%]" : "w-[22%]";
  const h = thick ? "h-[28%]" : "h-[22%]";
  const base =
    "absolute rounded-full transition-[background-color,box-shadow,opacity] duration-150";
  const on = linked
    ? "opacity-100 shadow-[0_0_8px_color-mix(in_oklab,var(--arm)_40%,transparent)]"
    : "opacity-80";

  const styles: Record<string, string> = {
    n: `left-1/2 top-0 h-[46%] ${w} -translate-x-1/2 origin-top`,
    e: `right-0 top-1/2 ${h} w-[46%] -translate-y-1/2 origin-right`,
    s: `left-1/2 bottom-0 h-[46%] ${w} -translate-x-1/2 origin-bottom`,
    w: `left-0 top-1/2 ${h} w-[46%] -translate-y-1/2 origin-left`,
  };

  return (
    <span
      className={`${base} ${styles[dir]} ${on}`}
      style={
        {
          background: color,
          ["--arm" as string]: color,
        } as CSSProperties
      }
    />
  );
}

export function BlockTile({
  cell,
  linked,
  onRotate,
  disabled,
  highlight,
  sizePx,
}: BlockTileProps) {
  const asset = ASSETS.find((a) => a.id === cell.asset) ?? ASSETS[7]!;
  const has = (d: PortMask) => (cell.ports & d) !== 0;
  const ports = portCount(cell.ports);
  const thick = ports >= 3;
  const font = Math.max(9, Math.floor(sizePx * 0.17));
  const shape = shapeLabel(cell.ports);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onRotate}
      aria-label={`Rotate ${asset.ticker} ${shape} block`}
      title={`${asset.ticker} · ${shape} · ${ports} ports`}
      className={cn(
        "relative flex items-center justify-center rounded-[calc(var(--radius-sm)+2px)] border bg-[var(--color-elevated)] shadow-[0_1px_2px_rgb(26_29_28/0.04)] transition-[border-color,transform,box-shadow] duration-150 ease-out select-none touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35",
        "hover:border-[var(--color-border-strong)] active:scale-[0.96]",
        highlight
          ? "border-[var(--color-primary)] shadow-[0_0_0_1px_var(--color-primary)]"
          : "border-[var(--color-border)]",
        disabled && "opacity-80",
      )}
      style={{ width: sizePx, height: sizePx }}
    >
      {ports >= 3 && (
        <span
          className="absolute left-1/2 top-1/2 z-0 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25"
          style={{ background: asset.color }}
        />
      )}

      {has(N) && (
        <PortArm dir="n" linked={linked.n} color={asset.color} thick={thick} />
      )}
      {has(E) && (
        <PortArm dir="e" linked={linked.e} color={asset.color} thick={thick} />
      )}
      {has(S) && (
        <PortArm dir="s" linked={linked.s} color={asset.color} thick={thick} />
      )}
      {has(W) && (
        <PortArm dir="w" linked={linked.w} color={asset.color} thick={thick} />
      )}

      <span
        className="relative z-10 flex h-[42%] w-[42%] flex-col items-center justify-center rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface)] font-semibold tracking-tight"
        style={{ color: asset.color, fontSize: font }}
      >
        <span className="leading-none">
          {asset.ticker === "bLOkz" ? "bL" : asset.ticker.slice(0, 3)}
        </span>
        {sizePx >= 52 && (
          <span className="mt-0.5 text-[9px] font-medium leading-none text-[var(--color-subtle)]">
            {ports}p
          </span>
        )}
      </span>
    </button>
  );
}
