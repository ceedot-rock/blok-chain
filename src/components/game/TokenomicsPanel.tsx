import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { BrandLogo } from "./BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ALLOCATIONS,
  EMISSION,
  FLOW_STEPS,
  TOKEN_SYMBOL,
  TOTAL_SUPPLY,
  emissionTimeline,
  projectWallet,
  type AllocationBucket,
} from "@/lib/game/tokenomics";
import { useGameStore } from "@/lib/game/store";
import { formatNumber } from "@/lib/utils";
import { Waves, ArrowDownUp, Calculator } from "lucide-react";

export function TokenomicsPanel() {
  const balance = useGameStore((s) => s.balance);
  const staked = useGameStore((s) => s.staked);
  const [stakeSim, setStakeSim] = useState(String(Math.max(staked, 100)));

  const pieData = useMemo(
    () =>
      ALLOCATIONS.map((b) => ({
        name: b.label,
        value: b.pct,
        amount: b.amount,
        color: b.color,
        id: b.id,
      })),
    [],
  );

  const timeline = useMemo(() => emissionTimeline(90), []);
  const simStake = Math.max(0, Math.floor(Number(stakeSim) || 0));
  const proj = projectWallet(simStake, balance);
  const live = projectWallet(staked, balance);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="mb-2">
            <BrandLogo size={52} />
          </div>
          <CardTitle className="text-xl tracking-tight">
            $bLOkz distribution model
          </CardTitle>
          <CardDescription className="max-w-2xl text-pretty">
            Fixed supply of {formatNumber(TOTAL_SUPPLY)} {TOKEN_SYMBOL}. Six
            buckets fund forge play, daily staker yield, monthly non-staker drip,
            treasury, ecosystem vest, and genesis. Explore the pie, emission curve,
            and your personal yield.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="52%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                >
                  {pieData.map((d) => (
                    <Cell key={d.id} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    const pct = typeof value === "number" ? value : Number(value);
                    const bucket = ALLOCATIONS.find((b) => b.label === name);
                    return [
                      `${pct}% · ${formatNumber(bucket?.amount ?? 0)}`,
                      String(name),
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-1 text-center text-xs text-[var(--color-subtle)]">
              Total supply · {formatNumber(TOTAL_SUPPLY)} {TOKEN_SYMBOL}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {ALLOCATIONS.map((b) => (
              <AllocationCard key={b.id} bucket={b} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Waves className="h-4 w-4 text-[var(--color-primary)]" />
              Network emission (90 days)
            </CardTitle>
            <CardDescription>
              Modelled cumulative unlock from staking, forge, and community
              pools under model activity assumptions.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                />
                <YAxis
                  tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1000
                        ? `${Math.round(v / 1000)}k`
                        : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value) => formatNumber(Number(value))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="staking"
                  name="Staking"
                  stackId="1"
                  stroke="var(--color-chain)"
                  fill="var(--color-chain)"
                  fillOpacity={0.35}
                />
                <Area
                  type="monotone"
                  dataKey="play"
                  name="Forge"
                  stackId="1"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.35}
                />
                <Area
                  type="monotone"
                  dataKey="community"
                  name="Community"
                  stackId="1"
                  stroke="var(--color-btc)"
                  fill="var(--color-btc)"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4 text-[var(--color-primary)]" />
              Personal yield explorer
            </CardTitle>
            <CardDescription>
              Stakers claim daily ({(EMISSION.dailyStakeRate * 100).toFixed(0)}% of
              stake, min {EMISSION.dailyStakeMin}). Non-stakers claim{" "}
              {EMISSION.monthlyNonStaker}/month. 12h stake lock.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                Simulated stake
              </label>
              <Input
                type="number"
                min={0}
                value={stakeSim}
                onChange={(e) => setStakeSim(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {[100, 250, 500, 1000, 2500].map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-elevated)] px-2.5 py-1 text-xs text-[var(--color-muted)] hover:border-[var(--color-border-strong)]"
                    onClick={() => setStakeSim(String(q))}
                  >
                    {formatNumber(q)}
                  </button>
                ))}
                {staked > 0 && (
                  <button
                    type="button"
                    className="rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs text-[var(--color-primary)]"
                    onClick={() => setStakeSim(String(staked))}
                  >
                    Your stake ({formatNumber(staked)})
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="Daily if staked"
                value={`${formatNumber(proj.dailyIfStaked)}`}
                hint={TOKEN_SYMBOL}
              />
              <Stat
                label="Monthly if staked"
                value={`${formatNumber(proj.monthlyIfStaked)}`}
                hint={TOKEN_SYMBOL}
              />
              <Stat
                label="Monthly if unstaked"
                value={`${formatNumber(proj.monthlyIfUnstaked)}`}
                hint={TOKEN_SYMBOL}
              />
              <Stat
                label="Model APY"
                value={`${formatNumber(proj.effectiveApyPct, 1)}%`}
                hint="from daily yield"
                accent
              />
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-sm text-[var(--color-muted)]">
              {simStake <= 0 ? (
                <>
                  At zero stake you earn the community drip only —{" "}
                  <span className="font-semibold text-[var(--color-fg)]">
                    {formatNumber(proj.yearlyIfUnstaked)} {TOKEN_SYMBOL}/year
                  </span>
                  .
                </>
              ) : proj.edgeMonthly > 0 ? (
                <>
                  Staking {formatNumber(simStake)} beats the monthly drip by{" "}
                  <span className="font-semibold text-[var(--color-primary)]">
                    +{formatNumber(proj.edgeMonthly)} {TOKEN_SYMBOL}/month
                  </span>{" "}
                  (~{formatNumber(proj.yearlyIfStaked)} / year).
                </>
              ) : (
                <>Hold path is competitive at this stake size — consider topping up.</>
              )}
            </div>

            {staked > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-subtle)]">
                <Badge variant="success">Live wallet</Badge>
                <span>
                  You: {formatNumber(live.dailyIfStaked)}/day staked yield · wallet{" "}
                  {formatNumber(balance)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownUp className="h-4 w-4 text-[var(--color-primary)]" />
            Value flow
          </CardTitle>
          <CardDescription>
            How tokens move through bLOK CHaiN — mint is fixed; unlocks and sinks
            shape velocity.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW_STEPS.map((s, i) => (
            <div
              key={s.title}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4"
            >
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-primary)]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mb-1 font-semibold">{s.title}</div>
              <p className="text-sm text-[var(--color-muted)]">{s.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AllocationCard({ bucket }: { bucket: AllocationBucket }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: bucket.color }}
        />
        <span className="text-sm font-semibold">{bucket.label}</span>
        <span className="ml-auto tabular text-sm font-semibold text-[var(--color-primary)]">
          {bucket.pct}%
        </span>
      </div>
      <div className="mb-1 text-xs tabular text-[var(--color-subtle)]">
        {formatNumber(bucket.amount)} {TOKEN_SYMBOL}
      </div>
      <p className="text-xs leading-relaxed text-[var(--color-muted)]">
        {bucket.description}
      </p>
      <div className="mt-2 text-[11px] text-[var(--color-subtle)]">{bucket.vesting}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-[var(--color-subtle)]">
        {label}
      </div>
      <div
        className={`text-base font-semibold tabular ${
          accent ? "text-[var(--color-primary)]" : "text-[var(--color-fg)]"
        }`}
      >
        {value}
        {hint ? (
          <span className="ml-1 text-xs font-normal text-[var(--color-muted)]">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
}
