"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPublicClient, createWalletClient, custom, defineChain,
  parseAbi, parseUnits, formatUnits, zeroAddress, type Address, type PublicClient, type WalletClient, type Chain,
} from "viem";
import {
  DEPLOYMENTS, deploymentByHex, isDeployed, explorerAddr, explorerTx, shortAddr, CHAIN_HEX, type VaultDeployment,
} from "@/lib/deployments";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input as UiInput } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet } from "@/components/wallet/WalletProvider";
import { cn } from "@/lib/utils";

function buildChain(d: VaultDeployment): Chain {
  const rpc = d.chainId === 46630
    ? "https://rpc.testnet.chain.robinhood.com/rpc"
    : "https://rpc.mainnet.chain.robinhood.com/rpc";
  return defineChain({
    id: d.chainId,
    name: d.label,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpc] } },
    blockExplorers: { default: { name: "Explorer", url: d.explorer } },
  });
}

const erc20 = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function mint(address,uint256)",
]);
const factoryAbi = parseAbi([
  "function createVault(uint16,uint16,uint8,uint256) returns (address)",
  "function vaultsOf(address) view returns (address[])",
]);
// keccak256("VaultCreated(address,address,uint16,uint16,uint8,uint256)")
const VAULT_CREATED_TOPIC = "0x41cc40ef682aa92e66d50e5b0486544dfdcf402e3837fceb60bcf32dd357f136";
const vaultAbi = parseAbi([
  "function paused() view returns (bool)",
  "function unpause()",
  "function totalAssets() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function deposit(uint256,address) returns (uint256)",
  "function withdraw(uint256,address,address) returns (uint256)",
  "function allocate(address,uint256)",
  "function divest(address,uint256)",
  "function positionsList() view returns (address[])",
  "function positionValue(address) view returns (uint256)",
]);

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown>; on?: (e: string, cb: (x: unknown) => void) => void; removeListener?: (e: string, cb: (x: unknown) => void) => void };
const getEth = (): Eth | undefined => (globalThis as unknown as { ethereum?: Eth }).ethereum;
const fUSDG = (v: bigint) => Number(formatUnits(v, 6)).toLocaleString("en-US", { maximumFractionDigits: 2 });

interface Position { addr: Address; sym: string; value6: bigint; bal: bigint }
interface State { usdg: bigint; vaults: Address[]; vault: Address | null; paused: boolean; nav: bigint; idle: bigint; shares: bigint; positions: Position[] }
/** One row of the owner's vault history (GET /api/vault-history, mainnet). */
interface HistoryItem { vault: string; index: number; txHash: string | null; block: number | null; timestamp: number | null; maxPositionBps: number | null; cashReserveBps: number | null; maxPositions: number | null; paused: boolean | null }
/** Confirmed vault-creation receipt, shown in the success popup. */
interface Created { hash: `0x${string}`; vault: Address | null; block: bigint; gasUsed: bigint; chainId: number }

