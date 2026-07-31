import {
  ASSETS,
  type AssetId,
  type BlockCell,
  type BoardState,
  type Difficulty,
  DIFFICULTIES,
  DELTA,
  E,
  N,
  OPPOSITE,
  type PortMask,
  portCount,
  type RoundScoreBreakdown,
  S,
  type SolveResult,
  W,
} from "./types";

export function rotatePorts(ports: PortMask, turns = 1): PortMask {
  let p = ports & 15;
  const t = ((turns % 4) + 4) % 4;
  for (let i = 0; i < t; i++) {
    p = ((p << 1) | (p >> 3)) & 15;
  }
  return p;
}

/** Min CW turns from `from` to `to` (same shape family). */
export function turnsToMatch(from: PortMask, to: PortMask): number {
  for (let t = 0; t < 4; t++) {
    if (rotatePorts(from, t) === (to & 15)) return t;
  }
  // Different bit counts shouldn't happen for valid solutions
  return 0;
}

export function idx(row: number, col: number, size: number): number {
  return row * size + col;
}

export function inBounds(row: number, col: number, size: number): boolean {
  return row >= 0 && col >= 0 && row < size && col < size;
}

function pickAsset(seed: number): AssetId {
  return ASSETS[seed % ASSETS.length]!.id;
}

function neighbors(i: number, size: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const out: number[] = [];
  if (r > 0) out.push(idx(r - 1, c, size));
  if (c < size - 1) out.push(idx(r, c + 1, size));
  if (r < size - 1) out.push(idx(r + 1, c, size));
  if (c > 0) out.push(idx(r, c - 1, size));
  return out;
}

function edgeDir(from: number, to: number, size: number): PortMask {
  const fr = Math.floor(from / size);
  const fc = from % size;
  const tr = Math.floor(to / size);
  const tc = to % size;
  if (tr === fr - 1 && tc === fc) return N;
  if (tr === fr && tc === fc + 1) return E;
  if (tr === fr + 1 && tc === fc) return S;
  if (tr === fr && tc === fc - 1) return W;
  return 0;
}

function countDegrees(ports: number[]): { tee: number; cross: number; end: number; corner: number; straight: number } {
  let tee = 0;
  let cross = 0;
  let end = 0;
  let corner = 0;
  let straight = 0;
  for (const p of ports) {
    const c = portCount(p);
    if (c === 1) end++;
    else if (c === 4) cross++;
    else if (c === 3) tee++;
    else if (c === 2) {
      if ((p & N && p & S) || (p & E && p & W)) straight++;
      else corner++;
    }
  }
  return { tee, cross, end, corner, straight };
}

function listOpenEdges(ports: number[], size: number): { a: number; b: number; d: PortMask }[] {
  const candidates: { a: number; b: number; d: PortMask }[] = [];
  const n = size * size;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    if (c < size - 1) {
      const j = idx(r, c + 1, size);
      if ((ports[i]! & E) === 0) candidates.push({ a: i, b: j, d: E });
    }
    if (r < size - 1) {
      const j = idx(r + 1, c, size);
      if ((ports[i]! & S) === 0) candidates.push({ a: i, b: j, d: S });
    }
  }
  return candidates;
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

export interface GeneratedPuzzle {
  board: BoardState;
  solution: PortMask[];
}

/**
 * Generate a dense multi-shape port net (ends, straights, corners, tees, crosses),
 * then scramble rotations for the puzzle.
 */
