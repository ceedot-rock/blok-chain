/**
 * $bLOkz distribution model for bLOK CHaiN.
 *
 * Fixed total supply with six allocation buckets. Live in-app rewards
 * (forge, stake yield, monthly drip) draw from the Play / Staking / Community
 * buckets. In-app rewards use the same ratios.
 */

export const TOKEN_SYMBOL = "$bLOkz";
export const TOKEN_NAME = "bLOkz";
export const TOTAL_SUPPLY = 1_000_000_000; // 1B fixed

export type AllocationId =
  | "play"
  | "staking"
  | "community"
  | "treasury"
  | "ecosystem"
  | "genesis";

export interface AllocationBucket {
  id: AllocationId;
  label: string;
  pct: number;
  amount: number;
  color: string;
  vesting: string;
  description: string;
  sink?: string;
}

/** Percentage shares must sum to 100. */
const ALLOCATION_DEFS: Omit<AllocationBucket, "amount">[] = [
  {
    id: "play",
    label: "Forge rewards",
    pct: 28,
    color: "var(--color-primary)",
    vesting: "Emission over ~4 years via round scores",
    description:
      "Paid when you solidify a chain. Fewer clicks × leftover time mint larger forge bounties.",
    sink: "Hints burn 25 $bLOkz back toward the pool.",
  },
  {
    id: "staking",
    label: "Staking yield",
    pct: 30,
    color: "var(--color-chain)",
    vesting: "Daily unlock for active stakers · 12h min lock",
    description:
      "Validators who stake earn daily yield. Higher stake → larger claim. Unlocks after the 12h lock.",
  },
  {
    id: "community",
    label: "Community drip",
    pct: 10,
    color: "var(--color-btc)",
    vesting: "Monthly claim for non-stakers",
    description:
      "Flat monthly airdrop for wallets with zero stake — keeps casual players in the loop without diluting daily staker yield.",
  },
  {
    id: "treasury",
    label: "Protocol treasury",
    pct: 15,
    color: "var(--color-eth)",
    vesting: "Multi-sig · spend via governance",
    description:
      "Liquidity, partnerships, tournaments, and chain ops. Not player-claimable in-app.",
  },
  {
    id: "ecosystem",
    label: "Ecosystem & team",
    pct: 12,
    color: "var(--color-sol)",
    vesting: "24-month linear vest · 6-month cliff",
    description:
      "Builders and core contributors. Long vest aligns shipping bLOK CHaiN with token supply.",
  },
  {
    id: "genesis",
    label: "Genesis airdrop",
    pct: 5,
    color: "var(--color-dot)",
    vesting: "One-time genesis wallets",
    description:
      "Early explorers and seed leaderboard placeholders. Boots the economy at launch.",
  },
];

export const ALLOCATIONS: AllocationBucket[] = ALLOCATION_DEFS.map((b) => ({
  ...b,
  amount: Math.floor((TOTAL_SUPPLY * b.pct) / 100),
}));

export function allocationTotalPct(): number {
  return ALLOCATIONS.reduce((s, b) => s + b.pct, 0);
}

/** In-app emission parameters (aligned with rewards.ts). */
export const EMISSION = {
  /** Daily staker yield as fraction of personal stake. */
  dailyStakeRate: 0.02,
  dailyStakeMin: 15,
  /** Flat monthly for non-stakers. */
  monthlyNonStaker: 75,
  /** Hint sink. */
  hintBurn: 25,
  /** Approx forge reward band (from score engine). */
  forgeMin: 5,
  forgeTypical: 50,
  forgeMax: 200,
  stakeLockHours: 12,
} as const;

export interface WalletProjection {
  stake: number;
  wallet: number;
  dailyIfStaked: number;
  monthlyIfStaked: number;
  yearlyIfStaked: number;
  monthlyIfUnstaked: number;
  yearlyIfUnstaked: number;
  effectiveApyPct: number;
  preferredTier: "stake" | "hold";
  edgeMonthly: number;
}

export function projectWallet(stake: number, wallet: number): WalletProjection {
  const s = Math.max(0, Math.floor(stake));
  const dailyIfStaked = s > 0 ? Math.max(EMISSION.dailyStakeMin, Math.floor(s * EMISSION.dailyStakeRate)) : 0;
  const monthlyIfStaked = dailyIfStaked * 30;
  const yearlyIfStaked = dailyIfStaked * 365;
  const monthlyIfUnstaked = EMISSION.monthlyNonStaker;
  const yearlyIfUnstaked = EMISSION.monthlyNonStaker * 12;
  const effectiveApyPct =
    s > 0 ? Math.round((yearlyIfStaked / s) * 1000) / 10 : 0;
  const edgeMonthly = monthlyIfStaked - monthlyIfUnstaked;
  return {
    stake: s,
    wallet: Math.max(0, Math.floor(wallet)),
    dailyIfStaked,
    monthlyIfStaked,
    yearlyIfStaked,
    monthlyIfUnstaked,
    yearlyIfUnstaked,
    effectiveApyPct,
    preferredTier: s > 0 && monthlyIfStaked >= monthlyIfUnstaked ? "stake" : "hold",
    edgeMonthly,
  };
}

/** Rough network emission for charts. */
export function emissionTimeline(days = 90): { day: number; staking: number; play: number; community: number }[] {
  const out: { day: number; staking: number; play: number; community: number }[] = [];
  let stakingCum = 0;
  let playCum = 0;
  let communityCum = 0;
  // Assume ~2k active stakers avg 500 stake, ~800 forges/day, ~1.2k monthly claimants / 30
  const dailyStakeEmit = 2000 * Math.max(EMISSION.dailyStakeMin, Math.floor(500 * EMISSION.dailyStakeRate));
  const dailyPlayEmit = 800 * EMISSION.forgeTypical;
  const dailyCommunityEmit = (1200 * EMISSION.monthlyNonStaker) / 30;
  for (let d = 1; d <= days; d++) {
    stakingCum += dailyStakeEmit;
    playCum += dailyPlayEmit;
    communityCum += dailyCommunityEmit;
    if (d === 1 || d % 5 === 0 || d === days) {
      out.push({
        day: d,
        staking: Math.floor(stakingCum),
        play: Math.floor(playCum),
        community: Math.floor(communityCum),
      });
    }
  }
  return out;
}

export const FLOW_STEPS = [
  {
    title: "Mint path",
    body: "Fixed 1B supply. No infinite mint — rewards unlock from pre-allocated pools.",
  },
  {
    title: "Earn path",
    body: "Forge rounds → Play pool. Stake → daily Staking pool. Idle wallet → monthly Community drip.",
  },
  {
    title: "Sink path",
    body: "Hints burn 25 $bLOkz. Future sinks: ranked entry fees, cosmetic chain skins.",
  },
  {
    title: "Lock path",
    body: "12h minimum stake lock reduces mercenary farming and stabilizes daily emission.",
  },
] as const;
