/** N=1, E=2, S=4, W=8 */
export type PortMask = number;

export type AssetId =
  | "btc"
  | "eth"
  | "sol"
  | "avax"
  | "link"
  | "dot"
  | "atom"
  | "blok";

export type Difficulty = "easy" | "medium" | "hard";

export interface BlockCell {
  ports: PortMask;
  asset: AssetId;
}

export interface BoardState {
  size: number;
  cells: BlockCell[];
}

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  size: number;
  /** Always 5 minutes for ranked rounds. */
  timeLimit: number;
  extraEdges: number;
  minTee: number;
  minCross: number;
  description: string;
}

export interface SolveResult {
  components: number;
  openPorts: number;
  linkedEdges: number;
  totalBlocks: number;
  isSolved: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  timeMs: number;
  moves: number;
  difficulty: Difficulty;
  at: number;
  completed?: boolean;
  clicksAway?: number;
}

export interface ChatMessage {
  id: string;
  author: string;
  text: string;
  at: number;
  staked: number;
}

export interface RoundScoreBreakdown {
  score: number;
  completed: boolean;
  moves: number;
  elapsedSec: number;
  timeLeftSec: number;
  clicksAway: number;
  clickPts: number;
  timePts: number;
  reward: number;
}

/** Fixed ranked round length — 5 minutes. */
export const ROUND_SECONDS = 300;

export const ASSETS: {
  id: AssetId;
  ticker: string;
  label: string;
  color: string;
}[] = [
  { id: "btc", ticker: "BTC", label: "Bitcoin", color: "var(--color-btc)" },
  { id: "eth", ticker: "ETH", label: "Ethereum", color: "var(--color-eth)" },
  { id: "sol", ticker: "SOL", label: "Solana", color: "var(--color-sol)" },
  { id: "avax", ticker: "AVAX", label: "Avalanche", color: "var(--color-avax)" },
  { id: "link", ticker: "LINK", label: "Chainlink", color: "var(--color-link)" },
  { id: "dot", ticker: "DOT", label: "Polkadot", color: "var(--color-dot)" },
  { id: "atom", ticker: "ATOM", label: "Cosmos", color: "var(--color-atom)" },
  { id: "blok", ticker: "bLOkz", label: "bLOkz", color: "var(--color-blok)" },
];

/**
 * Port shape families in the pool.
 * end: 1 · straight: 2 opposite · corner: 2 adjacent · tee: 3 · cross: 4
 */
export const PORT_SHAPES: { id: string; label: string; mask: PortMask }[] = [
  { id: "end", label: "End", mask: 1 },
  { id: "straight", label: "Straight", mask: 1 | 4 },
  { id: "corner", label: "Corner", mask: 1 | 2 },
  { id: "tee", label: "Tee", mask: 1 | 2 | 4 },
  { id: "cross", label: "Cross", mask: 1 | 2 | 4 | 8 },
  { id: "elbow", label: "Elbow", mask: 2 | 4 },
  { id: "wide-tee", label: "Wide tee", mask: 2 | 4 | 8 },
  { id: "cap", label: "Cap", mask: 2 },
];

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    id: "easy",
    label: "Genesis",
    size: 4,
    timeLimit: ROUND_SECONDS,
    extraEdges: 8,
    minTee: 2,
    minCross: 1,
    description: "4×4 · rich ports · 5:00",
  },
  medium: {
    id: "medium",
    label: "Validator",
    size: 5,
    timeLimit: ROUND_SECONDS,
    extraEdges: 14,
    minTee: 4,
    minCross: 2,
    description: "5×5 · dense chain · 5:00",
  },
  hard: {
    id: "hard",
    label: "Mainnet",
    size: 6,
    timeLimit: ROUND_SECONDS,
    extraEdges: 22,
    minTee: 6,
    minCross: 3,
    description: "6×6 · max ports · 5:00",
  },
};

export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export const OPPOSITE: Record<number, number> = {
  [N]: S,
  [E]: W,
  [S]: N,
  [W]: E,
};

export const DELTA: Record<number, { dr: number; dc: number }> = {
  [N]: { dr: -1, dc: 0 },
  [E]: { dr: 0, dc: 1 },
  [S]: { dr: 1, dc: 0 },
  [W]: { dr: 0, dc: -1 },
};

export function portCount(mask: PortMask): number {
  let n = 0;
  let m = mask & 15;
  while (m) {
    n += m & 1;
    m >>= 1;
  }
  return n;
}

export function shapeLabel(mask: PortMask): string {
  const c = portCount(mask);
  if (c === 0) return "Empty";
  if (c === 1) return "End";
  if (c === 4) return "Cross";
  if (c === 3) return "Tee";
  if (c === 2) {
    if ((mask & N && mask & S) || (mask & E && mask & W)) return "Straight";
    return "Corner";
  }
  return "Link";
}
