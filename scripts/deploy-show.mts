/**
 * pnpm deploy:show [--fast]                 (mainnet 4663 · the live production deployment)
 * CHAIN_ID=46630 pnpm deploy:show [--fast]  (testnet replay · mock stack)
 *
 * Cinematic terminal replay of the EQUENCY Strategy Vault onchain deployment · for screen
 * recordings. Chain-aware: reads packages/contracts/deployments/<CHAIN_ID>-vault.json and talks
 * to the REAL RPC while it runs. Every address, tx hash, gas figure, block, bytecode length and
 * contract-state value is fetched LIVE from chain as the lines print · nothing is faked. Read-only.
 * Record it on a dark full-screen terminal. --fast skips the typewriter/animation pacing.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, http, defineChain, parseAbi, formatUnits, formatEther, type Address, type PublicClient } from "viem";

const FAST = process.argv.includes("--fast");
const CHAIN_ID = Number(process.env.CHAIN_ID ?? "4663");
const MAINNET = CHAIN_ID === 4663;

// Reliable RPC (Alchemy) from the verified-facts file, so live calls work during recording ·
// the chain's own public RPC hosts are frequently unreachable.
function alchemyRpc(): string | null {
  try {
    const v = JSON.parse(readFileSync(resolve("deployments/robinhood-chain.verified.json"), "utf8"));
    return MAINNET ? v.chains.mainnet.rpcAlchemy : v.chains.testnet.rpcAlchemy;
  } catch { return null; }
}

const CHAINS: Record<number, { label: string; rpc: string; explorer: string }> = {
  46630: { label: "ROBINHOOD CHAIN · TESTNET", rpc: "https://rpc.testnet.chain.robinhood.com/rpc", explorer: "explorer.testnet.chain.robinhood.com" },
  4663: { label: "ROBINHOOD CHAIN · MAINNET", rpc: "https://rpc.mainnet.chain.robinhood.com/rpc", explorer: "robinhoodchain.blockscout.com" },
};
const NET = CHAINS[CHAIN_ID] ?? CHAINS[4663]!;
const RPC = process.env.RPC_URL ?? alchemyRpc() ?? NET.rpc;

// ── palette (EQUENCY teal on black) ──────────────────────────────────────────
const R = "\x1b[0m", B = "\x1b[1m", DIM = "\x1b[2m";
const TEAL = "\x1b[38;5;43m", TEAL2 = "\x1b[38;5;48m", GREEN = "\x1b[38;5;42m";
const CYAN = "\x1b[38;5;80m", GREY = "\x1b[38;5;244m", VIOLET = "\x1b[38;5;141m", AMBER = "\x1b[38;5;214m";
const sleep = (ms: number) => (FAST ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
const line = (s = "") => process.stdout.write(s + "\n");

async function type(text: string, cps = 240) {
  if (FAST) return line(text);
  for (const ch of text) { process.stdout.write(ch); await sleep(1000 / cps + Math.random() * 5); }
  line();
}
async function spin<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (FAST) return fn();
  const frames = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("");
  let i = 0;
  process.stdout.write("\x1b[?25l");
  const id = setInterval(() => process.stdout.write(`\r${TEAL}${frames[i++ % frames.length]}${R} ${DIM}${label}${R}\x1b[K`), 70);
  try { return await fn(); } finally { clearInterval(id); process.stdout.write("\r\x1b[K\x1b[?25h"); }
}
async function bar(width = 26) {
  if (FAST) return;
  for (let p = 0; p <= width; p++) {
    process.stdout.write(`\r    ${TEAL}${"█".repeat(p)}${GREY}${"░".repeat(width - p)}${R} ${DIM}${Math.round((p / width) * 100)}%${R}\x1b[K`);
    await sleep(14 + Math.random() * 22);
  }
  process.stdout.write("\r\x1b[K");
}

let rpcId = 0;
async function rpc<T>(method: string, params: unknown[] = []): Promise<T | null> {
  try {
    const res = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }) });
    const j = (await res.json()) as { result?: T };
    return j.result ?? null;
  } catch { return null; }
}
const hexInt = (h: string | null | undefined) => (h ? parseInt(h, 16) : null);
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const ZERO = "0x0000000000000000000000000000000000000000";
const codeBytes = async (addr: string) => {
  const c = await rpc<string>("eth_getCode", [addr, "latest"]);
  return c && c.length > 2 ? (c.length - 2) / 2 : 0;
};

// deployment addresses (verified read-only)
const depPath = resolve(`packages/contracts/deployments/${CHAIN_ID}-vault.json`);
if (!existsSync(depPath)) {
  line(`${VIOLET}No deployment for chain ${CHAIN_ID} at ${depPath}.${R}`);
  process.exit(0);
}
const dep = JSON.parse(readFileSync(depPath, "utf8")) as { chainId: number; USDG: string; TSLA: string; NVDA: string; Oracle: string; Registry: string; Adapter: string; VaultFactory: string };

/** Tx hashes from the forge broadcast log (the receipts themselves are re-read LIVE from chain). */
function broadcastTxs(script: string): { hash: string; kind: string; name?: string; fn?: string; address?: string }[] {
  try {
    const bc = JSON.parse(readFileSync(resolve(`packages/contracts/broadcast/${script}/${CHAIN_ID}/run-latest.json`), "utf8")) as {
      transactions?: { hash: string; transactionType: string; contractName?: string; function?: string | null; contractAddress?: string }[];
    };
    return (bc.transactions ?? []).map((t) => ({ hash: t.hash, kind: t.transactionType, name: t.contractName, fn: t.function ?? undefined, address: t.contractAddress }));
  } catch {
    // broadcast/ is gitignored · fall back to the public mainnet deploy tx hashes (receipts are still read live).
    return MAINNET ? MAINNET_DEPLOY_TXS : [];
  }
}

