import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  canUnstake,
  computeClaimAmount,
  formatDuration,
  nextClaimAt,
  STAKE_LOCK_MS,
} from "@/lib/game/rewards";
import { useGameStore } from "@/lib/game/store";
import { formatNumber } from "@/lib/utils";
import { Gift, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

export function StakePanel() {
  const balance = useGameStore((s) => s.balance);
  const staked = useGameStore((s) => s.staked);
  const stakedAt = useGameStore((s) => s.stakedAt);
  const lastDailyClaimAt = useGameStore((s) => s.lastDailyClaimAt);
  const lastMonthlyClaimAt = useGameStore((s) => s.lastMonthlyClaimAt);
  const totalRewardsClaimed = useGameStore((s) => s.totalRewardsClaimed);
  const stake = useGameStore((s) => s.stake);
  const unstake = useGameStore((s) => s.unstake);
  const claimRewards = useGameStore((s) => s.claimRewards);
  const [amount, setAmount] = useState("100");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const n = Math.floor(Number(amount) || 0);
  const total = balance + staked;
  const pct = total > 0 ? Math.min(100, (staked / total) * 100) : 0;

  const lock = canUnstake(staked, stakedAt, now);
  const schedule = nextClaimAt(staked, lastDailyClaimAt, lastMonthlyClaimAt);
  const claimAmount = computeClaimAmount(staked);
  const claimWaitMs =
    schedule.nextAt != null ? Math.max(0, schedule.nextAt - now) : 0;

  const onStake = () => {
    const res = stake(n);
    if (!res.ok) toast.error(res.error);
    else
      toast.success(
        `Staked ${formatNumber(n)} $bLOkz · 12h lock started`,
      );
  };

  const onUnstake = () => {
    const res = unstake(n);
    if (!res.ok) toast.error(res.error);
    else toast.success(`Unstaked ${formatNumber(n)} $bLOkz`);
  };

  const onClaim = () => {
    const res = claimRewards();
    if (!res.ok) toast.error(res.error);
    else if (res.amount != null) {
      toast.success(
        res.tier === "staker"
          ? `Daily staker reward +${formatNumber(res.amount)} $bLOkz`
          : `Monthly non-staker reward +${formatNumber(res.amount)} $bLOkz`,
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrandLogo size={28} />
          Stake $bLOkz
        </CardTitle>
        <CardDescription>
          Stakers earn daily. Non-stakers earn once a month. Every stake locks for
          a minimum of 12 hours before unstake.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Wallet" value={`${formatNumber(balance)} $bLOkz`} />
          <Metric label="Staked" value={`${formatNumber(staked)} $bLOkz`} accent />
          <Metric label="Network share" value={`${pct.toFixed(1)}%`} />
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-elevated)]">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Gift className="h-4 w-4 text-[var(--color-primary)]" />
              Reward schedule
            </div>
            {staked > 0 ? (
              <Badge variant="success">Staker · daily</Badge>
            ) : (
              <Badge variant="warn">Non-staker · monthly</Badge>
            )}
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            {staked > 0
              ? `Daily yield: ${formatNumber(claimAmount)} $bLOkz (2% of stake, min 15).`
              : `Monthly community drip: ${formatNumber(claimAmount)} $bLOkz while unstaked.`}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Metric
              label={schedule.ready ? "Claimable now" : "Next claim"}
              value={
                schedule.ready
                  ? `${formatNumber(claimAmount)} $bLOkz`
                  : formatDuration(claimWaitMs)
              }
              accent={schedule.ready}
            />
            <Metric
              label="Lifetime claimed"
              value={`${formatNumber(totalRewardsClaimed)} $bLOkz`}
            />
          </div>
          <Button
            className="w-full"
            onClick={onClaim}
            disabled={!schedule.ready}
          >
            <Gift className="h-4 w-4" />
            {schedule.ready
              ? `Claim ${formatNumber(claimAmount)} $bLOkz`
              : `Claim in ${formatDuration(claimWaitMs)}`}
          </Button>
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
            Amount
          </label>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
          />
          <div className="flex flex-wrap gap-2">
            {[50, 100, 250, 500].map((q) => (
              <Button
                key={q}
                size="sm"
                variant="ghost"
                onClick={() => setAmount(String(q))}
              >
                {q}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAmount(String(balance))}
            >
              Max wallet
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={onStake}>
              <Lock className="h-4 w-4" />
              Stake
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              onClick={onUnstake}
              disabled={staked > 0 && !lock.ok}
            >
              <Unlock className="h-4 w-4" />
              Unstake
            </Button>
          </div>
          {staked > 0 && (
            <p className="text-xs text-[var(--color-muted)]">
              {lock.ok ? (
                <>Minimum 12h lock complete — unstake available.</>
              ) : (
                <>
                  12h lock active · unlocks in{" "}
                  <span className="font-semibold text-[var(--color-fg)]">
                    {formatDuration(lock.waitMs)}
                  </span>
                  . Topping up restarts the {Math.round(STAKE_LOCK_MS / 3600000)}
                  h timer.
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
          {staked > 0 ? (
            <>
              <Badge variant="success">Validator access</Badge>
              <span>Chat unlocked · daily rewards enabled.</span>
            </>
          ) : (
            <>
              <Badge variant="warn">Monthly drip only</Badge>
              <span>Stake to switch to daily rewards and open chat.</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3">
      <div className="mb-1 text-[11px] uppercase tracking-wide text-[var(--color-subtle)]">
        {label}
      </div>
      <div
        className={`text-base font-semibold tabular ${
          accent ? "text-[var(--color-primary)]" : "text-[var(--color-fg)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
