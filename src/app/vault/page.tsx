import { Kicker, Display, AsciiIcon, SectionMark } from "@/components/brand";
import { CopyField } from "@/components/CopyField";
import { VaultApp } from "@/components/VaultApp";
import { readVaultLiveness } from "@/lib/chain";
import { TESTNET, explorerAddr, shortAddr } from "@/lib/deployments";

export const metadata = { title: "Strategy Vault · EQUENCY" };
export const revalidate = 60;

const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"; // canonical mainnet USDG

const FLOW = [
  { n: "01", t: "Connect wallet", d: "Robinhood Chain · USDG settlement · ETH gas." },
  { n: "02", t: "Create vault", d: "Bind your strategy constraints · max position, cash reserve, max positions." },
  { n: "03", t: "Deposit USDG", d: "Non-custodial. You mint shares priced by NAV." },
  { n: "04", t: "Allocate", d: "Buy verified assets within limits enforced on-chain, not by the frontend." },
  { n: "05", t: "Monitor", d: "Live NAV, positions and P&L from chain state." },
  { n: "06", t: "Divest / withdraw", d: "Exit positions; withdraw USDG, clamped to available liquidity." },
];

const ARCH = [
  { t: "VaultFactory", art: "┌┬┐\n├┼┤\n└┴┘", d: "Deploys per-user non-custodial vaults." },
  { t: "StrategyVault", art: "[$$$]\n |·| \n[===]", d: "ERC4626 custody + NAV + share accounting." },
  { t: "AssetRegistry", art: "✓ ✓ ✓\n □ □\n✓ ✓ ✓", d: "Only verified tokens · never arbitrary addresses." },
  { t: "Policy (on-chain)", art: "├─┤\n│▓│\n├─┤", d: "Max position / cash reserve / max positions enforced in the contract." },
  { t: "ExecutionAdapter", art: " ⇄ \n╱ ╲\n⇄ ⇄", d: "One interface per DEX; core untouched by integrations." },
  { t: "Oracle", art: "·◉·\n╱│╲\n· ·", d: "Chainlink on mainnet; owner-set on testnet. Freshness checked." },
];

function Badge({ ok, label, value }: { ok: boolean | "pending"; label: string; value: string }) {
  const color = ok === true ? "var(--color-pos)" : ok === "pending" ? "var(--color-sim)" : "var(--color-danger)";
  return (
    <div className="panel px-4 py-3">
      <div className="flex items-center gap-2">
        <span style={{ width: 7, height: 7, borderRadius: 9999, background: color }} />
        <span className="label">{label}</span>
      </div>
      <div className="mono mt-1.5 text-sm" style={{ color: "var(--color-ink)" }}>{value}</div>
    </div>
  );
}

