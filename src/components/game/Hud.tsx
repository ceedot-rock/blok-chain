import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTIES, type Difficulty, type SolveResult } from "@/lib/game/types";
import { formatNumber, formatTime } from "@/lib/utils";
import { Link2, Move, Timer, Target } from "lucide-react";

interface HudProps {
  difficulty: Difficulty;
  timeLeft: number;
  moves: number;
  clicksAway: number;
  result: SolveResult | null;
}

export function Hud({
  difficulty,
  timeLeft,
  moves,
  clicksAway,
  result,
}: HudProps) {
  const cfg = DIFFICULTIES[difficulty];
  const urgent = timeLeft <= 30;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          icon={<Timer className="h-3.5 w-3.5" />}
          label="Countdown"
          value={formatTime(timeLeft)}
          warn={urgent}
        />
        <Stat
          icon={<Move className="h-3.5 w-3.5" />}
          label="Clicks"
          value={formatNumber(moves)}
        />
        <Stat
          icon={<Target className="h-3.5 w-3.5" />}
          label="Clicks away"
          value={formatNumber(clicksAway)}
        />
        <Stat
          icon={<Link2 className="h-3.5 w-3.5" />}
          label="Open ports"
          value={formatNumber(result?.openPorts ?? 0)}
        />
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-elevated)]">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-200"
          style={{
            width: `${Math.max(0, Math.min(100, (timeLeft / cfg.timeLimit) * 100))}%`,
            background: urgent
              ? "var(--color-danger)"
              : "var(--color-primary)",
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="muted">{cfg.label}</Badge>
        <Badge variant="muted">5:00 round</Badge>
        <span className="text-xs text-[var(--color-muted)]">
          Score = few clicks × leftover time. Timeout scores by clicks still needed.
        </span>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  warn,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-subtle)]">
        {icon}
        {label}
      </div>
      <div
        className={`text-lg font-semibold tabular tracking-tight ${
          warn ? "text-[var(--color-danger)]" : "text-[var(--color-fg)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
