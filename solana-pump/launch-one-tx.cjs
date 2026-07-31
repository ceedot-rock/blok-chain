/**
 * ONE transaction: pump.fun createV2 + buy for $bLOkz
 * Wallet: BLOKZ_SOLANA_PRIVATE_KEY (Phantom m/44'/501'/0'/0' from bLOK mnemonic)
 * Website: https://github.com/ceedot-rock/blokz · logo from blokz game repo
 */
const fs = require("fs");
const path = require("path");
const bs58 = require("bs58");
const BN = require("bn.js");
const {
  Connection,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const {
  OnlinePumpSdk,
  PumpSdk,
  getBuyTokenAmountFromSolAmount,
} = require("@pump-fun/pump-sdk");
const { NATIVE_MINT } = require("@solana/spl-token");

const OUT = __dirname;
const SECRETS = "/home/cee/.env_secrets";
const RPC =
  process.env.SOLANA_RPC_URL ||
  process.env.HELIUS_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

const LOGO_CANDIDATES = [
  process.env.BLOKZ_LOGO,
  "/home/cee/projects/blokz/public/logo-blok.png",
  path.join(OUT, "blokz-logo.png"),
  "/home/cee/projects/blok-chain/public/logo.png",
].filter(Boolean);

const NAME = "bLOkz";
const SYMBOL = "bLOkz";
const WEBSITE = "https://github.com/ceedot-rock/blokz";
const TWITTER = process.env.BLOKZ_TWITTER || "https://x.com/ceedotrock";
const TELEGRAM = process.env.BLOKZ_TELEGRAM || "";
const DESCRIPTION = `bLOkz — the on-chain token for bLOK CHaiN.

Stack blocks. Hold $bLOkz. Play the game:
https://github.com/ceedot-rock/blokz

Solana pump.fun bonding curve (liquidity from day one).
Game: https://github.com/ceedot-rock/blokz
Meta: https://github.com/ceedot-rock/blok-chain

Not financial advice. SPLabs · bLOK CHaiN.`;

function loadSecrets() {
  const out = {};
  for (const line of fs.readFileSync(SECRETS, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    out[t.slice(0, i)] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function loadKeypair(sk) {
  try {
    return Keypair.fromSecretKey((bs58.default || bs58).decode(sk));
  } catch {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(sk)));
  }
}

function b58(u8) {
  return (bs58.default || bs58).encode(u8);
}

async function solPriceUsd() {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const j = await r.json();
    return j.solana.usd;
  } catch {
    return 75;
  }
}

async function uploadMetadata(logoPath) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([fs.readFileSync(logoPath)], { type: "image/png" }),
    "blokz.png"
  );
  form.append("name", NAME);
  form.append("symbol", SYMBOL);
  form.append("description", DESCRIPTION);
  form.append("twitter", TWITTER);
  form.append("telegram", TELEGRAM);
  form.append("website", WEBSITE);
  form.append("showName", "true");
  const res = await fetch("https://pump.fun/api/ipfs", {
    method: "POST",
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`IPFS ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function main() {
  const secrets = loadSecrets();
  const sk =
    secrets.BLOKZ_SOLANA_PRIVATE_KEY || process.env.BLOKZ_SOLANA_PRIVATE_KEY;
  if (!sk) throw new Error("Missing BLOKZ_SOLANA_PRIVATE_KEY");

  const logoPath = LOGO_CANDIDATES.find((p) => fs.existsSync(p));
  if (!logoPath) throw new Error("No logo file found");
  console.log("Logo:", logoPath);

  const creator = loadKeypair(sk);
  const connection = new Connection(RPC, "confirmed");
  const bal = await connection.getBalance(creator.publicKey);
  const solBal = bal / LAMPORTS_PER_SOL;
  console.log("Creator:", creator.publicKey.toBase58());
  console.log("Balance:", solBal.toFixed(6), "SOL");
  console.log("Website:", WEBSITE);

  const price = await solPriceUsd();
  let buySol = process.env.BLOKZ_BUY_SOL
    ? parseFloat(process.env.BLOKZ_BUY_SOL)
    : Math.max(0, solBal - 0.025);
  const maxBuy = Math.max(0, solBal - 0.025);
  if (buySol > maxBuy) buySol = maxBuy;
  if (buySol < 0.01) {
    console.error("Insufficient SOL for buy + fees. Have", solBal);
    process.exit(2);
  }

  const solAmount = new BN(Math.floor(buySol * LAMPORTS_PER_SOL));
  console.log(
    `ONE tx: create + buy ${buySol.toFixed(6)} SOL (~$${(buySol * price).toFixed(2)} @ $${price}/SOL)`
  );

  console.log("Uploading logo + metadata…");
  const meta = await uploadMetadata(logoPath);
  console.log("uri:", meta.metadataUri);

  const mint = Keypair.generate();
  const mintPath = path.join(OUT, `mint-${mint.publicKey.toBase58()}.json`);
  fs.writeFileSync(
    mintPath,
    JSON.stringify(
      {
        publicKey: mint.publicKey.toBase58(),
        secretKey: Array.from(mint.secretKey),
        secretKeyBase58: b58(mint.secretKey),
        createdAt: new Date().toISOString(),
        name: NAME,
        symbol: SYMBOL,
        website: WEBSITE,
        metadataUri: meta.metadataUri,
      },
      null,
      2
    ),
    { mode: 0o600 }
  );
  console.log("Mint:", mint.publicKey.toBase58());

  const online = new OnlinePumpSdk(connection);
  const offline = new PumpSdk(connection);
  const global = await online.fetchGlobal();
  let feeConfig = null;
  try {
    feeConfig = await online.fetchFeeConfig();
  } catch (_) {}

  const tokenAmount = getBuyTokenAmountFromSolAmount({
    global,
    feeConfig,
    mintSupply: null,
    bondingCurve: null,
    amount: solAmount,
    quoteMint: NATIVE_MINT,
  });
  console.log("Token amount (est):", tokenAmount.toString());

  const ixs = await offline.createV2AndBuyInstructions({
    global,
    mint: mint.publicKey,
    name: NAME,
    symbol: SYMBOL,
    uri: meta.metadataUri,
    creator: creator.publicKey,
    user: creator.publicKey,
    amount: tokenAmount,
    solAmount,
    mayhemMode: false,
    cashback: false,
  });
  console.log("Instructions:", ixs.length);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const msg = new TransactionMessage({
    payerKey: creator.publicKey,
    recentBlockhash: blockhash,
    instructions: ixs,
  }).compileToV0Message();

  const tx = new VersionedTransaction(msg);
  tx.sign([creator, mint]);
  const raw = tx.serialize();
  console.log("Tx size:", raw.length, "bytes (limit 1232)");
  if (raw.length > 1232) throw new Error(`Tx too large: ${raw.length}`);

  console.log("Sending ONE create+buy transaction…");
  const sig = await connection.sendRawTransaction(raw, {
    skipPreflight: false,
    maxRetries: 5,
    preflightCommitment: "confirmed",
  });
  console.log("sig:", sig);

  const conf = await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed"
  );
  if (conf.value.err) {
    console.error("On-chain error:", conf.value.err);
    process.exit(1);
  }

  const result = {
    url: `https://pump.fun/${mint.publicKey.toBase58()}`,
    mint: mint.publicKey.toBase58(),
    signature: sig,
    solscan: `https://solscan.io/tx/${sig}`,
    name: NAME,
    symbol: SYMBOL,
    website: WEBSITE,
    game: WEBSITE,
    metadataUri: meta.metadataUri,
    buySol,
    buyUsdApprox: buySol * price,
    solPriceUsd: price,
    creator: creator.publicKey.toBase58(),
    singleTransaction: true,
    at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(OUT, "LAST_LAUNCH.json"), JSON.stringify(result, null, 2));
  console.log("\n=== SUCCESS ===");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  if (e.logs) console.error(e.logs.join("\n"));
  process.exit(1);
});
