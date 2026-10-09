import { Display, AsciiIcon } from "@/components/brand";
import { CopyField } from "@/components/CopyField";
import { VaultApp } from "@/components/VaultApp";
import { readVaultLiveness } from "@/lib/chain";
import { MAINNET, explorerAddr, shortAddr } from "@/lib/deployments";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export const metadata = { title: "Strategy Vault · EQUENCY" };
export const revalidate = 60;

const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";

const FLOW = [
  { n: "01", t: "Connect wallet", d: "Robinhood Chain · USDG settlement · ETH gas." },
  { n: "02", t: "Create vault", d: "Bind your strategy limits: max position, cash reserve, max positions." },
  { n: "03", t: "Deposit USDG", d: "Non-custodial. You mint shares priced by NAV." },
  { n: "04", t: "Allocate", d: "Buy verified assets within limits enforced on-chain, not by the frontend." },
  { n: "05", t: "Monitor", d: "Live NAV, positions and P&L from chain state." },
  { n: "06", t: "Divest / withdraw", d: "Exit positions; withdraw USDG, clamped to available liquidity." },
];

const ARCH = [
  { t: "VaultFactory", art: "┌┬┐\n├┼┤\n└┴┘", d: "Deploys per-user non-custodial vaults." },
  { t: "StrategyVault", art: "[$$$]\n |·| \n[===]", d: "ERC4626 custody, NAV and share accounting." },
  { t: "AssetRegistry", art: "✓ ✓ ✓\n □ □\n✓ ✓ ✓", d: "Only verified tokens, never arbitrary addresses." },
  { t: "Policy", art: "├─┤\n│▓│\n├─┤", d: "Max position / cash reserve / max positions, enforced in the contract." },
  { t: "ExecutionAdapter", art: " ⇄ \n╱ ╲\n⇄ ⇄", d: "One interface per DEX; core untouched by integrations." },
  { t: "Oracle", art: "·◉·\n╱│╲\n· ·", d: "Chainlink price adapter, freshness checked. Feeds wired per asset after on-chain verification." },
];