export function generatePuzzle(
  difficulty: Difficulty,
  rng = Math.random,
): GeneratedPuzzle {
  const cfg = DIFFICULTIES[difficulty];
  const size = cfg.size;
  const n = size * size;
  const ports = new Array<number>(n).fill(0);

  // Prim spanning tree — every cell starts in the chain
  const visited = new Set<number>([0]);
  const frontier: { from: number; to: number }[] = neighbors(0, size).map((to) => ({
    from: 0,
    to,
  }));

  while (visited.size < n && frontier.length > 0) {
    const pick = Math.floor(rng() * frontier.length);
    const edge = frontier.splice(pick, 1)[0]!;
    if (visited.has(edge.to)) continue;
    visited.add(edge.to);
    const d = edgeDir(edge.from, edge.to, size);
    ports[edge.from]! |= d;
    ports[edge.to]! |= OPPOSITE[d]!;
    for (const nb of neighbors(edge.to, size)) {
      if (!visited.has(nb)) frontier.push({ from: edge.to, to: nb });
    }
  }

  // Dense extra edges for richer port shapes (T / cross / multi-link)
  const candidates = listOpenEdges(ports, size);
  shuffleInPlace(candidates, rng);
  let added = 0;
  for (const e of candidates) {
    if (added >= cfg.extraEdges) break;
    ports[e.a]! |= e.d;
    ports[e.b]! |= OPPOSITE[e.d]!;
    added++;
  }

  // Guarantee minimum tee / cross density by preferentially linking low-degree pairs
  const ensureJunctions = () => {
    const open = listOpenEdges(ports, size);
    shuffleInPlace(open, rng);
    for (const e of open) {
      const deg = countDegrees(ports);
      if (deg.tee >= cfg.minTee && deg.cross >= cfg.minCross) break;
      const da = portCount(ports[e.a]!);
      const db = portCount(ports[e.b]!);
      // Prefer upgrades that create tees (2→3) or crosses (3→4)
      const upgrades =
        (da === 2 || da === 3 || db === 2 || db === 3) ||
        deg.tee < cfg.minTee ||
        deg.cross < cfg.minCross;
      if (!upgrades) continue;
      ports[e.a]! |= e.d;
      ports[e.b]! |= OPPOSITE[e.d]!;
    }
  };
  ensureJunctions();

  // Second enrichment pass: sprinkle remaining open edges for variety
  const more = listOpenEdges(ports, size);
  shuffleInPlace(more, rng);
  const bonus = Math.floor(cfg.extraEdges * 0.35);
  for (let k = 0; k < bonus && k < more.length; k++) {
    const e = more[k]!;
    // Skip if both already crosses
    if (portCount(ports[e.a]!) >= 4 && portCount(ports[e.b]!) >= 4) continue;
    ports[e.a]! |= e.d;
    ports[e.b]! |= OPPOSITE[e.d]!;
  }

  const solution = ports.map((p) => p || E);
  const baseCells: BlockCell[] = solution.map((p, i) => ({
    ports: p,
    asset: pickAsset(Math.floor(rng() * 1000) + i * 17),
  }));

  let board: BoardState = { size, cells: baseCells };
  for (let attempt = 0; attempt < 48; attempt++) {
    board = {
      size,
      cells: baseCells.map((cell) => ({
        ...cell,
        // Prefer non-zero scramble so ends/tees show mixed orientations
        ports: rotatePorts(cell.ports, 1 + Math.floor(rng() * 3)),
      })),
    };
    // Occasionally pure random including 0-turn for a few cells
    if (attempt > 20) {
      board = {
        size,
        cells: baseCells.map((cell) => ({
          ...cell,
          ports: rotatePorts(cell.ports, Math.floor(rng() * 4)),
        })),
      };
    }
    if (!analyzeBoard(board).isSolved) break;
  }

  return { board, solution };
}

export function generateBoard(difficulty: Difficulty, rng = Math.random): BoardState {
  return generatePuzzle(difficulty, rng).board;
}

export function rotateCell(board: BoardState, cellIndex: number): BoardState {
  const cells = board.cells.map((c, i) =>
    i === cellIndex ? { ...c, ports: rotatePorts(c.ports, 1) } : c,
  );
  return { size: board.size, cells };
}

export function applyHint(
  board: BoardState,
  solution: PortMask[],
): { board: BoardState; fixedIndex: number } | null {
  const wrong: number[] = [];
  for (let i = 0; i < board.cells.length; i++) {
    if (board.cells[i]!.ports !== solution[i]) wrong.push(i);
  }
  if (wrong.length === 0) return null;
  const fixedIndex = wrong[Math.floor(Math.random() * wrong.length)]!;
  const cells = board.cells.map((c, i) =>
    i === fixedIndex ? { ...c, ports: solution[i]! } : c,
  );
  return { board: { size: board.size, cells }, fixedIndex };
}

/** Optimal remaining clicks (sum of min rotations per tile to match solution). */
export function clicksAway(board: BoardState, solution: PortMask[]): number {
  let total = 0;
  for (let i = 0; i < board.cells.length; i++) {
    total += turnsToMatch(board.cells[i]!.ports, solution[i] ?? board.cells[i]!.ports);
  }
  return total;
}

export function isLinked(
  board: BoardState,
  from: number,
  dir: PortMask,
): boolean {
  const size = board.size;
  const cell = board.cells[from];
  if (!cell || (cell.ports & dir) === 0) return false;
  const r = Math.floor(from / size);
  const c = from % size;
  const { dr, dc } = DELTA[dir]!;
  const nr = r + dr;
  const nc = c + dc;
  if (!inBounds(nr, nc, size)) return false;
  const other = board.cells[idx(nr, nc, size)];
  if (!other) return false;
  return (other.ports & OPPOSITE[dir]!) !== 0;
}

