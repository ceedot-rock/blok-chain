import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { GameBoard } from "./GameBoard";
import { Hud } from "./Hud";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGameStore } from "@/lib/game/store";
import {
  ASSETS,
  DIFFICULTIES,
  PORT_SHAPES,
  type Difficulty,
} from "@/lib/game/types";
import { cn, formatNumber, formatTime } from "@/lib/utils";
import {
  Flag,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export function PlayPanel() {
  const phase = useGameStore((s) => s.phase);
  const board = useGameStore((s) => s.board);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const startGame = useGameStore((s) => s.startGame);
  const rotateAt = useGameStore((s) => s.rotateAt);
  const useHint = useGameStore((s) => s.useHint);
  const tick = useGameStore((s) => s.tick);
  const forfeit = useGameStore((s) => s.forfeit);
  const backToMenu = useGameStore((s) => s.backToMenu);
  const moves = useGameStore((s) => s.moves);
  const endsAt = useGameStore((s) => s.endsAt);
  const lastResult = useGameStore((s) => s.lastResult);
  const lastScore = useGameStore((s) => s.lastScore);
  const lastTimeMs = useGameStore((s) => s.lastTimeMs);
  const lastClicksAway = useGameStore((s) => s.lastClicksAway);
  const lastBreakdown = useGameStore((s) => s.lastBreakdown);
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const balance = useGameStore((s) => s.balance);
  const hasHydrated = useGameStore((s) => s.hasHydrated);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      setNow(Date.now());
      tick();
    }, 250);
    return () => window.clearInterval(id);
  }, [phase, tick]);

  const timeLeft = endsAt ? Math.max(0, (endsAt - now) / 1000) : 0;

  if (!hasHydrated) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-[var(--color-muted)]">
          Loading forge…
        </CardContent>
      </Card>
    );
  }

  if (phase === "menu") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="mb-3">
              <BrandLogo size={56} variant="word" />
            </div>
            <CardTitle className="text-xl tracking-tight sm:text-2xl">
              Compile random blocks into one solid chain
            </CardTitle>
            <CardDescription className="max-w-2xl text-pretty">
              Rich port shapes — ends, straights, corners, tees, and crosses. You
              get <span className="text-[var(--color-primary)]">5:00</span> on the
              clock. Finish with few clicks to multiply leftover time into score.
              Time out? Round score uses how many optimal clicks remain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                  Display name
                </label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={18}
                  placeholder="Your handle"
                />
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3 text-sm">
                <div className="text-[11px] uppercase tracking-wide text-[var(--color-subtle)]">
                  Wallet
                </div>
                <div className="font-semibold tabular text-[var(--color-primary)]">
                  {formatNumber(balance)} $bLOkz
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                Difficulty tier · all rounds 5:00
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(DIFFICULTIES) as Difficulty[]).map((id) => {
                  const d = DIFFICULTIES[id];
                  const active = difficulty === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDifficulty(id)}
                      className={cn(
                        "rounded-[var(--radius-lg)] border p-4 text-left transition-[border-color,background-color] duration-150",
                        active
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                          : "border-[var(--color-border)] bg-[var(--color-elevated)] hover:border-[var(--color-border-strong)]",
                      )}
                    >
                      <div className="mb-1 font-semibold">{d.label}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {d.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                Port shapes in the pool
              </div>
              <div className="flex flex-wrap gap-2">
                {PORT_SHAPES.map((s) => (
                  <Badge key={s.id} variant="muted">
                    {s.label}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {ASSETS.map((a) => (
                  <Badge key={a.id} variant="muted" className="gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: a.color }}
                    />
                    {a.ticker}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => startGame()}
            >
              <Play className="h-4 w-4" />
              Start 5:00 forge
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
            <HowStep
              n="01"
              title="Clicks matter"
              body="Every rotate is a click. Fewer clicks × leftover seconds = higher score."
            />
            <HowStep
              n="02"
              title="5-minute clock"
              body="Countdown from 5:00. Finish early to multiply your efficiency."
            />
            <HowStep
              n="03"
              title="Timeout credit"
              body="If time hits zero, score uses optimal clicks still needed to solidify."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <Hud
            difficulty={difficulty}
            timeLeft={timeLeft}
            moves={moves}
            clicksAway={lastClicksAway}
            result={lastResult}
          />

          {board && (
            <GameBoard
              board={board}
              onRotate={rotateAt}
              disabled={phase !== "playing"}
              solved={phase === "won"}
            />
          )}

          {phase === "playing" && (
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const res = useHint();
                  if (!res.ok) toast.error(res.error);
                  else toast.success("Hint applied · −25 $bLOkz");
                }}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Hint (25)
              </Button>
              <Button variant="danger" size="sm" onClick={() => forfeit()}>
                <Flag className="h-3.5 w-3.5" />
                Forfeit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {(phase === "won" || phase === "lost") && (
        <Card className="border-[var(--color-primary)]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {phase === "won" ? (
                <>
                  <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                  Chain solidified
                </>
              ) : (
                "Round complete — unfinished"
              )}
            </CardTitle>
            <CardDescription>
              {phase === "won"
                ? "Score = click efficiency × leftover time. Posted to top 50."
                : `Clock ran out or forfeit. Scored from ${formatNumber(lastClicksAway)} optimal clicks still needed.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <EndStat label="Round score" value={formatNumber(lastScore)} />
              <EndStat label="Time used" value={formatTime(lastTimeMs / 1000)} />
              <EndStat label="Clicks used" value={formatNumber(moves)} />
              <EndStat
                label={phase === "won" ? "Click pts" : "Clicks away"}
                value={
                  phase === "won"
                    ? formatNumber(lastBreakdown?.clickPts ?? 0)
                    : formatNumber(lastClicksAway)
                }
              />
              <EndStat
                label={phase === "won" ? "Time pts" : "Proximity pts"}
                value={formatNumber(
                  phase === "won"
                    ? (lastBreakdown?.timePts ?? 0)
                    : (lastBreakdown?.clickPts ?? 0),
                )}
              />
              <EndStat
                label="Reward"
                value={
                  lastBreakdown && lastBreakdown.reward > 0
                    ? `+${formatNumber(lastBreakdown.reward)} $bLOkz`
                    : "—"
                }
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => startGame()}>
                <RotateCcw className="h-4 w-4" />
                Play again
              </Button>
              <Button variant="secondary" onClick={() => backToMenu()}>
                Back to menu
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HowStep({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-primary)]">
        {n}
      </div>
      <div className="mb-1 font-semibold">{title}</div>
      <p className="text-sm text-[var(--color-muted)]">{body}</p>
    </div>
  );
}

function EndStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-[var(--color-subtle)]">
        {label}
      </div>
      <div className="text-base font-semibold tabular">{value}</div>
    </div>
  );
}