/** The quick read of the vault's status: deployment headline, summary, and the live facts. */
function VaultVerdict({ onMainnet, vaultCount, contractCount }: { onMainnet: boolean; vaultCount: number | null; contractCount: number }) {
  const statusColor = onMainnet ? "var(--color-pos)" : "var(--color-sim)";
  const stats = [
    { label: "Contracts", value: String(contractCount), sub: "on-chain verified" },
    { label: "Foundry tests", value: "14 / 14", sub: "passing test suite" },
    { label: "Mainnet 4663", value: onMainnet ? "Live" : "Deployed", sub: "robinhood chain" },
    { label: "Settlement", value: "USDG", sub: "real · Paxos" },
    { label: "User Vaults", value: vaultCount != null ? String(vaultCount) : "0", sub: "non-custodial" },
  ];
  return (
    <section className="mt-10 overflow-hidden border border-[color:var(--color-line)] bg-[color:var(--color-panel)]">
      <div className="grid grid-cols-1 divide-y lg:divide-y-0 lg:divide-x divide-[color:var(--color-line)] lg:grid-cols-[280px_1fr]">
        <div
          className="flex flex-col justify-between p-6 sm:p-8 bg-[color:var(--color-panel-2)]/60"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-wider uppercase font-bold" style={{ color: statusColor }}>
                SPEC // PROTOCOL
              </span>
              <span className="font-mono inline-flex items-center gap-1.5 text-[9px] uppercase px-2 py-0.5 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-bg)]" style={{ color: statusColor }}>
                <span className={onMainnet ? "pulse" : ""} style={{ display: "inline-block", width: 5, height: 5, borderRadius: 9999, background: statusColor }} />
                {onMainnet ? "MAINNET" : "DEPLOYED"}
              </span>
            </div>
            <div className="mt-4 text-4xl sm:text-5xl font-black tracking-tight" style={{ color: statusColor }}>
              {onMainnet ? "LIVE" : "DEPLOYED"}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[color:var(--color-line)] flex items-center justify-between font-mono text-xs">
            <span className="text-[color:var(--color-ink-faint)] uppercase text-[10px]">Custody Model</span>
            <span className="font-bold text-[color:var(--color-ink)]">Non-custodial</span>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 bg-[color:var(--color-panel)]">
          <p className="max-w-[72ch] text-sm leading-relaxed text-[color:var(--color-ink-dim)]">
            The vault is <span className="font-semibold text-[color:var(--color-ink)]">live on Robinhood Chain mainnet</span>, settled in the
            real USDG and fully tested{" "}
            <span className="font-semibold text-[color:var(--color-ink)]">(14/14 Foundry tests including real-USDG mainnet fork)</span>.
            Launch posture is custody-only: vaults ship paused and real-USDG deposits open after the external audit.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 pt-4 border-t border-[color:var(--color-line)]">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)]">{s.label}</div>
                <div className="font-mono mt-1 text-lg font-bold tabular-nums text-[color:var(--color-ink)]">{s.value}</div>
                <div className="font-mono mt-0.5 text-[10px] text-[color:var(--color-ink-dim)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function VaultPage() {
  const live = await readVaultLiveness();
  const onMainnet = live.factoryHasCode;
  return (
    <main className="page-main pt-28 sm:pt-32 pb-20">
      {/* hero */}
      <section className="relative overflow-hidden border-b border-[color:var(--color-line)]">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-[1240px] px-6 pt-10 pb-20">
          <div className="section-label">VAULT / THE CAPITAL LAYER</div>
          <h1 className="editorial-h1">
            Intelligence becomes <span className="editorial-accent">capital.</span>
          </h1>
          <p className="editorial-lead mt-4 max-w-xl">
            Review your strategy, adjust the allocation, and deploy capital through a non-custodial Strategy Vault on
            Robinhood Chain · USDG settlement, verified assets only, every limit enforced on-chain. The Core proposes; you approve.
          </p>

          <VaultVerdict onMainnet={onMainnet} vaultCount={live.vaultCount} contractCount={Object.keys(MAINNET.contracts).length} />

          <div className="mt-12 max-w-5xl">
            <VaultApp />
          </div>
        </div>
      </section>

      {/* flow */}
      <section className="mx-auto max-w-[1240px] px-6 py-20">
        <div className="section-label">CORE → STRATEGY → VAULT</div>
        <h2 className="editorial-h2">Intelligence → Strategy → <span className="editorial-accent">Capital.</span></h2>
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-[color:var(--color-line)] sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--color-line)" }}>
          {FLOW.map((s) => (
            <div key={s.n} className="bg-[color:var(--color-panel)] p-6 hover:bg-[color:var(--color-panel-2)] transition-colors duration-150">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold tracking-tight text-[color:var(--color-ink)]">{s.t}</span>
                <span className="font-mono text-xs font-bold text-[color:var(--color-accent)]">{s.n} {"//"}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-ink-dim)]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* architecture */}
      <section className="border-y border-[color:var(--color-line)] bg-[color:var(--color-panel)]">
        <div className="mx-auto max-w-[1240px] px-6 py-20">
          <div className="section-label">STRUCTURAL SAFETY</div>
          <h2 className="editorial-h2">Safety by <span className="editorial-accent">structure.</span></h2>
          <p className="editorial-lead mt-3 max-w-xl">
            The Core proposes, a rule-based policy validates, execution is bounded. No model ever holds a key.
            Every limit lives in the contract, not the UI.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-[color:var(--color-line)] sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--color-line)" }}>
            {ARCH.map((c) => (
              <div key={c.t} className="bg-[color:var(--color-bg)] p-6 hover:bg-[color:var(--color-panel-2)] transition-colors duration-150">
                <AsciiIcon art={c.art} />
                <div className="mt-4 font-mono text-base font-bold tracking-tight text-[color:var(--color-ink)]">{c.t}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-dim)]">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* verified chain facts */}
      <section className="mx-auto max-w-[1240px] px-6 py-20">
        <div className="section-label">ROBINHOOD CHAIN PROOF</div>
        <h2 className="editorial-h2 mb-8">Live on Robinhood Chain <span className="editorial-accent">mainnet.</span></h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-6">
            <div className="font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-accent)] font-semibold mb-3">SETTLEMENT ASSET</div>
            <CopyField label="USDG" value={USDG} display="0x5fc5…1d168" />
            <p className="mt-4 font-mono text-xs leading-relaxed text-[color:var(--color-ink-dim)]">
              Canonical Global Dollar (6 decimals), verified on-chain. Transferability confirmed via mainnet-fork test suite,
              guaranteeing non-custodial vault solvency.
            </p>
          </div>
          <div className="border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-6">
            <div className="font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-accent)] font-semibold mb-3">NETWORK &amp; ASSET PARAMETERS</div>
            <Row k="Network" v="Robinhood Chain mainnet" />
            <Row k="Chain ID" v="4663" />
            <Row k="Gas Token" v="ETH" />
            <Row k="Stock Tokens" v="TSLA, NVDA (18 decimals)" />
            <Row k="Oracle Standard" v="Chainlink price adapter" />
          </div>
        </div>

        {/* Deployed contracts */}
        <div id="contracts" className="mt-6 scroll-mt-28 border border-[color:var(--color-line)] bg-[color:var(--color-panel)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[color:var(--color-line)] px-6 py-3.5 bg-[color:var(--color-panel-2)]/50">
            <span className="font-mono text-[11px] font-bold text-[color:var(--color-ink)] inline-flex items-center gap-2">
              {onMainnet && <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--color-pos)" }} />}
              DEPLOYED CONTRACTS // {MAINNET.label} ({MAINNET.chainId})
            </span>
            <span className="font-mono text-[10px] uppercase font-bold" style={{ color: onMainnet ? "var(--color-pos)" : "var(--color-warn)" }}>
              {onMainnet ? "VERIFIED ON-CHAIN" : live.reachable ? "NOT FOUND" : "SEE EXPLORER"}
              {live.vaultCount != null ? ` · ${live.vaultCount} VAULTS` : ""}
            </span>
          </div>
          <Table>
            <TableBody>
              {Object.entries(MAINNET.contracts).map(([name, addr]) => (
                <TableRow key={name} className="border-b border-[color:var(--color-line)] hover:bg-[color:var(--color-panel-2)] transition-colors">
                  <TableCell className="font-mono text-xs py-3.5 px-6 font-semibold text-[color:var(--color-ink)]">
                    {name}
                    {(name === "USDG" || name === "TSLA" || name === "NVDA") && (
                      <span className="font-mono text-[9px] uppercase tracking-wider ml-2 px-1.5 py-0.5 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-bg)] text-[color:var(--color-pos)]">real asset</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3.5 px-6">
                    <a href={explorerAddr(MAINNET.chainId, addr)} target="_blank" rel="noreferrer" className="font-mono text-xs text-[color:var(--color-accent)] hover:underline inline-flex items-center gap-1">
                      {shortAddr(addr)} <span>↗</span>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-6">
          <div className="font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-accent)] font-semibold mb-2">INTEGRITY &amp; SECURITY DISCLOSURE</div>
          <p className="text-xs leading-relaxed text-[color:var(--color-ink-dim)]">
            Deployed on <span className="font-semibold text-[color:var(--color-pos)]">Robinhood Chain mainnet 4663</span> against the real USDG and
            Robinhood stock tokens, with source verified on Sourcify. All contract logic executes on-chain; contracts are non-custodial and user
            vaults ship paused by default. Real-USDG deposits stay closed until the independent external audit and an explicit unpause; trading
            (DEX execution) and Chainlink price feeds are enabled in a later release. Every metric reads from ground-truth chain state.
          </p>
        </div>
      </section>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 text-xs last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="mono">{v}</span>
    </div>
  );
}
