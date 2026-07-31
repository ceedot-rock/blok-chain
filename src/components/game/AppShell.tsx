import type { ReactNode } from "react";
import { useEffect } from "react";
import { BrandLogo, BrandWordmark } from "./BrandLogo";
import { ChatPanel } from "./ChatPanel";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { PlayPanel } from "./PlayPanel";
import { StakePanel } from "./StakePanel";
import { TokenomicsPanel } from "./TokenomicsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type AppTab, useGameStore } from "@/lib/game/store";
import { cn, formatNumber } from "@/lib/utils";
import {
  Blocks,
  Coins,
  MessageSquare,
  PieChart,
  Trophy,
  Wallet,
} from "lucide-react";
import { Toaster } from "sonner";

const TABS: { id: AppTab; label: string; icon: ReactNode }[] = [
  { id: "play", label: "Forge", icon: <Blocks className="h-4 w-4" /> },
  { id: "leaderboard", label: "Top 50", icon: <Trophy className="h-4 w-4" /> },
  { id: "stake", label: "Stake", icon: <Coins className="h-4 w-4" /> },
  { id: "tokenomics", label: "Tokenomics", icon: <PieChart className="h-4 w-4" /> },
  { id: "chat", label: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
];

export function AppShell() {
  const tab = useGameStore((s) => s.tab);
  const setTab = useGameStore((s) => s.setTab);
  const balance = useGameStore((s) => s.balance);
  const staked = useGameStore((s) => s.staked);
  const playerName = useGameStore((s) => s.playerName);
  const phase = useGameStore((s) => s.phase);
  const settleExpiredSession = useGameStore((s) => s.settleExpiredSession);
  const hasHydrated = useGameStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    settleExpiredSession();
    const onVis = () => {
      if (document.visibilityState === "visible") {
        settleExpiredSession();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [hasHydrated, settleExpiredSession]);

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 420px at 10% -8%, color-mix(in oklab, #c2410c 8%, transparent), transparent 58%), radial-gradient(720px 380px at 100% 0%, color-mix(in oklab, var(--color-primary) 8%, transparent), transparent 55%), linear-gradient(180deg, #eceeea 0%, var(--color-bg) 40%)",
        }}
      />

      <header className="sticky top-0 z-20 border-b border-[var(--color-border)]/90 bg-[var(--color-surface)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <BrandWordmark
            subtitle={
              phase === "playing"
                ? "$bLOkz · forge in progress"
                : "$bLOkz protocol puzzle"
            }
          />

          <div className="flex items-center gap-2">
            <Badge
              variant="muted"
              className="hidden max-w-[8rem] truncate sm:inline-flex"
            >
              {playerName}
            </Badge>
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-elevated)] px-2.5 py-1.5 text-xs sm:px-3">
              <Wallet className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              <span className="tabular font-semibold text-[var(--color-primary)]">
                {formatNumber(balance)}
              </span>
              <span className="hidden text-[var(--color-muted)] sm:inline">
                $bLOkz
              </span>
            </div>
            {staked > 0 && (
              <Badge variant="success" className="hidden sm:inline-flex">
                {formatNumber(staked)} staked
              </Badge>
            )}
          </div>
        </div>

        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-3 sm:px-6">
          {TABS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? "default" : "ghost"}
              className={cn(
                "shrink-0",
                tab !== t.id && "text-[var(--color-muted)]",
              )}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              {t.label}
              {t.id === "play" && phase === "playing" && tab !== "play" ? (
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary-fg)]" />
              ) : null}
            </Button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <div className={cn(tab !== "play" && "hidden")}>
          <PlayPanel />
        </div>
        <div className={cn(tab !== "leaderboard" && "hidden")}>
          <LeaderboardPanel />
        </div>
        <div className={cn(tab !== "stake" && "hidden")}>
          <StakePanel />
        </div>
        <div className={cn(tab !== "tokenomics" && "hidden")}>
          <TokenomicsPanel />
        </div>
        <div className={cn(tab !== "chat" && "hidden")}>
          <ChatPanel />
        </div>
      </main>

      <footer className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 pb-8 text-center text-xs text-[var(--color-subtle)] sm:px-6">
        <BrandLogo size={36} />
        <span>bLOK CHaiN · forge · stake $bLOkz · top 50</span>
      </footer>

      <Toaster
        theme="light"
        position="bottom-center"
        toastOptions={{
          className:
            "!bg-[var(--color-surface)] !border-[var(--color-border)] !text-[var(--color-fg)]",
        }}
      />
    </div>
  );
}