export function VaultApp() {
  const { account: acctStr, chainId: chainHex, connect, switchChain } = useWallet();
  const account = acctStr as Address | null;
  const [pub, setPub] = useState<PublicClient | null>(null);
  const [wallet, setWallet] = useState<WalletClient | null>(null);
  const [st, setSt] = useState<State | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // Synchronous in-flight lock: React state alone can't stop a second click landing before the
  // re-render, nor a click in the gap between a receipt and the success popup.
  const inFlight = useRef(false);
  const [phase, setPhase] = useState<"sign" | "confirm" | null>(null);
  const [confirmAnother, setConfirmAnother] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string; hash?: string } | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  // Which of the owner's vaults the panel shows (null = latest).
  const [sel, setSel] = useState<Address | null>(null);
  // History is tagged with the owner it belongs to, so switching wallets never shows stale rows.
  const [historyOf, setHistoryOf] = useState<{ owner: string; items: HistoryItem[] } | null>(null);
  const history = historyOf && account && historyOf.owner === account.toLowerCase() ? historyOf.items : null;
  const setHistory = (fn: (h: HistoryItem[] | null) => HistoryItem[]) => {
    if (account) setHistoryOf({ owner: account.toLowerCase(), items: fn(history) });
  };
  const [depIn, setDepIn] = useState("1000");
  const [allocIn, setAllocIn] = useState("300");
  const [allocSym, setAllocSym] = useState("TSLA");
  const [wdIn, setWdIn] = useState("500");

  const dep = chainHex ? deploymentByHex(chainHex) : undefined;
  const deployed = isDeployed(dep);
  const C = (dep?.contracts ?? {}) as Record<string, Address>;
  const hasAdapter = !!C.Adapter && C.Adapter !== zeroAddress;
  const isTestnet = dep?.chainId === 46630;
  const isMainnet = dep?.chainId === 4663;
  const stocks = [C.TSLA ? { sym: "TSLA", addr: C.TSLA } : null, C.NVDA ? { sym: "NVDA", addr: C.NVDA } : null].filter(Boolean) as { sym: string; addr: Address }[];
  const symOf = (a: string) => stocks.find((s) => s.addr.toLowerCase() === a.toLowerCase())?.sym ?? shortAddr(a);

  // ---- rebuild clients when account/chain changes ----
  useEffect(() => {
    const eth = getEth();
    if (!eth || !account || !chainHex) return;
    const d = deploymentByHex(chainHex);
    if (!d) { setPub(null); setWallet(null); return; }
    const transport = custom(eth);
    const ch = buildChain(d);
    setPub(createPublicClient({ chain: ch, transport }));
    setWallet(createWalletClient({ chain: ch, transport, account }));
  }, [account, chainHex]);

  // wallet account/chain changes are tracked by the shared WalletProvider; clear stale state on chain change
  useEffect(() => { setSt(null); }, [chainHex]);

  async function switchTo(chainId: number) {
    const d = DEPLOYMENTS[chainId];
    const rpc = chainId === 46630 ? "https://rpc.testnet.chain.robinhood.com/rpc" : "https://rpc.mainnet.chain.robinhood.com/rpc";
    await switchChain(CHAIN_HEX[chainId], {
      chainId: CHAIN_HEX[chainId], chainName: d.label,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: [rpc], blockExplorerUrls: [d.explorer],
    });
  }

  const refresh = useCallback(async () => {
    if (!pub || !account || !deployed) return;
    try {
      const usdg = await pub.readContract({ address: C.USDG, abi: erc20, functionName: "balanceOf", args: [account] });
      const vaults = await pub.readContract({ address: C.VaultFactory, abi: factoryAbi, functionName: "vaultsOf", args: [account] }) as Address[];
      const selected = sel && vaults.some((v) => v.toLowerCase() === sel.toLowerCase()) ? sel : null;
      const vault = selected ?? (vaults.length ? vaults[vaults.length - 1] : null);
      if (!vault) { setSt({ usdg, vaults, vault: null, paused: false, nav: 0n, idle: 0n, shares: 0n, positions: [] }); return; }
      const [paused, nav, shares, idle, posAddrs] = await Promise.all([
        pub.readContract({ address: vault, abi: vaultAbi, functionName: "paused" }),
        pub.readContract({ address: vault, abi: vaultAbi, functionName: "totalAssets" }),
        pub.readContract({ address: vault, abi: vaultAbi, functionName: "balanceOf", args: [account] }),
        pub.readContract({ address: C.USDG, abi: erc20, functionName: "balanceOf", args: [vault] }),
        pub.readContract({ address: vault, abi: vaultAbi, functionName: "positionsList" }) as Promise<Address[]>,
      ]);
      const positions: Position[] = [];
      for (const a of posAddrs) {
        const [value6, bal] = await Promise.all([
          pub.readContract({ address: vault, abi: vaultAbi, functionName: "positionValue", args: [a] }),
          pub.readContract({ address: a, abi: erc20, functionName: "balanceOf", args: [vault] }),
        ]);
        positions.push({ addr: a, sym: symOf(a), value6, bal });
      }
      setSt({ usdg, vaults, vault, paused, nav, shares, idle, positions });
    } catch { /* read failed */ }
  }, [pub, account, deployed, C.USDG, C.VaultFactory, sel]);

  // Vault history with creation transactions (server reads chain; mainnet only).
  const loadHistory = useCallback(async () => {
    if (!account || dep?.chainId !== 4663) return;
    const owner = account.toLowerCase();
    try {
      const r = await fetch(`/api/vault-history?owner=${account}`, { cache: "no-store" });
      const j = (await r.json()) as { items?: HistoryItem[] };
      const server = j.items ?? [];
      // Keep just-created rows the server can't see yet (RPC lag right after confirmation).
      setHistoryOf((h) => {
        const pending = h && h.owner === owner ? h.items.filter((x) => !server.some((y) => y.vault.toLowerCase() === x.vault.toLowerCase()) && x.txHash) : [];
        const merged = [...pending, ...server];
        const total = merged.length;
        return { owner, items: merged.map((x, i) => ({ ...x, index: total - i })) };
      });
    } catch {
      setHistoryOf((h) => (h && h.owner === owner ? h : { owner, items: [] }));
    }
  }, [account, dep?.chainId]);

  useEffect(() => { refresh(); loadHistory(); }, [refresh, loadHistory]);


  /** Send one transaction. `hold` keeps the lock after the receipt (caller releases it). */
  async function run(label: string, fn: () => Promise<`0x${string}`>, opts?: { hold?: boolean }) {
    if (!wallet || !pub || inFlight.current) return null;
    inFlight.current = true;
    setBusy(label); setMsg(null); setPhase("sign");
    let hold = false;
    try {
      const hash = await fn();
      setPhase("confirm");
      const receipt = await pub.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("transaction reverted");
      setMsg({ kind: "ok", text: `${label} confirmed`, hash });
      await refresh();
      hold = !!opts?.hold;
      return receipt;
    } catch (e: unknown) {
      setMsg({ kind: "err", text: `${label}: ${e instanceof Error ? e.message.split("\n")[0] : "failed"}` });
      return null;
    } finally {
      if (!hold) release();
    }
  }
  function release() {
    inFlight.current = false;
    setBusy(null); setPhase(null);
  }
  const busyText = phase === "sign" ? "Confirm in wallet…" : phase === "confirm" ? "Confirming on-chain…" : "…";

  const w = () => wallet!; const a = () => account!; const ch = dep ? buildChain(dep) : (undefined as unknown as Chain);
  const faucet = () => run("Mint 10,000 test USDG", () => w().writeContract({ address: C.USDG, abi: erc20, functionName: "mint", args: [a(), parseUnits("10000", 6)], chain: ch, account: a() }));
  async function createVault() {
    // Lock is held from click until the success popup is on screen (released in finally).
    const receipt = await run("Create vault", () => w().writeContract({ address: C.VaultFactory, abi: factoryAbi, functionName: "createVault", args: [3000, 2000, 5, parseUnits("1000000", 6)], chain: ch, account: a() }), { hold: true });
    if (!receipt) return;
    try {
    if (!pub || !dep) return;
    // The vault THIS transaction created, from its own VaultCreated event (topics[2]) ·
    // not "latest in the registry", which could belong to another concurrent transaction.
    let vault: Address | null = null;
    const ev = receipt.logs.find((l) => l.address.toLowerCase() === C.VaultFactory.toLowerCase() && l.topics[0] === VAULT_CREATED_TOPIC);
    if (ev?.topics[2]) vault = (`0x${ev.topics[2].slice(26)}`) as Address;
    setCreated({ hash: receipt.transactionHash, vault, block: receipt.blockNumber, gasUsed: receipt.gasUsed, chainId: dep.chainId });
    if (vault) {
      setSel(vault);
      // Show the new vault in history immediately; the server fills in the rest on reload.
      setHistory((h) => [
        { vault, index: (h?.length ?? 0) + 1, txHash: receipt.transactionHash, block: Number(receipt.blockNumber), timestamp: Math.floor(Date.now() / 1000), maxPositionBps: 3000, cashReserveBps: 2000, maxPositions: 5, paused: true },
        ...(h ?? []).filter((x) => x.vault.toLowerCase() !== vault!.toLowerCase()),
      ]);
    }
    void loadHistory();
    } finally {
      release();
    }
  }
  const unpause = () => run("Unpause vault", () => w().writeContract({ address: st!.vault!, abi: vaultAbi, functionName: "unpause", chain: ch, account: a() }));
  async function deposit() {
    if (!st?.vault || !pub) return;
    const amt = parseUnits(depIn || "0", 6);
    const allowance = await pub.readContract({ address: C.USDG, abi: erc20, functionName: "allowance", args: [a(), st.vault] });
    if (allowance < amt) await run("Approve USDG", () => w().writeContract({ address: C.USDG, abi: erc20, functionName: "approve", args: [st.vault!, amt], chain: ch, account: a() }));
    await run("Deposit USDG", () => w().writeContract({ address: st!.vault!, abi: vaultAbi, functionName: "deposit", args: [amt, a()], chain: ch, account: a() }));
  }
  const allocate = () => run(`Allocate ${allocSym}`, () => w().writeContract({ address: st!.vault!, abi: vaultAbi, functionName: "allocate", args: [stocks.find((s) => s.sym === allocSym)!.addr, parseUnits(allocIn || "0", 6)], chain: ch, account: a() }));
  const divest = (p: Position) => run(`Divest ${p.sym}`, () => w().writeContract({ address: st!.vault!, abi: vaultAbi, functionName: "divest", args: [p.addr, p.bal], chain: ch, account: a() }));
  const withdraw = () => run("Withdraw USDG", () => w().writeContract({ address: st!.vault!, abi: vaultAbi, functionName: "withdraw", args: [parseUnits(wdIn || "0", 6), a(), a()], chain: ch, account: a() }));

  // ---------------------------------------------------------------- render
  if (!account) {
    return (
      <div>
        <button onClick={connect} className="group inline-flex items-center gap-4 bg-[color:var(--color-ink)] px-6 py-4 text-sm font-medium tracking-tight text-[color:var(--color-bg)] transition-colors hover:bg-white">
          Connect Wallet <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
        <p className="label mt-2 normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
          Live on Robinhood Chain mainnet (4663) with real USDG. Connect to create your non-custodial Strategy Vault.
        </p>
        <Msg msg={msg} />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
    <div className="panel p-5">
      {/* header + network switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline pb-3">
        <div className="label">Connected · <span className="mono normal-case" style={{ color: "var(--color-ink)" }}>{shortAddr(account)}</span></div>
        {isMainnet ? (
          <span className="label inline-flex items-center gap-1.5" style={{ color: "var(--color-pos)" }}>
            <span className="pulse" style={{ display: "inline-block", width: 6, height: 6, borderRadius: 9999, background: "var(--color-pos)" }} />
            Robinhood Chain · Mainnet
          </span>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={() => switchTo(4663)} className="label rounded-sm">
            Switch to Robinhood Chain
          </Button>
        )}
      </div>

      {/* unknown / undeployed network */}
      {!dep ? (
        <div className="py-5 text-sm" style={{ color: "var(--color-warn)" }}>
          Unsupported network. Switch to Robinhood Chain mainnet (4663) above.
        </div>
      ) : !deployed ? (
        <div className="py-5">
          <div className="text-sm" style={{ color: "var(--color-ink-dim)" }}>
            <span className="mono" style={{ color: "var(--color-sim)" }}>{dep.label} ({dep.chainId})</span> · EQUENCY vault is <span style={{ color: "var(--color-sim)" }}>not deployed here yet</span>.
          </div>
          <p className="label mt-2 normal-case leading-relaxed" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
            EQUENCY runs on Robinhood Chain mainnet (4663). Switch networks above to continue.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between py-2 text-xs">
            <span className="mono" style={{ color: "var(--color-ink-dim)" }}>USDG: <span style={{ color: "var(--color-ink)" }}>{st ? fUSDG(st.usdg) : "…"}</span></span>
            {!hasAdapter && <span className="label" style={{ color: "var(--color-sim)" }}>custody-only (no DEX)</span>}
          </div>

          {isTestnet && (
            <Step n="1" title="Faucet" done={!!st && st.usdg > 0n}>
              <Btn onClick={faucet} busy={busy === "Mint 10,000 test USDG"}>Mint 10,000 test USDG</Btn>
            </Step>
          )}

          {!st?.vault ? (
            <Step n="2" title="Create your Strategy Vault">
              <div className="label mb-2 normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>Growth defaults · 30% max position · 20% cash reserve · 5 positions · ships paused</div>
              <Btn onClick={createVault} busy={busy === "Create vault"} busyText={busyText}>Create vault</Btn>
            </Step>
          ) : (
            <>
              <Step n="2" title={st.vaults.length > 1 ? `Vault #${st.vaults.findIndex((v) => v.toLowerCase() === st.vault!.toLowerCase()) + 1} of ${st.vaults.length}` : "Vault"} done>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <a href={explorerAddr(dep.chainId, st.vault)} target="_blank" rel="noreferrer" className="mono text-xs" style={{ color: "var(--color-accent)" }}>{shortAddr(st.vault)} ↗</a>
                  <span className="mono text-xs" style={{ color: st.paused ? "var(--color-warn)" : "var(--color-pos)" }}>{st.paused ? "PAUSED" : "ACTIVE"}</span>
                </div>
                {st.paused && !isMainnet && <Btn onClick={unpause} busy={busy === "Unpause vault"} className="mt-2">Unpause (owner acknowledges unaudited)</Btn>}
                {st.paused && isMainnet && (
                  <p className="label mt-2 normal-case leading-relaxed" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
                    Your vault is live on mainnet and ships paused. Real-USDG deposits open after the external audit.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Btn onClick={() => setConfirmAnother(true)} busy={busy === "Create vault"} busyText={busyText} small>+ Create another vault</Btn>
                  <span className="label normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>Growth defaults · 30% · 20% · 5 positions</span>
                </div>
              </Step>

              <div className="my-4 grid grid-cols-3 gap-3 border-y hairline py-3">
                <Metric label="NAV (USDG)" value={fUSDG(st.nav)} />
                <Metric label="Idle USDG" value={fUSDG(st.idle)} />
                <Metric label="Positions" value={String(st.positions.length)} />
              </div>

              {!st.paused && (
                <>
                  <Step n="3" title="Deposit USDG">
                    <Row><Input value={depIn} onChange={setDepIn} suffix="USDG" /><Btn onClick={deposit} busy={busy?.startsWith("Deposit") || busy?.startsWith("Approve")}>Approve &amp; Deposit</Btn></Row>
                  </Step>

                  {hasAdapter ? (
                    <Step n="4" title="Allocate (policy enforced on-chain)">
                      <Row>
                        <Select value={allocSym} onValueChange={(v) => v && setAllocSym(v)}>
                          <SelectTrigger size="sm" className="mono w-24 rounded-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {stocks.map((s) => <SelectItem key={s.sym} value={s.sym} className="mono">{s.sym}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input value={allocIn} onChange={setAllocIn} suffix="USDG" />
                        <Btn onClick={allocate} busy={busy?.startsWith("Allocate")}>Allocate</Btn>
                      </Row>
                    </Step>
                  ) : (
                    <div className="py-3 text-xs" style={{ color: "var(--color-ink-faint)" }}>
                      Allocation disabled · no DEX execution adapter on this network yet. Custody / deposit / withdraw only.
                    </div>
                  )}

                  {st.positions.length > 0 && (
                    <div className="mb-4">
                      <div className="label mb-2">Positions</div>
                      {st.positions.map((p) => (
                        <div key={p.addr} className="flex items-center justify-between border-b hairline py-2 text-xs">
                          <span className="mono" style={{ color: "var(--color-accent)" }}>{p.sym}</span>
                          <span className="mono" style={{ color: "var(--color-ink)" }}>{fUSDG(p.value6)} USDG</span>
                          <Btn onClick={() => divest(p)} busy={busy === `Divest ${p.sym}`} small>Divest</Btn>
                        </div>
                      ))}
                    </div>
                  )}

                  <Step n="5" title="Withdraw USDG (clamped to idle)">
                    <Row><Input value={wdIn} onChange={setWdIn} suffix="USDG" /><Btn onClick={withdraw} busy={busy === "Withdraw USDG"}>Withdraw</Btn></Row>
                  </Step>
                </>
              )}
            </>
          )}
        </>
      )}

      <Msg msg={msg} chainId={dep?.chainId} />

      {/* Confirm before creating an ADDITIONAL vault · it's a real mainnet transaction */}
      <Dialog open={confirmAnother} onOpenChange={setConfirmAnother}>
        <DialogContent>
          <div className="flex flex-col gap-4">
            <div>
              <DialogTitle>Create another Strategy Vault?</DialogTitle>
              <DialogDescription className="mt-1">
                This sends one transaction from {account ? shortAddr(account) : "your wallet"} on {dep?.label ?? "Robinhood Chain"}.
                You will have {(st?.vaults.length ?? 0) + 1} vaults.
              </DialogDescription>
            </div>
            <div className="rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)] p-4 font-mono text-xs text-[color:var(--color-ink-dim)]">
              Growth defaults · 30% max position · 20% cash reserve · 5 positions · ships paused
            </div>
            <div className="flex items-center justify-end gap-3">
              <DialogClose className="px-3 py-2 text-xs text-[color:var(--color-ink-faint)] transition-colors hover:text-[color:var(--color-ink)]">Cancel</DialogClose>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => { setConfirmAnother(false); void createVault(); }}
                className="rounded-md bg-[color:var(--color-ink)] px-4 py-2 text-sm font-medium text-[color:var(--color-bg)] transition-colors hover:bg-white disabled:opacity-50"
              >
                Create vault
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success popup · links to the creation TRANSACTION on Blockscout (not the contract) */}
      <Dialog open={!!created} onOpenChange={(o) => { if (!o) setCreated(null); }}>
        <DialogContent>
          {created && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-[color:color-mix(in_oklab,var(--color-pos)_18%,transparent)] text-lg text-[color:var(--color-pos)]">✓</span>
                <div>
                  <DialogTitle>Strategy Vault created</DialogTitle>
                  <DialogDescription>
                    Confirmed on {DEPLOYMENTS[created.chainId]?.label ?? "Robinhood Chain"} · block {created.block.toString()}
                  </DialogDescription>
                </div>
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)] p-4 font-mono text-xs">
                <dt className="text-[color:var(--color-ink-faint)]">Transaction</dt>
                <dd className="truncate text-right text-[color:var(--color-ink)]" title={created.hash}>{shortAddr(created.hash)}</dd>
                {created.vault && (
                  <>
                    <dt className="text-[color:var(--color-ink-faint)]">Your vault</dt>
                    <dd className="truncate text-right text-[color:var(--color-ink)]" title={created.vault}>{shortAddr(created.vault)}</dd>
                  </>
                )}
                <dt className="text-[color:var(--color-ink-faint)]">Gas used</dt>
                <dd className="text-right text-[color:var(--color-ink)]">{created.gasUsed.toLocaleString("en-US")}</dd>
                <dt className="text-[color:var(--color-ink-faint)]">Status</dt>
                <dd className="text-right text-[color:var(--color-warn)]">{created.chainId === 4663 ? "PAUSED · opens after audit" : "PAUSED · unpause to deposit"}</dd>
              </dl>

              <a
                href={explorerTx(created.chainId, created.hash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--color-ink)] px-5 py-3 text-sm font-medium text-[color:var(--color-bg)] transition-colors hover:bg-white"
              >
                View transaction on Blockscout ↗
              </a>
              <div className="flex items-center justify-between text-xs">
                {created.vault ? (
                  <a href={explorerAddr(created.chainId, created.vault)} target="_blank" rel="noreferrer" className="text-[color:var(--color-ink-faint)] transition-colors hover:text-[color:var(--color-ink)]">
                    View vault contract ↗
                  </a>
                ) : <span />}
                <DialogClose className="text-[color:var(--color-ink-faint)] transition-colors hover:text-[color:var(--color-ink)]">Close</DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>

    <VaultHistory
      chainId={dep?.chainId}
      items={dep?.chainId === 4663 ? history : (st?.vaults ?? []).map((v, i) => ({ vault: v, index: i + 1, txHash: null, block: null, timestamp: null, maxPositionBps: null, cashReserveBps: null, maxPositions: null, paused: null })).reverse()}
      loading={dep?.chainId === 4663 && history === null}
      selected={st?.vault ?? null}
      onSelect={(v) => setSel(v as Address)}
    />
    </div>
  );
}