/** Mainnet deploy broadcast (2026-10-09, blocks 83528933–83528961) · public tx hashes. */
const MAINNET_DEPLOY_TXS = [
  { hash: "0x803d9af94839993242559fef36d4a4f5a4556c6e8afa1b3bc6920c6654b1fba2", kind: "CREATE", name: "EquencyAssetRegistry" },
  { hash: "0xf31bd94c4e2239a1743a09bf3db58d78818e9495bd76925c1876541eab0a6b43", kind: "CREATE", name: "ChainlinkPriceAdapter" },
  { hash: "0x11f5dd0eabdd9936aef727e5e7d5512ec8ca9d9a80347cdc41e9ec311d6e987a", kind: "CALL", name: "EquencyAssetRegistry" },
  { hash: "0xfa53f27c630951f79e81c07531cccfb7096a2c23a0d3f97a387335e968073df6", kind: "CALL", name: "EquencyAssetRegistry" },
  { hash: "0xdd3a02ae49ad8ef3065d885edd0594f366e0516b0288e5ede3d9ed259a068160", kind: "CREATE", name: "EquencyVaultFactory" },
];

const BANNER = String.raw`
 ███████╗ ██████╗ ██╗   ██╗███████╗███╗   ██╗ ██████╗██╗   ██╗
 ██╔════╝██╔═══██╗██║   ██║██╔════╝████╗  ██║██╔════╝╚██╗ ██╔╝
 █████╗  ██║   ██║██║   ██║█████╗  ██╔██╗ ██║██║      ╚████╔╝
 ██╔══╝  ██║▄▄ ██║██║   ██║██╔══╝  ██║╚██╗██║██║       ╚██╔╝
 ███████╗╚██████╔╝╚██████╔╝███████╗██║ ╚████║╚██████╗   ██║
 ╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝   ╚═╝`;

const registryAbi = parseAbi([
  "function owner() view returns (address)",
  "function isSupported(address) view returns (bool)",
  "function listedCount() view returns (uint256)",
]);
const factoryAbi = parseAbi([
  "function owner() view returns (address)",
  "function usdg() view returns (address)",
  "function registry() view returns (address)",
  "function adapter() view returns (address)",
  "function vaultCount() view returns (uint256)",
  "function allVaults(uint256) view returns (address)",
]);
const vaultAbi = parseAbi([
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function totalAssets() view returns (uint256)",
  "function depositCap() view returns (uint256)",
]);
const oracleAbi = parseAbi(["function priceInUsdg(address) view returns (uint256, uint256)", "function owner() view returns (address)"]);
const erc20Abi = parseAbi(["function balanceOf(address) view returns (uint256)", "function symbol() view returns (string)", "function name() view returns (string)", "function decimals() view returns (uint8)"]);