export function analyzeBoard(board: BoardState): SolveResult {
  const size = board.size;
  const n = size * size;
  const seen = new Array<boolean>(n).fill(false);
  let components = 0;
  let openPorts = 0;
  let linkedEdges = 0;

  for (let i = 0; i < n; i++) {
    const cell = board.cells[i]!;
    for (const dir of [N, E, S, W]) {
      if ((cell.ports & dir) === 0) continue;
      if (isLinked(board, i, dir)) {
        if (dir === E || dir === S) linkedEdges += 1;
      } else {
        openPorts += 1;
      }
    }
  }

  for (let start = 0; start < n; start++) {
    if (seen[start]) continue;
    components += 1;
    const q = [start];
    seen[start] = true;
    while (q.length) {
      const cur = q.pop()!;
      for (const dir of [N, E, S, W]) {
        if (!isLinked(board, cur, dir)) continue;
        const r = Math.floor(cur / size);
        const c = cur % size;
        const { dr, dc } = DELTA[dir]!;
        const next = idx(r + dr, c + dc, size);
        if (!seen[next]) {
          seen[next] = true;
          q.push(next);
        }
      }
    }
  }

  return {
    components,
    openPorts,
    linkedEdges,
    totalBlocks: n,
    isSolved: components === 1 && openPorts === 0,
  };
}

function diffMul(difficulty: Difficulty): number {
  return difficulty === "hard" ? 1.55 : difficulty === "medium" ? 1.25 : 1;
}

/**
 * Complete run: (few clicks) × (time remaining / speed).
 * Incomplete: score from how many optimal clicks remain to finish.
 */
export function scoreRound(opts: {
  difficulty: Difficulty;
  completed: boolean;
  moves: number;
  elapsedSec: number;
  board: BoardState;
  solution: PortMask[];
}): RoundScoreBreakdown {
  const cfg = DIFFICULTIES[opts.difficulty];
  const timeLeftSec = Math.max(0, cfg.timeLimit - opts.elapsedSec);
  const away = opts.completed ? 0 : clicksAway(opts.board, opts.solution);
  const mul = diffMul(opts.difficulty);

  if (opts.completed) {
    // Fewer clicks → higher clickPts; faster finish → higher timePts
    const clickPts = Math.max(1, Math.round(8000 / Math.max(opts.moves, 1)));
    const timePts = Math.max(1, Math.round(timeLeftSec + 15));
    const score = Math.floor(clickPts * timePts * mul);
    const reward = Math.max(40, Math.floor(score / 90));
    return {
      score,
      completed: true,
      moves: opts.moves,
      elapsedSec: opts.elapsedSec,
      timeLeftSec,
      clicksAway: 0,
      clickPts,
      timePts,
      reward,
    };
  }

  // Partial: reward proximity (low clicksAway) and light-penalize spam clicks
  const n = opts.board.cells.length;
  const maxAway = Math.max(1, n * 3);
  const solvedClicks = maxAway - away;
  const closeness = solvedClicks / maxAway; // 0..1
  // Quadratic so near-finishes score much better than half-done
  const proximityPts = Math.floor(closeness * closeness * 3200);
  const clickPenalty = Math.floor(opts.moves * 4);
  const score = Math.max(0, Math.floor((proximityPts - clickPenalty) * mul));
  const reward = score > 0 ? Math.max(5, Math.floor(score / 120)) : 0;

  return {
    score,
    completed: false,
    moves: opts.moves,
    elapsedSec: opts.elapsedSec,
    timeLeftSec: 0,
    clicksAway: away,
    clickPts: proximityPts,
    timePts: 0,
    reward,
  };
}

/** @deprecated use scoreRound */
export function scoreRun(opts: {
  difficulty: Difficulty;
  timeLeftSec: number;
  moves: number;
  elapsedSec: number;
}): number {
  const clickPts = Math.max(1, Math.round(8000 / Math.max(opts.moves, 1)));
  const timePts = Math.max(1, Math.round(opts.timeLeftSec + 15));
  return Math.floor(clickPts * timePts);
}

export function cloneBoard(board: BoardState): BoardState {
  return {
    size: board.size,
    cells: board.cells.map((c) => ({ ...c })),
  };
}
