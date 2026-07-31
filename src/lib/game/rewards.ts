/** Minimum time tokens must stay staked before unstake. */
export const STAKE_LOCK_MS = 12 * 60 * 60 * 1000; // 12 hours
/** Staker reward cadence. */
export const DAILY_REWARD_MS = 24 * 60 * 60 * 1000;
/** Non-staker community reward cadence. */
export const MONTHLY_REWARD_MS = 30 * 24 * 60 * 60 * 1000;

/** Flat monthly drip for wallets with zero stake. */
export const MONTHLY_NON_STAKER_REWARD = 75;
/** Daily yield rate for stakers (2% of stake, min 15). */
export const DAILY_STAKE_RATE = 0.02;
export const DAILY_STAKE_MIN = 15;

export type RewardTier = "staker" | "non-staker";

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function stakeUnlockAt(stakedAt: number | null): number | null {
  if (stakedAt == null) return null;
  return stakedAt + STAKE_LOCK_MS;
}

export function canUnstake(
  staked: number,
  stakedAt: number | null,
  now = Date.now(),
): { ok: boolean; unlockAt: number | null; waitMs: number } {
  if (staked <= 0) {
    return { ok: false, unlockAt: null, waitMs: 0 };
  }
  const unlockAt = stakeUnlockAt(stakedAt);
  if (unlockAt == null) {
    return { ok: true, unlockAt: null, waitMs: 0 };
  }
  const waitMs = unlockAt - now;
  if (waitMs > 0) {
    return { ok: false, unlockAt, waitMs };
  }
  return { ok: true, unlockAt, waitMs: 0 };
}

export function nextClaimAt(
  staked: number,
  lastDailyClaimAt: number | null,
  lastMonthlyClaimAt: number | null,
): { tier: RewardTier; nextAt: number | null; ready: boolean } {
  if (staked > 0) {
    if (lastDailyClaimAt == null) {
      return { tier: "staker", nextAt: null, ready: true };
    }
    const nextAt = lastDailyClaimAt + DAILY_REWARD_MS;
    return {
      tier: "staker",
      nextAt,
      ready: Date.now() >= nextAt,
    };
  }
  if (lastMonthlyClaimAt == null) {
    return { tier: "non-staker", nextAt: null, ready: true };
  }
  const nextAt = lastMonthlyClaimAt + MONTHLY_REWARD_MS;
  return {
    tier: "non-staker",
    nextAt,
    ready: Date.now() >= nextAt,
  };
}

export function computeClaimAmount(staked: number): number {
  if (staked > 0) {
    return Math.max(DAILY_STAKE_MIN, Math.floor(staked * DAILY_STAKE_RATE));
  }
  return MONTHLY_NON_STAKER_REWARD;
}
