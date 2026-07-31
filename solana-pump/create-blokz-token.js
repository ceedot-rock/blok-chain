/**
 * Launch $bLOkz on pump.fun (bonding curve = instant liquidity).
 *
 * Requires SOL on SOLANA_PRIVATE_KEY wallet (ZHq1…b9V).
 * Recommended ≥ 0.05 SOL; use most of balance for initial buy after fee buffer.
 *
 * Env:
 *   SOLANA_PRIVATE_KEY  (or ~/.env_secrets)
 *   BLOKZ_BUY_SOL       optional fixed buy size
 *   SOLANA_RPC_URL / HELIUS_RPC_URL
 */
const fs = require("fs");
const path = require("path");
const bs58 = require("bs58");
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const { AnchorProvider } = require("@coral-xyz/anchor");
const { PumpFunSDK } = require("pumpdotfun-sdk");
const NodeWallet = require("@coral-xyz/anchor/dist/cjs/nodewallet").default;

const DIR = __dirname;
const LOGO = process.env.BLOKZ_LOGO || path.join(DIR, "blokz-logo.png");
const SECRETS = "/home/cee/.env_secrets";

const NAME = "bLOkz";
const SYMBOL = "bLOkz";

const DESCRIPTION = `bLOkz — the on-chain token for bLOK CHaiN.

Stack blocks. Hold $bLOkz. Play the game:

🎮 https://github.com/ceedot-rock/blokz

Solana launch on pump.fun (bonding curve liquidity from day one).
Repo: https://github.com/ceedot-rock/blok-chain
Logo + meta: https://raw.githubusercontent.com/ceedot-rock/blok-chain/main/public/

Not financial advice. Community / game signal for bLOK CHaiN · SPLabs.`;

const WEBSITE = "https://github.com/ceedot-rock/blokz";
const TWITTER = process.env.BLOKZ_TWITTER || "https://x.com/ceedotrock";
const TELEGRAM = process.env.BLOKZ_TELEGRAM || "";

const RPC =
  process.env.SOLANA_RPC_URL ||
  process.env.HELIUS_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

function loadSecrets() {
  const out = {};
  if (!fs.existsSync(SECRETS)) return out;
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
    const dec = bs58.default ? bs58.default.decode(sk) : bs58.decode(sk);
    return Keypair.fromSecretKey(dec);
  } catch {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(sk)));
  }
}

async function main() {
  const secrets = loadSecrets();
  const sk = secrets.BLOKZ_SOLANA_PRIVATE_KEY || process.env.BLOKZ_SOLANA_PRIVATE_KEY || secrets.SOLANA_PRIVATE_KEY || process.env.SOLANA_PRIVATE_KEY;
  if (!sk) {
    console.error("Missing SOLANA_PRIVATE_KEY");
    process.exit(1);
  }
  if (!fs.existsSync(LOGO)) {
    console.error("Logo not found:", LOGO);
    process.exit(1);
  }

  const creator = loadKeypair(sk);
  console.log("Creator:", creator.publicKey.toBase58());
  console.log("RPC:", RPC);

  const connection = new Connection(RPC, "confirmed");
  const bal = await connection.getBalance(creator.publicKey);
  const sol = bal / LAMPORTS_PER_SOL;
  console.log(`Balance: ${sol.toFixed(6)} SOL`);

  // Use nearly all SOL: tiny buffer for prioritization / ATA rent leftovers
  const FEE_BUFFER = parseFloat(process.env.BLOKZ_FEE_BUFFER || "0.0025");
  const MIN_SOL = parseFloat(process.env.BLOKZ_MIN_SOL || "0.004");
  if (sol < MIN_SOL) {
    console.error(
      `\nINSUFFICIENT SOL: need ≥ ${MIN_SOL} SOL on ${creator.publicKey.toBase58()}`
    );
    console.error("Fund wallet then re-run: node create-blokz-token.js");
    process.exit(2);
  }

  const buySol = Math.max(0, sol - FEE_BUFFER);
  const buyOverride = process.env.BLOKZ_BUY_SOL
    ? parseFloat(process.env.BLOKZ_BUY_SOL)
    : buySol;
  // buy can be 0 if user only wants create (curve still live for others)
  const buyAmount = BigInt(Math.floor(Math.max(0, buyOverride) * LAMPORTS_PER_SOL));
  console.log(
    `Initial buy: ~${Number(buyAmount) / LAMPORTS_PER_SOL} SOL (buffer ${FEE_BUFFER})`
  );

  const wallet = new NodeWallet(creator);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "finalized",
  });
  const sdk = new PumpFunSDK(provider);

  const logoBuf = fs.readFileSync(LOGO);
  const file = new Blob([logoBuf], { type: "image/png" });

  const mint = Keypair.generate();
  const mintPath = path.join(DIR, `mint-${mint.publicKey.toBase58()}.json`);
  fs.writeFileSync(
    mintPath,
    JSON.stringify(
      {
        publicKey: mint.publicKey.toBase58(),
        secretKey: Array.from(mint.secretKey),
        createdAt: new Date().toISOString(),
        name: NAME,
        symbol: SYMBOL,
      },
      null,
      2
    ),
    { mode: 0o600 }
  );
  console.log("Mint key saved:", mintPath);
  console.log("Mint:", mint.publicKey.toBase58());

  const metadata = {
    name: NAME,
    symbol: SYMBOL,
    description: DESCRIPTION,
    file,
    twitter: TWITTER,
    telegram: TELEGRAM,
    website: WEBSITE,
  };

  console.log("\nCreating $bLOkz on pump.fun…");
  const result = await sdk.createAndBuy(
    creator,
    mint,
    metadata,
    buyAmount,
    500n,
    {
      unitLimit: 250000,
      unitPrice: 250000,
    }
  );

  if (result.success) {
    const url = `https://pump.fun/${mint.publicKey.toBase58()}`;
    const rec = {
      url,
      mint: mint.publicKey.toBase58(),
      signature: result.signature || null,
      solscan: result.signature
        ? `https://solscan.io/tx/${result.signature}`
        : null,
      name: NAME,
      symbol: SYMBOL,
      website: WEBSITE,
      buySol: Number(buyAmount) / LAMPORTS_PER_SOL,
      platform: "pump.fun",
      at: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(DIR, "LAST_LAUNCH.json"), JSON.stringify(rec, null, 2));
    console.log("\n=== SUCCESS ===");
    console.log(JSON.stringify(rec, null, 2));
    process.exit(0);
  }

  console.error("\n=== FAILED ===");
  console.error(result.error || result);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
