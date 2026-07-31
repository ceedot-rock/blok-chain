import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/lib/game/store";
import { DIFFICULTIES, type Difficulty } from "@/lib/game/types";
import { cn, formatNumber, formatTime } from "@/lib/utils";
import { Trophy, Timer } from "lucide-react";

type BoardKind = "score" | "time";

export function LeaderboardPanel() {
  const scoreboard = useGameStore((s) => s.scoreboard);
  const timeboard = useGameStore((s) => s.timeboard);
  const [kind, setKind] = useState<BoardKind>("score");
  const [filter, setFilter] = useState<Difficulty | "all">("all");

  const rows = useMemo(() => {
    const src = kind === "score" ? scoreboard : timeboard;
    const filtered =
      filter === "all" ? src : src.filter((r) => r.difficulty === filter);
    return filtered.slice(0, 50);
  }, [scoreboard, timeboard, kind, filter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[var(--color-primary)]" />
          Top 50 Leaderboards
        </CardTitle>
        <CardDescription>
          Ranked by score (clicks × time) and by completion time. Partial rounds
          still post score from clicks remaining.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={kind === "score" ? "default" : "secondary"}
            onClick={() => setKind("score")}
          >
            <Trophy className="h-3.5 w-3.5" />
            Score
          </Button>
          <Button
            size="sm"
            variant={kind === "time" ? "default" : "secondary"}
            onClick={() => setKind("time")}
          >
            <Timer className="h-3.5 w-3.5" />
            Time
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <Button
              key={d}
              size="sm"
              variant={filter === d ? "outline" : "ghost"}
              onClick={() => setFilter(d)}
            >
              {d === "all" ? "All tiers" : DIFFICULTIES[d].label}
            </Button>
          ))}
        </div>

        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
          <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-2 border-b border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-[11px] uppercase tracking-wide text-[var(--color-subtle)] sm:grid-cols-[2.5rem_1fr_auto_auto_auto_auto]">
            <span>#</span>
            <span>Gamer</span>
            <span className="hidden sm:inline">Tier</span>
            <span className="hidden sm:inline">Clicks</span>
            <span>{kind === "score" ? "Score" : "Time"}</span>
            <span className="text-right">{kind === "score" ? "Time" : "Score"}</span>
          </div>
          <ul className="max-h-[28rem] overflow-y-auto">
            {rows.map((row, i) => (
              <li
                key={row.id}
                className={cn(
                  "grid grid-cols-[2rem_1fr_auto_auto] items-center gap-2 border-b border-[var(--color-border)]/70 px-3 py-2.5 text-sm last:border-0 sm:grid-cols-[2.5rem_1fr_auto_auto_auto_auto]",
                  i < 3 && "bg-[var(--color-primary)]/[0.04]",
                )}
              >
                <span className="tabular text-[var(--color-muted)]">{i + 1}</span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium">{row.name}</span>
                  {row.completed === false && (
                    <Badge variant="warn" className="shrink-0">
                      partial
                    </Badge>
                  )}
                </span>
                <span className="hidden sm:inline">
                  <Badge variant="muted">{DIFFICULTIES[row.difficulty].label}</Badge>
                </span>
                <span className="hidden tabular text-[var(--color-muted)] sm:inline">
                  {row.moves}
                </span>
                <span className="tabular font-semibold text-[var(--color-primary)]">
                  {kind === "score"
                    ? formatNumber(row.score)
                    : formatTime(row.timeMs / 1000)}
                </span>
                <span className="text-right tabular text-[var(--color-muted)]">
                  {kind === "score"
                    ? formatTime(row.timeMs / 1000)
                    : formatNumber(row.score)}
                </span>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-[var(--color-muted)]">
                No runs yet for this filter.
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