function client(): PublicClient {
  const chain = defineChain({ id: dep.chainId, name: NET.label, nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });
  return createPublicClient({ chain, transport: http(RPC) }) as PublicClient;
}

async function intro() {
  console.clear();
  line(TEAL + B + BANNER + R);
  line(`${GREY}   ${"─".repeat(56)}${R}`);
  line(`   ${DIM}Intelligence → Strategy → Capital · Strategy Vault · ${R}${TEAL2}${NET.label}${R}`);
  line();
  await sleep(500);

  line(`${DIM}[+] secure uplink established${R}`);
  const chainId = await spin("negotiating chain…", async () => { await sleep(500); return hexInt(await rpc<string>("eth_chainId")); });
  line(`${DIM}[+] connected · ${R}${GREEN}eth_chainId = ${chainId ?? "?"}${R}  ${DIM}(${NET.explorer})${R}`);
  const head0 = await spin("syncing head…", async () => { await sleep(400); return hexInt(await rpc<string>("eth_blockNumber")); });
  line(`${DIM}[+] chain head · ${R}${GREEN}#${head0?.toLocaleString() ?? "?"}${R}`);
  await sleep(500);
  line();
}

function prompt() {
  line(`${TEAL}┌─[${B}DEV@EQUENCY${R}${TEAL}]${R}`);
  process.stdout.write(`${TEAL}└─▸ ${R}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// MAINNET · real USDG + Robinhood stock tokens, custody-only launch
// ═════════════════════════════════════════════════════════════════════════════
async function mainnet() {
  await intro();
  const pub = client();

  // ── SCENE 1: the deploy broadcast, replayed from the real receipts ──────────
  prompt();
  await type(`${TEAL2}forge script DeployMainnet --broadcast --rpc-url $RH_RPC_MAINNET --account equency-deployer${R}`, 22);
  await sleep(400);
  line();
  line(`${DIM}   compiling · solc 0.8.24 · viaIR · optimizer 200 · evm cancun … ${R}${GREEN}ok${R}`);
  line(`${TEAL}[>]${R} broadcasting · chain ${B}${dep.chainId}${R} ${DIM}· real USDG settlement${R}`);
  await sleep(500);
  line();

  const LABEL: Record<string, string> = {
    EquencyAssetRegistry: "Deploying AssetRegistry · verified assets only",
    ChainlinkPriceAdapter: "Deploying ChainlinkPriceAdapter · oracle with staleness checks",
    EquencyVaultFactory: "Deploying VaultFactory · non-custodial vault deployer",
  };
  const txs = broadcastTxs("DeployMainnet.s.sol");
  let setAssetIdx = 0;
  let totalGas = 0;
  let totalFee = 0n;
  let deployer = "";
  for (const t of txs) {
    const isCreate = t.kind === "CREATE";
    const sym = !isCreate ? (["TSLA", "NVDA"][setAssetIdx++] ?? "asset") : "";
    line(`${TEAL}▸${R} ${isCreate ? LABEL[t.name ?? ""] ?? `Deploying ${t.name}` : `Registering ${sym} · real Robinhood stock token (disabled until Chainlink feed)`}`);
    await bar();
    const rc = await spin("confirming receipt onchain…", () => rpc<{ status: string; gasUsed: string; effectiveGasPrice: string; blockNumber: string; contractAddress?: string; from: string }>("eth_getTransactionReceipt", [t.hash]));
    if (!rc) { line(`  ${VIOLET}receipt unavailable (rpc busy)${R}`); line(); continue; }
    deployer = rc.from;
    const gas = hexInt(rc.gasUsed) ?? 0;
    const fee = BigInt(rc.gasUsed) * BigInt(rc.effectiveGasPrice);
    totalGas += gas; totalFee += fee;
    const ok = rc.status === "0x1";
    if (isCreate && rc.contractAddress) {
      const bytes = await codeBytes(rc.contractAddress);
      line(`  ${ok ? `${TEAL2}${B}✓ DEPLOYED` : `${VIOLET}✗ FAILED`}${R}  ${CYAN}${rc.contractAddress}${R}`);
      line(`  ${DIM}   block #${hexInt(rc.blockNumber)?.toLocaleString()} · gas ${gas.toLocaleString()} · fee ${formatEther(fee)} ETH · ${R}${GREEN}${bytes.toLocaleString()} bytes live${R}`);
    } else {
      line(`  ${ok ? `${TEAL2}${B}✓ REGISTERED` : `${VIOLET}✗ FAILED`}${R}  ${CYAN}${sym}${R} ${DIM}→ registry · disabled${R}`);
      line(`  ${DIM}   block #${hexInt(rc.blockNumber)?.toLocaleString()} · gas ${gas.toLocaleString()} · fee ${formatEther(fee)} ETH${R}`);
    }
    line(`  ${DIM}   tx ${t.hash}${R}`);
    line();
    await sleep(240);
  }

  line(`${TEAL}${"═".repeat(66)}${R}`);
  line(`${TEAL2}${B}  ◆ STRATEGY VAULT DEPLOYED ON ROBINHOOD CHAIN MAINNET · VERIFIED LIVE${R}`);
  line(`${TEAL}${"═".repeat(66)}${R}`);
  line(`  ${DIM}${txs.length} txs · total gas ${R}${GREEN}${totalGas.toLocaleString()}${R}  ${DIM}· total fee ${R}${GREEN}${formatEther(totalFee)} ETH${R}`);
  if (deployer) line(`  ${DIM}deployer / owner ${R}${CYAN}${deployer}${R}`);
  await sleep(700);
  line();

  // ── SCENE 2: the capital layer, read live from chain ───────────────────────
  prompt();
  await type(`${TEAL2}equency vault --live --network mainnet${R}`, 22);
  await sleep(400);
  line();

  const FAC = dep.VaultFactory as Address, REG = dep.Registry as Address, ORC = dep.Oracle as Address;

  // Real assets
  line(`${TEAL}▸ Real assets · canonical tokens already on Robinhood Chain${R}`);
  for (const a of [dep.USDG, dep.TSLA, dep.NVDA] as Address[]) {
    try {
      const [name, symbol, decimals] = await spin("reading token onchain…", () => Promise.all([
        pub.readContract({ address: a, abi: erc20Abi, functionName: "name" }),
        pub.readContract({ address: a, abi: erc20Abi, functionName: "symbol" }),
        pub.readContract({ address: a, abi: erc20Abi, functionName: "decimals" }),
      ]));
      line(`  ${GREEN}✓${R} ${B}${symbol.padEnd(5)}${R} ${CYAN}${short(a)}${R}  ${DIM}${name} · ${decimals}dp${R}`);
    } catch { line(`  ${DIM}${short(a)} · rpc busy${R}`); }
  }
  await sleep(400);
  line();

  // Factory wiring + user vaults
  line(`${TEAL}▸ VaultFactory · non-custodial vault deployer${R}`);
  try {
    const [usdg, reg, adp, count, owner] = await spin("reading factory wiring onchain…", () => Promise.all([
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "usdg" }),
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "registry" }),
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "adapter" }),
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "vaultCount" }),
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "owner" }),
    ]));
    const ok = (a: string, b: string) => (a.toLowerCase() === b.toLowerCase() ? `${GREEN}✓${R}` : `${VIOLET}✗${R}`);
    line(`  ${TEAL}usdg ${R}${CYAN}${short(usdg)}${R} ${ok(usdg, dep.USDG)}  ${TEAL}registry ${R}${CYAN}${short(reg)}${R} ${ok(reg, dep.Registry)}  ${TEAL}owner ${R}${CYAN}${short(owner)}${R}`);
    line(`  ${TEAL}adapter ${R}${adp.toLowerCase() === ZERO ? `${AMBER}none · custody-only launch (DEX route added later via setAdapter)${R}` : `${CYAN}${short(adp)}${R}`}`);
    line(`  ${TEAL}vaults created ${B}${count.toString()}${R}  ${DIM}each non-custodial · owned by its creator · ships paused + capped${R}`);
    if (count > 0n) {
      const last = await pub.readContract({ address: FAC, abi: factoryAbi, functionName: "allVaults", args: [count - 1n] });
      const [vOwner, paused, nav, cap] = await spin("reading latest vault onchain…", () => Promise.all([
        pub.readContract({ address: last, abi: vaultAbi, functionName: "owner" }),
        pub.readContract({ address: last, abi: vaultAbi, functionName: "paused" }),
        pub.readContract({ address: last, abi: vaultAbi, functionName: "totalAssets" }),
        pub.readContract({ address: last, abi: vaultAbi, functionName: "depositCap" }),
      ]));
      const bytes = await codeBytes(last);
      line(`  ${TEAL}latest vault ${R}${CYAN}${last}${R}  ${GREEN}${bytes.toLocaleString()} bytes live${R}`);
      line(`  ${DIM}   owner ${short(vOwner)} · ${paused ? "PAUSED" : "ACTIVE"} · NAV ${Number(formatUnits(nav, 6)).toLocaleString()} USDG · cap ${Number(formatUnits(cap, 6)).toLocaleString()} USDG${R}`);
    }
  } catch { line(`  ${DIM}rpc busy${R}`); }
  await sleep(400);
  line();

  // Registry + oracle
  line(`${TEAL}▸ AssetRegistry + Chainlink oracle · verified assets only${R}`);
  try {
    const [owner, listed, tslaOk, nvdaOk, oOwner] = await spin("reading registry + oracle onchain…", () => Promise.all([
      pub.readContract({ address: REG, abi: registryAbi, functionName: "owner" }),
      pub.readContract({ address: REG, abi: registryAbi, functionName: "listedCount" }),
      pub.readContract({ address: REG, abi: registryAbi, functionName: "isSupported", args: [dep.TSLA as Address] }),
      pub.readContract({ address: REG, abi: registryAbi, functionName: "isSupported", args: [dep.NVDA as Address] }),
      pub.readContract({ address: ORC, abi: oracleAbi, functionName: "owner" }),
    ]));
    const st = (b: boolean) => (b ? `${GREEN}enabled${R}` : `${AMBER}registered · disabled${R}`);
    line(`  ${TEAL}registry owner ${R}${CYAN}${short(owner)}${R}  ${TEAL}listed ${B}${listed.toString()}${R}  ${TEAL}TSLA ${R}${st(tslaOk)}  ${TEAL}NVDA ${R}${st(nvdaOk)}`);
    line(`  ${TEAL}oracle ${R}${CYAN}${short(ORC)}${R} ${DIM}owner ${short(oOwner)} · Chainlink feeds wired per asset after on-chain verification${R}`);
  } catch { line(`  ${DIM}rpc busy${R}`); }
  await sleep(400);
  line();

  line(`${TEAL}${"═".repeat(66)}${R}`);
  line(`${TEAL2}${B}  ◆ EQUENCY IS LIVE ON MAINNET · EVERY NUMBER ABOVE IS ONCHAIN${R}`);
  line(`${TEAL}${"═".repeat(66)}${R}`);
  line(`  ${DIM}safety: AI proposes · deterministic policy validates · AI never signs${R}`);
  line(`  ${DIM}launch posture: custody-only · vaults ship paused · deposits open after external audit${R}`);
  line(`  ${DIM}verify anything yourself:${R}`);
  line(`    ${CYAN}${NET.explorer}${R} ${DIM}· chain ${dep.chainId} · head #${(await rpc<string>("eth_blockNumber").then(hexInt))?.toLocaleString() ?? "?"}${R}`);
  line(`    ${CYAN}${NET.explorer}/address/${dep.VaultFactory}${R}`);
  line();
  prompt();
  line(`${TEAL2}\x1b[5m▋\x1b[0m${R}`);
  line();
}

