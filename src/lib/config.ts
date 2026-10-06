// Server-only configuration. Never import this into a client component · these
// values (keys) must never reach the browser bundle (brief §11, §73).
import "server-only";

export const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT || "EQUENCY research admin@ailesh.plus";

export const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Robinhood testnet RPC for reading live vault state (public endpoint by default; set
// RH_RPC_TESTNET to an Alchemy URL for reliability).
export const RH_RPC_TESTNET =
  process.env.RH_RPC_TESTNET || "https://rpc.testnet.chain.robinhood.com/rpc";
// Use the rolling "flash-latest" alias by default · pinning an exact version breaks
// when Google deprecates it for new users (e.g. gemini-2.5-flash → 404).
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

export const has = {
  finnhub: () => FINNHUB_API_KEY.length > 0,
  gemini: () => GEMINI_API_KEY.length > 0,
};
