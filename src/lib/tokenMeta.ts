/**
 * bLOkz token + app metadata (off-chain; wallets/explorers read hosted files).
 * Public copies: /token.json, /tokenlist.json, /logo.png
 */
import { CHAIN_META } from "./chain";

/** Game site (canonical website for token + product). */
export const GAME_URL = "https://sam-camel-recovery-idaho.trycloudflare.com";
/** Repo / metadata host (logo + token.json on GitHub raw). */
export const REPO_URL = "https://github.com/ceedot-rock/blok-chain";
export const RAW_BASE =
  "https://raw.githubusercontent.com/ceedot-rock/blok-chain/main/public";

/** App origin — prefer VITE_APP_URL, then game site, then local. */
export const APP_URL =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ||
  GAME_URL;

export const TOKEN_META = {
  name: "bLOkz",
  symbol: "bLOkz",
  decimals: 18,
  description:
    "bLOkz is the on-chain token for bLOK CHaiN — a puzzle game where you stack blocks and hold $bLOkz. Play at https://sam-camel-recovery-idaho.trycloudflare.com",
  shortDescription: "Stack blocks. Hold $bLOkz. Play at https://sam-camel-recovery-idaho.trycloudflare.com",
  address: CHAIN_META.tokenAddress || "0x9385cB183329C386391787D0f919a02C750A51CB",
  chainId: CHAIN_META.chainId || 8453,
  chainName: CHAIN_META.chainName || "Base",
  /** Local public/ for the running app; raw GitHub for explorers/wallets */
  logoPath: "/logo.png",
  logo256Path: "/logo-256.png",
  logoURI: `${RAW_BASE}/logo.png`,
  metadataPath: "/token.json",
  metadataURI: `${RAW_BASE}/token.json`,
  websitePath: GAME_URL,
  explorer: `https://basescan.org/token/${
    CHAIN_META.tokenAddress || "0x9385cB183329C386391787D0f919a02C750A51CB"
  }`,
  pool: "0x836f25C7b3BadC1652A03036bDfc8C500FB347af",
  uniswapPool: `https://app.uniswap.org/explore/pools/base/0x836f25C7b3BadC1652A03036bDfc8C500FB347af`,
  uniswapSwap: `https://app.uniswap.org/swap?chain=base&inputCurrency=ETH&outputCurrency=${
    CHAIN_META.tokenAddress || "0x9385cB183329C386391787D0f919a02C750A51CB"
  }`,
  tags: ["game", "puzzle", "base", "splabs"],
  project: "bLOK CHaiN",
  org: "SPLabs",
} as const;

export function absoluteUrl(path: string, origin = APP_URL): string {
  if (!path) return origin || "";
  if (path.startsWith("http")) return path;
  const base = origin || "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
