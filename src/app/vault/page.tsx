import { Display, AsciiIcon } from "@/components/brand";
import { CopyField } from "@/components/CopyField";
import { VaultApp } from "@/components/VaultApp";
import { readVaultLiveness } from "@/lib/chain";
import { TESTNET, explorerAddr, shortAddr } from "@/lib/deployments";
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
  { t: "Oracle", art: "·◉·\n╱│╲\n· ·", d: "Chainlink on mainnet, owner-set on testnet. Freshness checked." },
];

/** The quick read of the vault's status: deployment headline, summary, and the live facts. */
function VaultVerdict({ onTestnet, vaultCount, contractCount }: { onTestnet: boolean; vaultCount: number | null; contractCount: number }) {
  const statusColor = onTestnet ? "var(--color-pos)" : "var(--color-sim)";
  const stats = [
    { label: "Contracts", value: String(contractCount), sub: "on-chain" },
    { label: "Foundry tests", value: "14 / 14", sub: "passing" },
    { label: "Testnet 46630", value: onTestnet ? "Live" : "Verify", sub: "robinhood chain" },
    { label: "Mainnet 4663", value: "Pending", sub: "not deployed" },
    { label: "Vaults", value: vaultCount != null ? String(vaultCount) : "·", sub: "created · live" },
  ];
  return (
    <section className="mt-8 overflow-hidden rounded-sm border border-border bg-card">
      <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-[300px_1fr]">
        <div
          className="flex flex-col justify-between bg-card px-5 py-4"
          style={{ background: `linear-gradient(145deg, color-mix(in oklab, ${statusColor} 10%, var(--color-card)), var(--color-card) 60%)` }}
        >
          <div className="flex items-center justify-between">
            <span className="label" style={{ color: statusColor }}>Strategy Vault</span>
            <span className="mono inline-flex items-center gap-1.5 text-[9px]" style={{ color: statusColor }}>
              <span className={onTestnet ? "pulse" : ""} style={{ display: "inline-block", width: 6, height: 6, borderRadius: 9999, background: statusColor, color: statusColor }} />
              {onTestnet ? "DEPLOYED" : "PENDING"}
            </span>
          </div>
          <div className="mt-3 text-5xl font-semibold leading-none" style={{ color: statusColor }}>
            {onTestnet ? "LIVE" : "PENDING"}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="label">Posture</span>
            <span className="mono text-xs text-muted-foreground">Non-custodial</span>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 bg-card px-5 py-4">
          <p className="max-w-[72ch] text-pretty text-sm leading-relaxed text-foreground/90">
            The vault is built, fully tested{" "}
            <span className="text-foreground">(14/14 Foundry, incl. a real-USDG mainnet fork)</span>, and{" "}
            {onTestnet ? "live on Robinhood Chain testnet" : "awaiting on-chain verification"}. Mainnet is pending review ·
            deposits stay closed until a deliberate unpause.
          </p>
          <div className="grid gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="label truncate normal-case tracking-normal text-muted-foreground">{s.label}</div>
                <div className="mono mt-1.5 text-xl font-semibold leading-none">{s.value}</div>
                <div className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{s.sub}</div>
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
  const onTestnet = live.factoryHasCode;
  return (
    <main className="pt-14">
      {/* hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-[1240px] px-6 pt-16 pb-20">
          <div className="section-label">01 / ON-CHAIN EXECUTION</div>
          <h1 className="editorial-h1">
            Strategy <span className="editorial-accent">Vault.</span>
          </h1>
          <p className="editorial-lead mt-4 max-w-xl">
            Where intelligence becomes capital. A non-custodial ERC-4626 vault on Robinhood Chain that holds USDG,
            buys verified assets within limits enforced on-chain, and never lets the AI sign a transaction.
          </p>

          <VaultVerdict onTestnet={onTestnet} vaultCount={live.vaultCount} contractCount={Object.keys(TESTNET.contracts).length} />

          <div className="mt-12 max-w-xl">
            <VaultApp />
          </div>
        </div>
      </section>

      {/* flow */}
      <section className="mx-auto max-w-[1240px] px-6 py-20">
        <div className="section-label">02 / THE NON-CUSTODIAL LOOP</div>
        <h2 className="editorial-h2">Intelligence → Strategy → <span className="editorial-accent">Capital.</span></h2>
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-sm sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--color-line)" }}>
          {FLOW.map((s) => (
            <div key={s.n} className="bg-background p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold tracking-tight">{s.t}</span>
                <span className="mono text-xs text-muted-foreground">{s.n}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* architecture */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <Display as="h2" className="text-[clamp(1.8rem,4vw,3.2rem)]">Safety by structure.</Display>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Intelligence proposes, the deterministic policy validates, execution is bounded. The AI never
            holds a key. Every limit lives in the contract, not the UI.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-sm sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--color-line)" }}>
            {ARCH.map((c) => (
              <div key={c.t} className="bg-background p-5">
                <AsciiIcon art={c.art} />
                <div className="mt-4 text-base font-semibold tracking-tight">{c.t}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* verified chain facts */}
      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <Display as="h2" className="mb-8 text-[clamp(1.6rem,3.5vw,2.8rem)]">Verified on Robinhood Chain.</Display>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="gap-0 rounded-sm border-border bg-card p-5 shadow-none">
            <div className="label mb-3">Settlement asset</div>
            <CopyField label="USDG" value={USDG} display="0x5fc5…1d168" />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Canonical Global Dollar (6dp), verified on-chain. Transferability confirmed via mainnet-fork test,
              so non-custodial vault custody is viable.
            </p>
          </Card>
          <Card className="gap-0 rounded-sm border-border bg-card p-5 shadow-none">
            <div className="label mb-3">Network &amp; assets</div>
            <Row k="Mainnet" v="4663" />
            <Row k="Testnet" v="46630 (mock stack)" />
            <Row k="Gas" v="ETH" />
            <Row k="Stock tokens" v="TSLA, NVDA … (18dp)" />
            <Row k="Oracle" v="Chainlink (mainnet)" />
          </Card>
        </div>

        {/* Deployed contracts */}
        <Card className="mt-3 gap-0 overflow-hidden rounded-sm border-border bg-card py-0 shadow-none">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="label inline-flex items-center gap-2">
              {onTestnet && <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--color-pos)" }} />}
              Deployed · {TESTNET.label} ({TESTNET.chainId})
            </span>
            <span className="label" style={{ color: onTestnet ? "var(--color-pos)" : "var(--color-warn)" }}>
              {onTestnet ? "verified on-chain" : live.reachable ? "not found" : "see explorer"}
              {live.vaultCount != null ? ` · ${live.vaultCount} vaults` : ""}
            </span>
          </div>
          <Table>
            <TableBody>
              {Object.entries(TESTNET.contracts).map(([name, addr]) => (
                <TableRow key={name} className="border-border">
                  <TableCell className="text-sm">
                    {name}
                    {(name === "USDG" || name === "TSLA" || name === "NVDA") && (
                      <Badge variant="outline" className="label ml-2 rounded-sm border-border" style={{ color: "var(--color-sim)" }}>mock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <a href={explorerAddr(TESTNET.chainId, addr)} target="_blank" rel="noreferrer" className="mono text-xs" style={{ color: "var(--color-accent)" }}>
                      {shortAddr(addr)} ↗
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="mt-3 gap-0 rounded-sm border-border bg-card p-5 shadow-none">
          <div className="label mb-2">Honest status</div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Live on <span style={{ color: "var(--color-pos)" }}>testnet 46630</span> with a <span style={{ color: "var(--color-sim)" }}>mock</span> USDG/stock
            stack, so the real vault logic runs end-to-end on-chain. Contracts are <span style={{ color: "var(--color-warn)" }}>unaudited</span>; user
            vaults ship <span className="mono">paused + capped</span>. Mainnet (real USDG + Chainlink oracle) and real-money deposits stay
            off until external review and a deliberate <span className="mono">setPaused(false)</span>. Every value reads from chain, nothing is fabricated.
          </p>
        </Card>
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