/** The owner's Strategy Vaults, newest first · each links to its creation TRANSACTION. */
function VaultHistory({ chainId, items, loading, selected, onSelect }: {
  chainId?: number;
  items: HistoryItem[] | null;
  loading: boolean;
  selected: string | null;
  onSelect: (vault: string) => void;
}) {
  const fmt = (ts: number | null) =>
    ts ? new Date(ts * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "·";
  const pct = (bps: number | null) => (bps == null ? "·" : `${bps / 100}%`);
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between border-b hairline pb-3">
        <span className="label">Vault history</span>
        <span className="label normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
          {loading ? "reading chain…" : items ? `${items.length} vault${items.length === 1 ? "" : "s"}` : ""}
        </span>
      </div>

      {items === null && loading && (
        <div className="space-y-2 pt-3">
          {[0, 1].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-[color:var(--color-panel-2)]" />)}
        </div>
      )}
      {items !== null && items.length === 0 && (
        <p className="pt-4 text-xs leading-relaxed" style={{ color: "var(--color-ink-faint)" }}>
          No vaults yet. Each vault you create appears here with its creation transaction on Blockscout.
        </p>
      )}

      <ul className="flex flex-col gap-2 pt-3">
        {(items ?? []).map((it) => {
          const active = !!selected && selected.toLowerCase() === it.vault.toLowerCase();
          return (
            <li key={it.vault}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(it.vault)}
                onKeyDown={(e) => { if (e.key === "Enter") onSelect(it.vault); }}
                className={cn(
                  "cursor-pointer rounded-md border p-3 transition-colors",
                  active ? "border-[color:var(--color-core)] bg-[color:color-mix(in_oklab,var(--color-core)_10%,transparent)]" : "border-[color:var(--color-line)] hover:bg-[color:var(--color-panel-2)]",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                    Vault #{it.index}
                    {active && <span className="label ml-2" style={{ color: "var(--color-core)" }}>viewing</span>}
                  </span>
                  {it.paused != null && (
                    <span className="mono text-[10px]" style={{ color: it.paused ? "var(--color-warn)" : "var(--color-pos)" }}>{it.paused ? "PAUSED" : "ACTIVE"}</span>
                  )}
                </div>
                <div className="mono mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px]" style={{ color: "var(--color-ink-faint)" }}>
                  <span>{shortAddr(it.vault)}</span>
                  <span>{fmt(it.timestamp)}</span>
                </div>
                {it.maxPositionBps != null && (
                  <div className="mono mt-1 text-[10px]" style={{ color: "var(--color-ink-faint)" }}>
                    max {pct(it.maxPositionBps)} · reserve {pct(it.cashReserveBps)} · {it.maxPositions} positions
                  </div>
                )}
                <div className="mt-2 flex items-center gap-4 text-[11px]">
                  {it.txHash && chainId ? (
                    <a href={explorerTx(chainId, it.txHash)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="underline-offset-2 hover:underline" style={{ color: "var(--color-accent)" }}>
                      Creation tx {shortAddr(it.txHash)} ↗
                    </a>
                  ) : chainId === 4663 ? (
                    <span style={{ color: "var(--color-ink-faint)" }}>locating tx…</span>
                  ) : null}
                  {chainId && (
                    <a href={explorerAddr(chainId, it.vault)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="underline-offset-2 hover:underline" style={{ color: "var(--color-ink-faint)" }}>
                      Contract ↗
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Step({ n, title, done, children }: { n: string; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b hairline last:border-0">
      <div className="mb-2 flex items-center gap-2">
        <span className="mono text-xs" style={{ color: done ? "var(--color-pos)" : "var(--color-accent)" }}>{done ? "✓" : n}</span>
        <span className="text-sm font-semibold tracking-tight">{title}</span>
      </div>
      {children}
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return <div><div className="mono text-lg font-semibold tabular-nums" style={{ color: "var(--color-ink)" }}>{value}</div><div className="label mt-0.5">{label}</div></div>;
}
function Row({ children }: { children: React.ReactNode }) { return <div className="flex flex-wrap items-center gap-2">{children}</div>; }
function Input({ value, onChange, suffix }: { value: string; onChange: (v: string) => void; suffix: string }) {
  return (
    <div className="flex items-center gap-1 rounded-sm border border-border px-2">
      <UiInput
        value={value} inputMode="decimal"
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        className="mono h-9 w-20 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
      />
      <span className="label">{suffix}</span>
    </div>
  );
}
function Btn({ onClick, busy, busyText = "…", children, className = "", small }: { onClick: () => void; busy?: boolean; busyText?: string; children: React.ReactNode; className?: string; small?: boolean }) {
  return (
    <Button type="button" onClick={onClick} disabled={busy} variant="outline" size={small ? "sm" : "default"} className={cn("label rounded-sm", className)}>
      {busy ? busyText : children}
    </Button>
  );
}
function Msg({ msg, chainId }: { msg: { kind: "ok" | "err"; text: string; hash?: string } | null; chainId?: number }) {
  if (!msg) return null;
  return (
    <div className="mt-3 text-xs" style={{ color: msg.kind === "ok" ? "var(--color-pos)" : "var(--color-danger)" }}>
      {msg.text}
      {msg.hash && (
        <>
          {" · "}
          {chainId ? (
            <a href={explorerTx(chainId, msg.hash)} target="_blank" rel="noreferrer" className="mono underline-offset-2 hover:underline" style={{ color: "var(--color-ink-faint)" }}>
              {shortAddr(msg.hash)} ↗
            </a>
          ) : (
            <span className="mono" style={{ color: "var(--color-ink-faint)" }}>{shortAddr(msg.hash)}</span>
          )}
        </>
      )}
    </div>
  );
}
