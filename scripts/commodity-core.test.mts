/**
 * pnpm test:commodity-core
 * PHASE 04 · Commodity Core tests. Unit tests for the math, then live checks against real
 * sources (Yahoo futures, Robinhood Chain, Ethereum). Nothing is mocked.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GOLD_TOKENS, RH_COMMODITY_TOKENS, buildCommodityCore, ethRpcFrom, fromUnits, premiumPct, quote, unitsPerShare } from "../src/lib/commodity-core/core.ts";

const RPC: string = process.env.RH_RPC_MAINNET || JSON.parse(readFileSync(resolve("deployments/robinhood-chain.verified.json"), "utf8")).chains.mainnet.rpcAlchemy;

test("premiumPct: token above / below / missing", () => {
  assert.equal(premiumPct(101, 100), 1.0000000000000009);
  assert.ok(Math.abs(premiumPct(99, 100)! + 1) < 1e-9);
  assert.equal(premiumPct(null, 100), null);
  assert.equal(premiumPct(100, 0), null);
});

test("unitsPerShare: ETF share → oz", () => {
  assert.equal(unitsPerShare(400, 4000), 0.1);
  assert.equal(unitsPerShare(null, 4000), null);
});

test("fromUnits: uint256 hex with decimals", () => {
  assert.equal(fromUnits("0x" + (BigInt(15) * 10n ** 17n).toString(16), 18), 1.5);
  assert.equal(fromUnits("0xf4240", 6), 1);
  assert.equal(fromUnits("0x", 18), null);
});

test("ethRpcFrom: reuses the Alchemy key, rejects others", () => {
  assert.equal(ethRpcFrom("https://robinhood-mainnet.g.alchemy.com/v2/abc_12"), "https://eth-mainnet.g.alchemy.com/v2/abc_12");
  assert.equal(ethRpcFrom("https://rpc.example.org"), null);
});

test("live · gold futures quote is a sane price", async () => {
  const q = await quote("GC=F");
  assert.ok(q, "no quote");
  assert.ok(q.price > 500 && q.price < 20_000, `GC=F ${q.price}`);
});

test("live · GLD token exists on Robinhood Chain", async () => {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getCode", params: [RH_COMMODITY_TOKENS.GOLD.token, "latest"] }) });
  const code = ((await r.json()) as { result: string }).result;
  assert.ok(code.length > 2, "no contract code");
});

test("live · Gold Core: both sides read, PAXG tracks spot", { timeout: 120_000 }, async () => {
  const c = await buildCommodityCore(RPC, "GOLD");
  assert.ok(c.underlying.price, "spot missing");
  assert.ok(c.etf.onchain.supply != null && c.etf.onchain.supply > 0, "GLD onchain supply");
  assert.equal(c.backed.length, GOLD_TOKENS.length);
  const paxg = c.backed.find((b) => b.symbol === "PAXG")!;
  assert.ok(paxg.supply != null && paxg.supply > 1000, "PAXG supply");
  assert.ok(paxg.premiumPct != null && Math.abs(paxg.premiumPct) < 5, `PAXG spread ${paxg.premiumPct}%`);
  assert.ok(c.observations.length >= 4);
});
