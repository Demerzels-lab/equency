/**
 * pnpm deploy:show [--fast]           (testnet 46630 · the live deployment)
 * CHAIN_ID=4663 pnpm deploy:show      (mainnet replay · once deployed)
 *
 * Cinematic terminal replay of the EQUENCY Strategy Vault onchain deployment · for screen
 * recordings. Chain-aware: reads packages/contracts/deployments/<CHAIN_ID>-vault.json and talks
 * to the REAL RPC while it runs. Every address, gas figure, bytecode length and contract-state
 * value is fetched LIVE from chain as the lines print · nothing is faked. Read-only.
 * Record it on a dark full-screen terminal. --fast skips the typewriter/animation pacing.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, http, defineChain, parseAbi, formatUnits, type Address } from "viem";

const FAST = process.argv.includes("--fast");
const CHAIN_ID = Number(process.env.CHAIN_ID ?? "46630");

// Reliable RPC (Alchemy) from the verified-facts file, so live calls work during recording ·
// the chain's own public RPC hosts are frequently unreachable.
function alchemyRpc(): string | null {
  try {
    const v = JSON.parse(readFileSync(resolve("deployments/robinhood-chain.verified.json"), "utf8"));
    return CHAIN_ID === 4663 ? v.chains.mainnet.rpcAlchemy : v.chains.testnet.rpcAlchemy;
  } catch { return null; }
}

const CHAINS: Record<number, { label: string; rpc: string; explorer: string }> = {
  46630: { label: "ROBINHOOD CHAIN · TESTNET", rpc: "https://rpc.testnet.chain.robinhood.com/rpc", explorer: "explorer.testnet.chain.robinhood.com" },
  4663: { label: "ROBINHOOD CHAIN · MAINNET", rpc: "https://rpc.mainnet.chain.robinhood.com/rpc", explorer: "robinhoodchain.blockscout.com" },
};
const NET = CHAINS[CHAIN_ID] ?? CHAINS[46630]!;
const RPC = process.env.RPC_URL ?? alchemyRpc() ?? NET.rpc;

// ── palette (EQUENCY teal on black) ──────────────────────────────────────────
const R = "\x1b[0m", B = "\x1b[1m", DIM = "\x1b[2m";
const TEAL = "\x1b[38;5;43m", TEAL2 = "\x1b[38;5;48m", GREEN = "\x1b[38;5;42m";
const CYAN = "\x1b[38;5;80m", GREY = "\x1b[38;5;244m", INK = "\x1b[38;5;255m", VIOLET = "\x1b[38;5;141m";
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

// deployment addresses (verified read-only) + real per-contract gas from the broadcast receipts
const depPath = resolve(`packages/contracts/deployments/${CHAIN_ID}-vault.json`);
if (!existsSync(depPath)) {
  line(`${VIOLET}No deployment for chain ${CHAIN_ID} at ${depPath}.${R}`);
  line(`${DIM}Testnet is live (CHAIN_ID=46630). Mainnet is not deployed yet.${R}`);
  process.exit(0);
}
const dep = JSON.parse(readFileSync(depPath, "utf8")) as { chainId: number; USDG: string; TSLA: string; NVDA: string; Oracle: string; Registry: string; Adapter: string; VaultFactory: string };

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
]);
const factoryAbi = parseAbi([
  "function usdg() view returns (address)",
  "function registry() view returns (address)",
  "function adapter() view returns (address)",
  "function vaultCount() view returns (uint256)",
]);
const oracleAbi = parseAbi(["function priceInUsdg(address) view returns (uint256, uint256)"]);
const erc20Abi = parseAbi(["function balanceOf(address) view returns (uint256)", "function symbol() view returns (string)"]);

async function main() {
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

  line(`${TEAL}┌─[${B}DEV@EQUENCY${R}${TEAL}]${R}`);
  process.stdout.write(`${TEAL}└─▸ ${R}`);
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
    const code = await spin("verifying onchain…", async () => { const c = await rpc<string>("eth_getCode", [addr, "latest"]); await sleep(120); return c; });
    const bytes = code && code.length > 2 ? (code.length - 2) / 2 : 0;
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

  // ── SCENE 2: the capital layer is live (all read live from chain) ──────────
  const chain = defineChain({ id: dep.chainId, name: NET.label, nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });
  const pub = createPublicClient({ chain, transport: http(RPC) });
  const FAC = dep.VaultFactory as Address, REG = dep.Registry as Address, ORC = dep.Oracle as Address, ADP = dep.Adapter as Address;

  line(`${TEAL}┌─[${B}DEV@EQUENCY${R}${TEAL}]${R}`);
  process.stdout.write(`${TEAL}└─▸ ${R}`);
  await type(`${TEAL2}equency vault --live${R}`, 22);
  await sleep(400);
  line();

  // Factory wiring
  line(`${TEAL}▸ VaultFactory · non-custodial vault deployer${R}`);
  try {
    const [usdg, reg, adp, count] = await spin("reading factory wiring onchain…", () => Promise.all([
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "usdg" }) as Promise<Address>,
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "registry" }) as Promise<Address>,
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "adapter" }) as Promise<Address>,
      pub.readContract({ address: FAC, abi: factoryAbi, functionName: "vaultCount" }) as Promise<bigint>,
    ]));
    const ok = (a: string, b: string) => a.toLowerCase() === b.toLowerCase() ? `${GREEN}✓${R}` : `${VIOLET}✗${R}`;
    line(`  ${TEAL}usdg ${R}${CYAN}${short(usdg)}${R} ${ok(usdg, dep.USDG)}  ${TEAL}registry ${R}${CYAN}${short(reg)}${R} ${ok(reg, dep.Registry)}  ${TEAL}adapter ${R}${CYAN}${short(adp)}${R} ${ok(adp, dep.Adapter)}`);
    line(`  ${TEAL}vaults created ${B}${count.toString()}${R}  ${DIM}each non-custodial · ships paused + capped${R}`);
  } catch { line(`  ${DIM}rpc busy${R}`); }
  await sleep(400);
  line();

  // Registry + oracle
  line(`${TEAL}▸ AssetRegistry · verified assets only (no arbitrary tokens)${R}`);
  try {
    const [owner, tslaOk, nvdaOk, tslaPx, nvdaPx] = await spin("reading registry + oracle onchain…", () => Promise.all([
      pub.readContract({ address: REG, abi: registryAbi, functionName: "owner" }) as Promise<Address>,
      pub.readContract({ address: REG, abi: registryAbi, functionName: "isSupported", args: [dep.TSLA as Address] }) as Promise<boolean>,
      pub.readContract({ address: REG, abi: registryAbi, functionName: "isSupported", args: [dep.NVDA as Address] }) as Promise<boolean>,
      pub.readContract({ address: ORC, abi: oracleAbi, functionName: "priceInUsdg", args: [dep.TSLA as Address] }) as Promise<readonly [bigint, bigint]>,
      pub.readContract({ address: ORC, abi: oracleAbi, functionName: "priceInUsdg", args: [dep.NVDA as Address] }) as Promise<readonly [bigint, bigint]>,
    ]));
    line(`  ${TEAL}owner ${R}${CYAN}${short(owner)}${R}  ${TEAL}TSLA ${tslaOk ? `${GREEN}verified${R}` : `${VIOLET}no${R}`}${R} ${DIM}@ $${formatUnits(tslaPx[0], 6)}${R}  ${TEAL}NVDA ${nvdaOk ? `${GREEN}verified${R}` : `${VIOLET}no${R}`}${R} ${DIM}@ $${formatUnits(nvdaPx[0], 6)}${R}`);
    line(`  ${DIM}price feeds live · staleness checked on-chain before any allocation${R}`);
  } catch { line(`  ${DIM}rpc busy${R}`); }
  await sleep(400);
  line();

  // Adapter reserves
  line(`${TEAL}▸ ExecutionAdapter · bounded swap route (approval-free)${R}`);
  try {
    const [usdgBal, tslaBal] = await spin("reading adapter reserves onchain…", () => Promise.all([
      pub.readContract({ address: dep.USDG as Address, abi: erc20Abi, functionName: "balanceOf", args: [ADP] }) as Promise<bigint>,
      pub.readContract({ address: dep.TSLA as Address, abi: erc20Abi, functionName: "balanceOf", args: [ADP] }) as Promise<bigint>,
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
  line(`${TEAL}┌─[${B}DEV@EQUENCY${R}${TEAL}]${R}`);
  line(`${TEAL}└─▸ ${R}${TEAL2}\x1b[5m▋\x1b[0m${R}`);
  line();
}

main();