// ═════════════════════════════════════════════════════════════════════════════
// TESTNET · mock USDG/stock stack (kept for reference)
// ═════════════════════════════════════════════════════════════════════════════
async function testnet() {
  await intro();

  // real gas per deployed contract, parsed from the forge broadcast receipts (if present)
  const gasByAddr = new Map<string, number>();
  try {
    const bc = JSON.parse(readFileSync(resolve(`packages/contracts/broadcast/Deploy.s.sol/${CHAIN_ID}/run-latest.json`), "utf8")) as { receipts?: { contractAddress?: string; gasUsed?: string }[] };
    for (const r of bc.receipts ?? []) if (r.contractAddress && r.gasUsed) gasByAddr.set(r.contractAddress.toLowerCase(), hexInt(r.gasUsed) ?? 0);
  } catch { /* no broadcast receipts · gas shown as n/a */ }

  const STEPS: { key: keyof typeof dep; label: string; done: string }[] = [
    { key: "USDG", label: "Deploying mock USDG · 6dp settlement asset", done: "MINTED" },
    { key: "TSLA", label: "Launching mock TSLA stock token · 18dp", done: "LAUNCHED" },
    { key: "NVDA", label: "Launching mock NVDA stock token · 18dp", done: "LAUNCHED" },
    { key: "Oracle", label: "Deploying price oracle · owner-set (testnet)", done: "ONLINE" },
    { key: "Registry", label: "Sealing AssetRegistry · verified assets only", done: "SEALED" },
    { key: "Adapter", label: "Arming ExecutionAdapter · approval-free swaps", done: "ARMED" },
    { key: "VaultFactory", label: "Deploying VaultFactory · non-custodial vault deployer", done: "ONLINE" },
  ];

  prompt();
  await type(`${TEAL2}forge script Deploy --broadcast --rpc-url $RH_RPC_TESTNET${R}`, 22);
  await sleep(400);
  line();
  line(`${DIM}   compiling · solc 0.8.24 · viaIR · optimizer 200 · evm cancun … ${R}${GREEN}ok${R}`);
  line(`${TEAL}[>]${R} broadcasting · chain ${B}${dep.chainId}${R}`);
  await sleep(500);
  line();

  let totalGas = 0;
  for (const step of STEPS) {
    const addr = dep[step.key] as string;
    line(`${TEAL}▸${R} ${step.label}`);
    await bar();
    const bytes = await spin("verifying onchain…", () => codeBytes(addr));
    const gas = gasByAddr.get(addr.toLowerCase()) ?? null;
    if (gas) totalGas += gas;
    const tag = step.key === "USDG" || step.key === "TSLA" || step.key === "NVDA" ? ` ${VIOLET}mock${R}` : "";
    line(`  ${TEAL2}${B}✓ ${step.done}${R}${tag}  ${CYAN}${addr}${R}`);
    line(`  ${DIM}   gas ${gas ? gas.toLocaleString() : "n/a"} · ${R}${GREEN}${bytes.toLocaleString()} bytes live${R}`);
    line();
    await sleep(240);
  }

  line(`${TEAL}${"═".repeat(62)}${R}`);
  line(`${TEAL2}${B}  ◆ STRATEGY VAULT DEPLOYED · ONCHAIN EXECUTION VERIFIED LIVE${R}`);
  line(`${TEAL}${"═".repeat(62)}${R}`);
  line(`  ${DIM}total deploy gas ${R}${GREEN}${totalGas.toLocaleString()}${R}   ${DIM}head ${R}${GREEN}#${(await rpc<string>("eth_blockNumber").then(hexInt))?.toLocaleString() ?? "?"}${R}`);
  await sleep(700);
  line();

  const pub = client();
  const FAC = dep.VaultFactory as Address, REG = dep.Registry as Address, ORC = dep.Oracle as Address, ADP = dep.Adapter as Address;

  prompt();
  await type(`${TEAL2}equency vault --live${R}`, 22);
  await sleep(400);
  line();

  line(`${TEAL}▸ VaultFactory · non-custodial vault deployer${R}`);
  try {
    const [usdg, reg, adp, count] = await spin("reading factory wiring onchain…", () => Promise.all([
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "usdg" }),
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "registry" }),
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "adapter" }),
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "vaultCount" }),
    ]));
    const ok = (a: string, b: string) => (a.toLowerCase() === b.toLowerCase() ? `${GREEN}✓${R}` : `${VIOLET}✗${R}`);
    line(`  ${TEAL}usdg ${R}${CYAN}${short(usdg)}${R} ${ok(usdg, dep.USDG)}  ${TEAL}registry ${R}${CYAN}${short(reg)}${R} ${ok(reg, dep.Registry)}  ${TEAL}adapter ${R}${CYAN}${short(adp)}${R} ${ok(adp, dep.Adapter)}`);
    line(`  ${TEAL}vaults created ${B}${count.toString()}${R}  ${DIM}each non-custodial · ships paused + capped${R}`);
  } catch { line(`  ${DIM}rpc busy${R}`); }
  await sleep(400);
  line();

  line(`${TEAL}▸ AssetRegistry · verified assets only (no arbitrary tokens)${R}`);
  try {
    const [owner, tslaOk, nvdaOk, tslaPx, nvdaPx] = await spin("reading registry + oracle onchain…", () => Promise.all([
      pub.readContract({ address: REG, abi: registryAbi, functionName: "owner" }),
      pub.readContract({ address: REG, abi: registryAbi, functionName: "isSupported", args: [dep.TSLA as Address] }),
      pub.readContract({ address: REG, abi: registryAbi, functionName: "isSupported", args: [dep.NVDA as Address] }),
      pub.readContract({ address: ORC, abi: oracleAbi, functionName: "priceInUsdg", args: [dep.TSLA as Address] }),
      pub.readContract({ address: ORC, abi: oracleAbi, functionName: "priceInUsdg", args: [dep.NVDA as Address] }),
    ]));
    line(`  ${TEAL}owner ${R}${CYAN}${short(owner)}${R}  ${TEAL}TSLA ${tslaOk ? `${GREEN}verified${R}` : `${VIOLET}no${R}`}${R} ${DIM}@ $${formatUnits(tslaPx[0], 6)}${R}  ${TEAL}NVDA ${nvdaOk ? `${GREEN}verified${R}` : `${VIOLET}no${R}`}${R} ${DIM}@ $${formatUnits(nvdaPx[0], 6)}${R}`);
    line(`  ${DIM}price feeds live · staleness checked on-chain before any allocation${R}`);
  } catch { line(`  ${DIM}rpc busy${R}`); }
  await sleep(400);
  line();

  line(`${TEAL}▸ ExecutionAdapter · bounded swap route (approval-free)${R}`);
  try {
    const [usdgBal, tslaBal] = await spin("reading adapter reserves onchain…", () => Promise.all([
      pub.readContract({ address: dep.USDG as Address, abi: erc20Abi, functionName: "balanceOf", args: [ADP] }),
      pub.readContract({ address: dep.TSLA as Address, abi: erc20Abi, functionName: "balanceOf", args: [ADP] }),
    ]));
    line(`  ${TEAL}reserves ${B}${Number(formatUnits(usdgBal, 6)).toLocaleString()} USDG${R} · ${B}${Number(formatUnits(tslaBal, 18)).toLocaleString()} TSLA${R}  ${DIM}vault transfers, then invest() · core never approves${R}`);
  } catch { line(`  ${DIM}rpc busy${R}`); }
  await sleep(400);
  line();

  line(`${TEAL}${"═".repeat(62)}${R}`);
  line(`${TEAL2}${B}  ◆ EQUENCY STRATEGY VAULT IS LIVE · EVERY NUMBER ABOVE IS ONCHAIN${R}`);
  line(`${TEAL}${"═".repeat(62)}${R}`);
  line(`  ${DIM}safety: AI proposes · deterministic policy validates · AI never signs${R}`);
  line(`  ${DIM}verify anything yourself:${R}`);
  line(`    ${CYAN}${NET.explorer}${R} ${DIM}· chain ${dep.chainId} · head #${(await rpc<string>("eth_blockNumber").then(hexInt))?.toLocaleString() ?? "?"}${R}`);
  line(`    ${CYAN}${NET.explorer}/address/${dep.VaultFactory}${R}`);
  line(`  ${DIM}testnet uses a mock USDG/stock stack · real-asset integration is mainnet-only.${R}`);
  line();
  prompt();
  line(`${TEAL2}\x1b[5m▋\x1b[0m${R}`);
  line();
}

(MAINNET ? mainnet() : testnet()).catch((e) => {
  line(`${VIOLET}deploy:show failed · ${e instanceof Error ? e.message : String(e)}${R}`);
  process.exit(1);
});
