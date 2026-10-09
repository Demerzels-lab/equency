"use client";

import { useCallback, useEffect, useState } from "react";
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
interface State { usdg: bigint; vault: Address | null; paused: boolean; nav: bigint; idle: bigint; shares: bigint; positions: Position[] }
/** Confirmed vault-creation receipt, shown in the success popup. */
interface Created { hash: `0x${string}`; vault: Address | null; block: bigint; gasUsed: bigint; chainId: number }

export function VaultApp() {
  const { account: acctStr, chainId: chainHex, connect, switchChain } = useWallet();
  const account = acctStr as Address | null;
  const [pub, setPub] = useState<PublicClient | null>(null);
  const [wallet, setWallet] = useState<WalletClient | null>(null);
  const [st, setSt] = useState<State | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string; hash?: string } | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
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
      const vault = vaults.length ? vaults[vaults.length - 1] : null;
      if (!vault) { setSt({ usdg, vault: null, paused: false, nav: 0n, idle: 0n, shares: 0n, positions: [] }); return; }
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
      setSt({ usdg, vault, paused, nav, shares, idle, positions });
    } catch { /* read failed */ }
  }, [pub, account, deployed, C.USDG, C.VaultFactory]);

  useEffect(() => { refresh(); }, [refresh]);

  async function run(label: string, fn: () => Promise<`0x${string}`>) {
    if (!wallet || !pub) return null;
    setBusy(label); setMsg(null);
    try {
      const hash = await fn();
      const receipt = await pub.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("transaction reverted");
      setMsg({ kind: "ok", text: `${label} confirmed`, hash });
      await refresh();
      return receipt;
    } catch (e: unknown) {
      setMsg({ kind: "err", text: `${label}: ${e instanceof Error ? e.message.split("\n")[0] : "failed"}` });
      return null;
    } finally { setBusy(null); }
  }

  const w = () => wallet!; const a = () => account!; const ch = dep ? buildChain(dep) : (undefined as unknown as Chain);
  const faucet = () => run("Mint 10,000 test USDG", () => w().writeContract({ address: C.USDG, abi: erc20, functionName: "mint", args: [a(), parseUnits("10000", 6)], chain: ch, account: a() }));
  async function createVault() {
    const receipt = await run("Create vault", () => w().writeContract({ address: C.VaultFactory, abi: factoryAbi, functionName: "createVault", args: [3000, 2000, 5, parseUnits("1000000", 6)], chain: ch, account: a() }));
    if (!receipt || !pub || !dep) return;
    // The new vault is the caller's latest one in the factory registry.
    let vault: Address | null = null;
    try {
      const vs = (await pub.readContract({ address: C.VaultFactory, abi: factoryAbi, functionName: "vaultsOf", args: [a()] })) as Address[];
      vault = vs.length ? vs[vs.length - 1] : null;
    } catch { /* popup still shows the tx */ }
    setCreated({ hash: receipt.transactionHash, vault, block: receipt.blockNumber, gasUsed: receipt.gasUsed, chainId: dep.chainId });
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
              <Btn onClick={createVault} busy={busy === "Create vault"}>Create vault</Btn>
            </Step>
          ) : (
            <>
              <Step n="2" title="Vault" done>
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
function Btn({ onClick, busy, children, className = "", small }: { onClick: () => void; busy?: boolean; children: React.ReactNode; className?: string; small?: boolean }) {
  return (
    <Button type="button" onClick={onClick} disabled={busy} variant="outline" size={small ? "sm" : "default"} className={cn("label rounded-sm", className)}>
      {busy ? "…" : children}
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