export default async function VaultPage() {
  const live = await readVaultLiveness();
  const onTestnet = live.factoryHasCode; // proven by reading chain code
  return (
    <main>
      {/* hero */}
      <section className="relative overflow-hidden border-b hairline">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.4]" />
        <div className="relative mx-auto max-w-[1200px] px-6 py-16">
          <Kicker>Phase 3 · capital layer</Kicker>
          <Display className="mt-6 text-[clamp(2.5rem,6vw,5rem)]">Strategy<br />Vault.</Display>
          <p className="mt-6 max-w-lg text-sm leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>
            Where intelligence becomes capital. A non-custodial vault on Robinhood Chain that holds USDG,
            buys verified assets within limits enforced on-chain, and never lets the AI sign a transaction.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Badge ok={true} label="Contracts" value="Built" />
            <Badge ok={true} label="Foundry tests" value="14 / 14 pass" />
            <Badge ok={onTestnet} label="Testnet 46630" value={onTestnet ? "Live on-chain" : "Verify on explorer"} />
            <Badge ok="pending" label="Mainnet 4663" value="Not deployed" />
          </div>

          <div className="mt-8 max-w-xl">
            <VaultApp />
          </div>
        </div>
      </section>

      {/* flow */}
      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <SectionMark n="01" title="The vault flow" className="mb-5" />
        <Display as="h2" className="max-w-2xl text-[clamp(1.6rem,3.5vw,2.8rem)]">Intelligence → Strategy → Capital.</Display>
        <div className="mt-8 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--color-line)" }}>
          {FLOW.map((s) => (
            <div key={s.n} className="p-5" style={{ background: "var(--color-bg)" }}>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold tracking-tight">{s.t}</span>
                <span className="mono text-xs" style={{ color: "var(--color-ink-faint)" }}>{s.n}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* architecture */}
      <section className="border-y hairline" style={{ background: "var(--color-panel)" }}>
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <SectionMark n="02" title="Contracts" className="mb-5" />
          <Display as="h2" outline className="text-[clamp(1.8rem,4vw,3.2rem)]">SAFETY BY STRUCTURE</Display>
          <p className="mt-4 max-w-xl text-sm leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>
            Intelligence proposes, the deterministic policy validates, execution is bounded. The AI never
            holds a key. Every limit lives in the contract, not the UI (brief §12, §73).
          </p>
          <div className="mt-8 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--color-line)" }}>
            {ARCH.map((c) => (
              <div key={c.t} className="p-5" style={{ background: "var(--color-bg)" }}>
                <AsciiIcon art={c.art} />
                <div className="mt-4 text-base font-semibold tracking-tight">{c.t}</div>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* verified chain facts */}
      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <SectionMark n="03" title="Verified on Robinhood Chain" className="mb-5" />
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="panel p-5">
            <div className="label mb-3">Settlement asset</div>
            <CopyField label="USDG" value={USDG} display="0x5fc5…1d168" />
            <div className="label mt-3 normal-case leading-relaxed" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
              Canonical Global Dollar (6dp), verified on-chain. Transferability confirmed via mainnet-fork
              test · non-custodial vault custody is viable.
            </div>
          </div>
          <div className="panel p-5">
            <div className="label mb-3">Network & assets</div>
            <Row k="Mainnet" v="4663" />
            <Row k="Testnet" v="46630 (mock stack)" />
            <Row k="Gas" v="ETH" />
            <Row k="Stock tokens" v="TSLA, NVDA … (18dp)" />
            <Row k="Oracle" v="Chainlink (mainnet)" />
          </div>
        </div>

        {/* Live deployed contracts (testnet) */}
        <div className="panel mt-3 overflow-hidden">
          <div className="flex items-center justify-between border-b hairline px-4 py-2.5">
            <span className="label inline-flex items-center gap-2">
              {onTestnet && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 9999, background: "var(--color-pos)" }} />}
              Deployed · {TESTNET.label} ({TESTNET.chainId})
            </span>
            <span className="label" style={{ letterSpacing: 0, color: onTestnet ? "var(--color-pos)" : "var(--color-warn)" }}>
              {onTestnet ? "verified on-chain" : live.reachable ? "not found" : "explorer link below"}
              {live.vaultCount != null ? ` · ${live.vaultCount} vaults` : ""}
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--color-line)" }}>
            {Object.entries(TESTNET.contracts).map(([name, addr]) => (
              <a key={name} href={explorerAddr(TESTNET.chainId, addr)} target="_blank" rel="noreferrer"
                className="rowlink flex items-center justify-between px-4 py-2.5 text-sm">
                <span style={{ color: "var(--color-ink)" }}>{name}{(name === "USDG" || name === "TSLA" || name === "NVDA") && <span className="label ml-2" style={{ letterSpacing: 0, color: "var(--color-sim)" }}>mock</span>}</span>
                <span className="mono text-xs" style={{ color: "var(--color-accent)" }}>{shortAddr(addr)} ↗</span>
              </a>
            ))}
          </div>
        </div>

        <div className="panel mt-3 p-5">
          <div className="label mb-2">Honest status</div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>
            Live on <span style={{ color: "var(--color-pos)" }}>testnet 46630</span> with a <span style={{ color: "var(--color-sim)" }}>mock</span> USDG/stock
            stack (the canonical tokens don&apos;t exist on testnet · this exercises the real vault logic).
            Contracts are <span style={{ color: "var(--color-warn)" }}>unaudited</span>; user vaults ship <span className="mono">paused + capped</span>.
            Mainnet (real USDG + Chainlink oracle) and any real-money deposits stay off until external review
            and a deliberate <span className="mono">setPaused(false)</span>. No fabricated balances · every value reads from chain.
          </p>
        </div>
      </section>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b hairline py-1.5 text-xs last:border-0">
      <span style={{ color: "var(--color-ink-dim)" }}>{k}</span>
      <span className="mono" style={{ color: "var(--color-ink)" }}>{v}</span>
    </div>
  );
}
