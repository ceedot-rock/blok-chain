import type { ReactNode } from "react";
import { TOKEN_META, GAME_URL, REPO_URL, RAW_BASE } from "../lib/tokenMeta";
import { CHAIN_META } from "../store/game";

/** Full token information panel (off-chain meta + live contract). */
export function TokenInfo() {
  const rows: { label: string; value: ReactNode }[] = [
    { label: "Name", value: TOKEN_META.name },
    { label: "Symbol", value: TOKEN_META.symbol },
    { label: "Decimals", value: String(TOKEN_META.decimals) },
    {
      label: "Contract",
      value: (
        <a href={TOKEN_META.explorer} target="_blank" rel="noreferrer">
          <code className="addr">{TOKEN_META.address}</code>
        </a>
      ),
    },
    {
      label: "Network",
      value: `${TOKEN_META.chainName} (${TOKEN_META.chainId})`,
    },
    {
      label: "Game",
      value: (
        <a href={GAME_URL} target="_blank" rel="noreferrer">
          https://sam-camel-recovery-idaho.trycloudflare.com
        </a>
      ),
    },
    {
      label: "Website",
      value: (
        <a href={GAME_URL} target="_blank" rel="noreferrer">
          https://sam-camel-recovery-idaho.trycloudflare.com
        </a>
      ),
    },
    {
      label: "Description",
      value: TOKEN_META.description,
    },
    {
      label: "Logo",
      value: (
        <a href={TOKEN_META.logoURI} target="_blank" rel="noreferrer">
          logo.png
        </a>
      ),
    },
    {
      label: "Metadata",
      value: (
        <a href={TOKEN_META.metadataURI} target="_blank" rel="noreferrer">
          token.json
        </a>
      ),
    },
    {
      label: "Pool",
      value: (
        <a href={TOKEN_META.uniswapPool} target="_blank" rel="noreferrer">
          Uniswap V3 0.3%
        </a>
      ),
    },
    {
      label: "Trade",
      value: (
        <a href={TOKEN_META.uniswapSwap} target="_blank" rel="noreferrer">
          Buy {TOKEN_META.symbol}
        </a>
      ),
    },
    {
      label: "Docs",
      value: (
        <a
          href={`${REPO_URL}/blob/main/docs/TOKEN_INFORMATION.md`}
          target="_blank"
          rel="noreferrer"
        >
          TOKEN_INFORMATION.md
        </a>
      ),
    },
  ];

  return (
    <section className="panel token-info">
      <div className="panel-head">
        <img
          className="token-logo sm"
          src={TOKEN_META.logo256Path}
          width={36}
          height={36}
          alt=""
        />
        <div>
          <h2>Token information</h2>
          <p className="panel-sub">
            {TOKEN_META.org} · {TOKEN_META.project}
            {CHAIN_META.demoOnly ? " · demo mode" : " · on-chain"}
          </p>
        </div>
      </div>
      <dl className="token-info-list">
        {rows.map((r) => (
          <div className="token-info-row" key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="muted" style={{ fontSize: "0.8rem", marginTop: 12 }}>
        Full JSON:{" "}
        <a href={`${RAW_BASE}/token.json`} target="_blank" rel="noreferrer">
          {RAW_BASE}/token.json
        </a>
      </p>
    </section>
  );
}
