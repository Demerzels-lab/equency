# EQUENCY Strategy — Master Development Brief

## Product
**EQUENCY**  
Full name: **EQUENCY Strategy**  
Network: **Robinhood Chain**  
Positioning: **Intelligence for the newly public.**

> **Every newly public company gets an Intelligence Core.**

---

# 1. Project Overview

EQUENCY adalah platform intelligence + investment strategy untuk perusahaan yang baru saja menjadi public company, terutama perusahaan US yang baru IPO.

Saat sebuah perusahaan baru IPO, EQUENCY membuat **Intelligence Core** yang terus memantau dan meneliti:

- SEC filings
- earnings
- financial data
- price
- volume
- options
- institutional ownership / available institutional data
- news
- X
- corporate events
- analyst data
- official company website
- market activity

Intelligence tersebut menjadi living profile perusahaan dan kemudian digunakan oleh **Strategy Engine** untuk menghasilkan rekomendasi berdasarkan strategy pilihan user.

User tetap memegang kendali:

**INTELLIGENCE → STRATEGY → USER → CAPITAL**

---

# 2. 10-Second Rule

Dalam 10 detik pertama user harus langsung mengerti:

### What is EQUENCY?
**EQUENCY gives newly public companies an Intelligence Core.**

### What can I see?
- perusahaan yang baru IPO
- days public
- intelligence score
- thesis
- perubahan terbaru
- live research
- strategy opportunities

### What can I do?
Pilih strategy → lihat rekomendasi → review evidence → atur allocation → approve → gunakan Strategy Vault.

---

# 3. Branding

EQUENCY harus terasa seperti **financial intelligence infrastructure**, bukan generic AI stock screener.

Gunakan istilah:

- Intelligence Core
- Company Intelligence
- Continuous Intelligence
- Intelligence Profile
- Research Cycle
- Living Thesis
- Strategy Engine
- Strategy Vault

Hindari istilah gimmicky seperti Stock Brain, Stock Soul, AI Stock Buddy, Magic AI.

Tone: **technical, institutional, minimal, sophisticated.**

---

# 4. Newly Public Universe

## Primary
Fokus utama:
- NASDAQ
- NYSE
- relevant US exchanges

## Secondary
China / Greater China sebagai future expansion, bukan fokus MVP.

## Age Buckets
- **NEW:** 0–7 days
- **RECENT:** 8–30 days
- **EARLY PUBLIC:** 31–90 days
- **EMERGING:** 91–180 days

Fokus intelligence paling kuat: **0–90 days**.

---

# 5. IPO Ingestion

Gunakan kombinasi:

**SEC + commercial market-data provider**

Jangan bergantung pada satu provider.

### Candidate providers

**Financial Modeling Prep**
- IPO Calendar
- IPO disclosure
- filing date
- CIK
- form
- SEC URL

**Finnhub**
- IPO Calendar
- company profile
- ticker
- exchange
- IPO date
- market cap
- company website
- market/news

**Polygon / Massive**
- US equities
- market data
- company financials
- corporate actions

Buat abstraction:

```text
DataProviderAdapter
```

agar provider dapat diganti tanpa mengubah application.

---

# 6. Data Architecture

```text
Company
├── identity
│   ├── name
│   ├── ticker
│   ├── exchange
│   ├── cik
│   ├── isin
│   ├── country
│   └── officialWebsite
│
├── ipo
│   ├── ipoDate
│   ├── daysPublic
│   ├── ipoPrice
│   ├── sharesOffered
│   └── offeringSize
│
├── market
│   ├── price
│   ├── marketCap
│   ├── volume
│   ├── volatility
│   └── liquidity
│
├── fundamentals
│   ├── revenue
│   ├── revenueGrowth
│   ├── grossMargin
│   ├── operatingIncome
│   ├── netIncome
│   ├── cash
│   ├── debt
│   └── cashFlow
│
├── ownership
│   ├── institutionalOwnership
│   ├── insiderOwnership
│   └── ownershipChanges
│
├── options
│   ├── volume
│   ├── openInterest
│   ├── impliedVolatility
│   └── unusualActivity
│
├── information
│   ├── news
│   ├── x
│   ├── analystData
│   └── officialWebsite
│
└── intelligence
    ├── score
    ├── thesis
    ├── confidence
    ├── risks
    ├── catalysts
    └── evidence
```

---

# 7. Data Provider Suggestions

Provider bersifat **saran**, bukan mandatory.

Developer memilih berdasarkan price, coverage, latency, reliability, limits, licensing, dan required features.

## Market Data
Candidates:
- Polygon / Massive
- Alpaca
- Finnhub

Alpaca dapat dievaluasi untuk real-time/historical equities dan options.

Polygon / Massive dapat dievaluasi untuk market-data infrastructure yang lebih luas.

## SEC
Gunakan official SEC EDGAR APIs jika memungkinkan:
- submissions
- filing history
- XBRL facts
- company facts
- 10-K
- 10-Q
- 8-K
- ownership filings

Respect SEC fair-access requirements dan rate limits.

## News
Candidates:
- Finnhub
- Polygon / Massive
- Financial Modeling Prep

Normalize:
```text
headline
source
publishedAt
url
ticker
company
sentiment
topic
importance
```

## X
Candidates:
- official X API
- licensed data provider
- compliant third-party provider

Jangan bergantung pada unofficial scraping.

## Options
Metrics:
- call volume
- put volume
- call/put ratio
- open interest
- IV
- IV change
- volume/OI
- unusual activity
- expiration distribution
- strike distribution

Candidates:
- Alpaca
- Polygon / Massive
- other institutional market-data providers

## Institutional Data
Bedakan:
- **VERIFIED:** SEC 13F, 13D, 13G, insider filings, ownership disclosures
- **DERIVED:** computed from available data
- **PROXY:** signals that may correlate with institutional activity

Jangan menyebut proprietary institutional order flow tanpa data yang benar-benar mendukungnya.

---

# 8. Official Company Website Monitoring

Setiap company yang punya official website memiliki:

## COMPANY WEB RESEARCH

Browser bersifat **VIEW ONLY**.

Boleh:
- membuka public pages
- membaca public information
- capture DOM/text
- screenshots
- menemukan relevant pages
- menyimpan source URLs

Tidak boleh:
- submit form
- login private account
- mengubah data
- membeli sesuatu
- berinteraksi dengan company systems
- impersonate user

Candidate:
- Playwright
- Browserbase
- managed browser infrastructure

---

# 9. Intelligence Core

Setiap newly public company mendapatkan:

```text
ACME

INTELLIGENCE CORE
● ACTIVE

6 DAYS PUBLIC

Score
91

Thesis
STRENGTHENING

Risk
MEDIUM
```

Core memiliki:

- Identity
- Context
- Market State
- Fundamental State
- Information State
- Risk State
- Thesis
- Confidence

---

# 10. Agent Loop

```text
OBSERVE
   ↓
RESEARCH
   ↓
CROSS-CHECK
   ↓
THINK
   ↓
UPDATE
   ↓
EXPLAIN
   ↓
MONITOR
   ↺
```

Triggers:
- new SEC filing
- earnings
- major price move
- volume spike
- options activity spike
- ownership filing
- analyst revision
- major news
- company announcement
- relevant X post
- official website change

---

# 11. AI Reasoning Layer

AI harus diabstraksikan di belakang backend EQUENCY.

Frontend tidak boleh mengekspos:
- model vendor
- provider API key
- raw model configuration
- internal prompt
- provider-specific naming

Internal abstraction:

```text
EQUENCY Reasoning Engine
        ↓
Reasoning Model
        ↓
Structured Output
```

Digunakan untuk:
- company analysis
- research synthesis
- thesis
- risk analysis
- catalyst detection
- strategy evaluation
- stock ranking
- recommendation explanation
- research planning
- evidence comparison
- memory
- strategy reasoning

Model dipilih berdasarkan long-context reasoning, financial document analysis, tool use, structured outputs, multi-step research, dan instruction following.

---

# 12. AI Safety Architecture

AI tidak boleh langsung mengontrol money.

```text
AI
 ↓
INTENT
 ↓
DETERMINISTIC POLICY ENGINE
 ↓
USER APPROVAL / STRATEGY RULES
 ↓
EXECUTION ENGINE
 ↓
SMART CONTRACT
 ↓
ROBINHOOD CHAIN
```

Never:

```text
AI
 ↓
PRIVATE KEY
 ↓
TRANSACTION
```

---

# 13. Memory

Persistent memory:
- previous thesis
- reasoning
- catalysts
- risks
- recommendations
- evidence
- company events
- thesis changes
- strategy outcomes

Simpan **why the thesis changed**, bukan hanya thesis terbaru.

---

# 14. Thinking / Research Console

Company page harus memperlihatkan research activity secara nyata.

Structured labels:

```text
OBSERVATION
INTERPRETATION
RESEARCH
DOUBT
DECISION
RESULT
```

Contoh:

```text
09:42 OBSERVATION
Volume increased 184% vs 20-day baseline.

09:43 RESEARCH
Checking whether the move corresponds with a catalyst.

09:44 RESEARCH
Opened latest 8-K.

09:45 INTERPRETATION
Move appears correlated with newly disclosed guidance.

09:46 DECISION
Growth thesis remains intact.
Short-term volatility risk increased.
```

**Jangan expose hidden chain-of-thought.** Tampilkan concise reasoning summaries, tool actions, evidence, dan conclusions.

---

# 15. Company Detail Page

Halaman ini harus terasa seperti **living intelligence terminal**, bukan stock screener.

## Header

```text
ACME
NASDAQ: ACME

6 DAYS PUBLIC

$42.18
+7.42%

Market Cap
$2.4B

Volume
1.8M

IPO
Sep 29, 2026
```

## Price Chart

Ranges:
- 1D
- 5D
- 1M
- 3M
- 6M
- Since IPO

Display:
- OHLC
- volume
- VWAP jika tersedia
- earnings markers
- SEC events
- catalyst markers

Default: **SINCE IPO**

---

# 16. Main Company Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ COMPANY HEADER + PRICE                                      │
├────────────────┬──────────────────────────┬─────────────────┤
│ INTELLIGENCE   │ RESEARCH ENVIRONMENT     │ LIVE MARKET     │
│ CORE           │                          │                 │
│                │ Official Website         │ Price           │
│ Status         │ SEC                      │ Volume          │
│ Score          │ Earnings                 │ Options         │
│ Thesis         │ News                     │ Ownership       │
│ Risk           │ X                        │ Liquidity       │
│ Thinking       │ Filings                  │ Event Radar     │
│ Decisions      │                          │                 │
│ Memory         │                          │                 │
├────────────────┴──────────────────────────┴─────────────────┤
│ INTELLIGENCE THESIS                                         │
├─────────────────────────────────────────────────────────────┤
│ EVIDENCE / TIMELINE / EVENTS / HISTORY                      │
└─────────────────────────────────────────────────────────────┘
```

---

# 17. Intelligence Column

Display:
- Core status
- Intelligence Score
- score breakdown
- live thinking
- decisions
- memory

Example:

```text
91 / 100

Fundamentals     94
Momentum         89
Institutional    86
Options          81
Narrative        92
Risk             72
```

Each score opens supporting evidence.

---

# 18. Research Environment

Center panel:

```text
RESEARCHING

Official Company Website
```

Browser preview:

```text
┌───────────────────────────────┐
│ company.com                   │
├───────────────────────────────┤
│       PUBLIC WEBSITE          │
│       VIEW ONLY               │
└───────────────────────────────┘
```

Show:
- sources
- pages analyzed
- session duration
- replay
- source links

Tabs:
```text
OFFICIAL
SEC
EARNINGS
NEWS
X
OPTIONS
MARKET
OWNERSHIP
```

---

# 19. Live Market Column

Display:
- price
- volume
- market cap
- options
- ownership
- liquidity
- event radar

Example:

```text
OPTIONS
Volume 24.8K
Open Interest 91.4K
IV 63%
```

Only show metrics with verified coverage.

---

# 20. Event Radar

```text
EVENT RADAR

● 2m
SEC filing detected

● 8m
Volume +142%

● 17m
Options activity increased

● 42m
New company announcement

● 2h
Institutional ownership update
```

Every event clickable.

---

# 21. Intelligence Thesis

```text
INTELLIGENCE THESIS

STRENGTHENING

WHY
+ Revenue acceleration
+ Positive guidance
+ Institutional ownership increase
+ Strong post-IPO structure

RISKS
- Elevated valuation
- High volatility
- Limited public-market history

CONFIDENCE
82%
```

---

# 22. Thesis History

```text
Oct 05
Strengthening

Oct 03
Neutral

Oct 01
Cautious

Sep 29
Initial thesis
```

Clicking history shows:
- what changed
- evidence
- previous thesis
- new thesis
- reason

---

# 23. Company Mission

Example:

```text
MISSION

Understand the company's
first 90 days as a public company.

Priority
1. Fundamental stability
2. Market discovery
3. Institutional positioning
4. Catalyst detection
5. Risk identification
```

Mission evolves with company age.

---

# 24. Age-Based Intelligence

## 0–7 days
Focus:
- IPO pricing
- opening price behavior
- liquidity
- volatility
- market discovery
- initial filings
- company communication

## 8–30 days
Focus:
- price discovery
- institutional participation
- news
- analyst activity
- post-IPO narrative
- liquidity normalization

## 31–90 days
Focus:
- earnings
- financial updates
- ownership changes
- sustained market behavior
- strategy fit

## 91–180 days
Focus:
- public-company track record
- earnings history
- institutional changes
- longer-term thesis

---

# 25. Home Page

Hero:

# EQUENCY
### Intelligence for the newly public.

Subtext:

> Every newly public company gets an Intelligence Core that continuously researches its market, business and signals.

Immediately show:

```text
NEWLY PUBLIC

TODAY
2

THIS WEEK
4

30 DAYS
13

90 DAYS
47
```

Sections:
- Just Public
- Recently Public
- Intelligence Active
- Emerging Opportunities

---

# 26. Strategy Engine

Navigation:

```text
INTELLIGENCE
STRATEGIES
VAULT
```

MVP strategies:

## GROWTH
Focus:
- revenue growth
- earnings acceleration
- guidance
- business momentum
- institutional ownership
- fundamentals

## MOMENTUM
Focus:
- price momentum
- volume
- options
- catalysts
- volatility
- liquidity

## DEFENSIVE
Focus:
- balance sheet
- cash
- debt
- volatility
- institutional stability
- business quality

---

# 27. Strategy Detail

Example:

```text
GROWTH

Risk
MEDIUM / HIGH

Holding Period
3–12 months

Max Positions
5

Max Position
30%

Cash Reserve
20%

Rebalance
Weekly
```

Recommendations:

```text
#1 ACME
Score 91

#2 COMPANY B
Score 87

#3 COMPANY C
Score 84
```

---

# 28. Recommendation Detail

Every recommendation must show:

- Why selected
- Evidence
- Risks
- Strategy fit
- Suggested allocation
- Confidence
- Last update

Example:

```text
ACME

Strategy Fit
94%

Suggested Allocation
30%

WHY
+ Strong revenue acceleration
+ Positive guidance
+ Institutional accumulation

RISKS
- Elevated valuation
- High volatility

CONFIDENCE
87%
```

---

# 29. User Customization

User dapat mengatur:
- maximum position
- maximum number of positions
- cash reserve
- risk tolerance
- holding period
- rebalance frequency
- allowed companies
- excluded companies

Guiding principle:

**User chooses the strategy and controls the constraints.**

---

# 30. Strategy Vault

Vault adalah capital layer.

User harus connect wallet sebelum real-capital interaction.

Initial:

```text
STRATEGY VAULT

Connect Wallet
```

After connection:

```text
Wallet
0x1234...ABCD

Available
10,000 USDG

Vault Balance
0

[ CREATE POSITION ]
```

---

# 31. Robinhood Chain Asset Experience

EQUENCY harus terasa native ke Robinhood Chain.

Target:

### Stable asset
**USDG**

### Native gas
**ETH**

### Stock exposure
Robinhood Chain Stock Tokens jika tersedia/eligible.

Gunakan:

```text
StockTokenRegistry
```

Fields:
- ticker
- tokenAddress
- underlying
- decimals
- oracle
- tradingCapabilities
- availability

Jangan hard-code token availability.

---

# 32. Wallet

Support EVM wallets:
- MetaMask
- Rabby
- Coinbase Wallet
- WalletConnect-compatible wallets
- other compatible wallets

Robinhood Chain:

```text
Chain ID
4663

Native Gas
ETH
```

RPC candidates:
- Alchemy
- Chainstack
- QuickNode
- Blockdaemon
- dRPC
- Validation Cloud
- GlobalStake

Use dedicated production RPC infrastructure.

---

# 33. Vault Creation Flow

```text
Connect Wallet
      ↓
Choose Strategy
      ↓
Review Recommendations
      ↓
Select Companies
      ↓
Adjust Allocation
      ↓
Review Risk
      ↓
Approve
      ↓
Deposit
```

Before approval:

```text
YOUR STRATEGY

Growth

Positions
4

Capital
$10,000

Cash
20%

Highest allocation
30%

Risk
Medium / High

[ APPROVE STRATEGY ]
```

---

# 34. Control Modes

## GUIDED — Default

AI:
- researches
- ranks
- recommends
- suggests allocation

User:
- reviews
- modifies
- approves

## ASSISTED

AI researches/ranks/recommends. User executes.

## AUTONOMOUS

AI may allocate/rebalance only within user-defined constraints.

Example:

```text
MAX POSITION
30%

MAX STOCKS
5

CASH RESERVE
20%

REBALANCE
WEEKLY
```

AI tidak boleh mengubah constraints.

---

# 35. Vault Architecture

```text
USER
 ↓
VAULT
 ↓
STRATEGY CONFIG
 ↓
STRATEGY ENGINE
 ↓
EQUENCY INTELLIGENCE
 ↓
ALLOCATION DECISION
 ↓
POLICY ENGINE
 ↓
EXECUTION
 ↓
ROBINHOOD CHAIN
```

Real-capital flow:

```text
AI
 ↓
Structured Intent
 ↓
Policy Validation
 ↓
User Approval / Automation Rule
 ↓
Transaction Builder
 ↓
Wallet Signature / Authorized Executor
 ↓
Smart Contract
 ↓
Settlement
 ↓
Ledger
```

---

# 36. Portfolio

```text
YOUR VAULT

Growth Strategy

NAV
$10,482

P&L
+$482
+4.82%

Cash
20%

Positions
4
```

Track:
- positions
- allocations
- NAV
- P&L
- cash

---

# 37. Performance

Show:
- NAV
- P&L
- daily P&L
- weekly P&L
- since inception
- max drawdown
- volatility
- allocation history
- rebalance history

Clearly separate:

**BACKTESTED / PAPER / LIVE**

Never present backtest as live performance.

---

# 38. Strategy History

Record:

```text
Oct 05
Added ACME
+20%

Oct 04
Reduced Company B
-10%

Oct 02
Moved 5% to cash

Sep 30
Strategy initialized
```

Event detail:
- reason
- intelligence state
- strategy rules
- user approval
- transaction
- execution result

---

# 39. Recommendation → Vault

Every recommendation:

```text
[ ADD TO VAULT ]

[ WATCH ]
```

If wallet not connected:

```text
Connect wallet to create a vault position.
```

---

# 40. Robinhood Chain Stock Token Integration

If eligible:

```text
ONCHAIN EXPOSURE

ACME Token
Available

Network
Robinhood Chain

Token
0x...

Price
$42.18

Oracle
Chainlink

[ ADD TO VAULT ]
```

If unavailable:

```text
INTELLIGENCE AVAILABLE

ONCHAIN EXPOSURE
Not currently available
```

Never simulate execution.

---

# 41. Zupiter-Inspired UX Principles

Ambil prinsip UX, bukan branding:

- clear wallet state
- clear asset state
- clear transaction preview
- clear fees
- clear network
- clear route
- transparent execution
- minimal clutter
- strong hierarchy

---

# 42. AGENCY-Inspired Experience Principles

Company page harus terasa sebagai **living intelligence system**:

- active intelligence
- live research
- visible decisions
- browser research
- source evidence
- mission
- thesis
- memory
- event radar
- history
- outcomes

Jangan copy branding, asset, atau text.

---

# 43. Research Replay

Simpan:

```text
Research Session #1294

Duration
04:21

Sources
12

Pages
7

Actions
18
```

Replay:

```text
09:41
Opened company website

09:42
Opened investor relations

09:43
Opened SEC filing

09:44
Compared earnings

09:45
Updated thesis
```

Replay view-only.

---

# 44. Visual Direction

Gabungkan:

**Financial terminal precision + agentic intelligence + Robinhood Chain-native Web3 UX**

Hindari:
- excessive gradients
- cartoon AI
- robot faces
- generic futuristic AI imagery
- meme aesthetics
- excessive glassmorphism
- excessive rounded cards

Preferred:
- clean grid
- sharp typography
- restrained motion
- data density
- monochrome base
- subtle accent
- strong hierarchy
- precise micro-interactions

---

# 45. Responsive Design

Desktop adalah primary.

Desktop memakai three-column intelligence layout.

Mobile:

```text
Header
↓
Price Chart
↓
Intelligence
↓
Thesis
↓
Research
↓
Market
↓
Evidence
```

Jangan sekadar mengecilkan desktop.

---

# 46. Robinhood Chain Identity

Tampilkan secara subtle:

```text
NETWORK
ROBINHOOD CHAIN

CHAIN
4663

GAS
ETH
```

Vault assets:

```text
USDG
ETH
Stock Tokens
```

Positioning:

> **Built on Robinhood Chain**

Jangan menyiratkan EQUENCY adalah produk resmi Robinhood tanpa partnership/authorization.

---

# 47. Onchain Data

RPC candidates:
- Alchemy
- Chainstack
- QuickNode
- Blockdaemon
- dRPC
- Validation Cloud
- GlobalStake

Indexer candidates:
- Alchemy Data APIs
- custom event indexer
- third-party indexer

Index:
- vault deposits
- withdrawals
- strategy events
- stock-token balances
- swaps
- execution
- P&L snapshots

---

# 48. Smart Contracts

Suggested:

```text
EQUENCYVaultFactory
EQUENCYStrategyVault
EQUENCYPolicyRegistry
EQUENCYAssetRegistry
EQUENCYExecutionRouter
EQUENCYPerformanceLedger
```

Architecture:

```text
VaultFactory
   ↓
StrategyVault
   ↓
Policy
   ↓
ExecutionRouter
   ↓
Verified Asset
```

Strategy configuration harus dipisahkan dari execution logic.

---

# 49. Asset Registry

AI tidak boleh memilih arbitrary token address.

Registry:

```text
asset
symbol
tokenAddress
chainId
assetType
verified
oracle
decimals
enabled
```

---

# 50. Transaction Safety

Check:
- chain ID
- token address
- balance
- allowance
- slippage
- strategy limits
- user limits
- asset verification
- oracle freshness
- execution deadline

Reject:
- stale oracle
- unsupported asset
- unknown contract

---

# 51. Oracle

Untuk supported Robinhood Stock Tokens, gunakan verified onchain pricing mechanism yang sesuai.

Jika Stock Token menyediakan Chainlink price feed, dapat digunakan sebagai execution/reference oracle sesuai integrasi resmi.

Fallback market data boleh digunakan untuk UI/research, tetapi jangan dijadikan execution source tanpa validasi yang sesuai.

---

# 52. Performance Accounting

Track:

```text
deposits
withdrawals
asset purchases
asset sales
fees
gas
NAV
PnL
realizedPnL
unrealizedPnL
```

Jangan menghitung performance hanya dari wallet balance.

---

# 53. Watchlist

User dapat mengikuti company tanpa deposit.

```text
WATCHLIST

ACME
91
Strengthening

COMPANY B
87
Neutral

COMPANY C
82
Weakening
```

---

# 54. Notifications

Potential:
- new IPO detected
- Intelligence Core initialized
- thesis changed
- major SEC filing
- major price move
- strategy recommendation changed
- vault rebalance proposed
- vault action requires approval
- risk threshold crossed

---

# 55. User Approval

Guided mode:

```text
EQUENCY RECOMMENDS

Rebalance Growth Vault

ACME
20% → 30%

Company B
25% → 20%

Reason
New earnings data changed
strategy ranking.

[ REVIEW ]
```

Actions:
- Approve
- Reject
- Edit

---

# 56. Activity Log

```text
EQUENCY ACTIVITY

12:42
ACME Core updated thesis

12:38
New SEC filing detected

12:30
Growth strategy re-ranked

12:20
Vault rebalance proposed

12:17
User approved allocation
```

---

# 57. Admin / Backend Monitoring

Build internal dashboard for:
- data provider health
- API errors
- stale data
- agent jobs
- research jobs
- browser sessions
- model calls
- token usage
- strategy jobs
- vault transactions
- failed transactions
- oracle status
- RPC health

Statuses:

```text
ACTIVE
DEGRADED
OFFLINE
```

Never silently display stale data as live.

---

# 58. Data Freshness

Every datum must have timestamp.

Market:

```text
PRICE
$42.18
Updated 2s ago
```

Filing:

```text
INSTITUTIONAL OWNERSHIP
38.2%
Source filed 3 days ago
```

Distinguish market timestamp from source filing timestamp.

---

# 59. Agent Job System

```text
SEC_EVENT
   ↓
Company Agent Wake
   ↓
Research
   ↓
Cross-check
   ↓
Thesis Update
   ↓
Strategy Re-evaluation
```

Triggers:

```text
PRICE_MOVE
VOLUME_SPIKE
OPTIONS_SPIKE
NEWS_EVENT
X_EVENT
EARNINGS_EVENT
OWNERSHIP_EVENT
SCHEDULED_RESEARCH
```

---

# 60. Agent Cost Control

Jangan terus-menerus melakukan expensive reasoning.

Gunakan deterministic detection terlebih dahulu.

Reasoning model hanya dipanggil ketika:
- meaningful event
- scheduled research
- thesis reevaluation
- user deep research
- significant strategy ranking change

---

# 61. Structured Model Output

Example:

```json
{
  "company": "ACME",
  "thesis": "strengthening",
  "confidence": 0.87,
  "score": 91,
  "keyDrivers": [],
  "risks": [],
  "catalysts": [],
  "evidence": [],
  "recommendedAction": "watch",
  "strategyFit": {
    "growth": 0.94,
    "momentum": 0.81,
    "defensive": 0.55
  }
}
```

Free-form model output tidak boleh langsung mengontrol UI state atau transactions.

---

# 62. Evidence-First AI

Every recommendation:

```text
CLAIM
↓
EVIDENCE
↓
SOURCE
↓
TIMESTAMP
↓
CONFIDENCE
```

Example:

```text
Claim:
Revenue growth accelerated.

Evidence:
Latest 10-Q.

Source:
SEC filing.

Filed:
Oct 02, 2026.

Confidence:
High.
```

Weak evidence:

```text
Confidence:
Low

Reason:
Only one secondary source available.
```

---

# 63. Source Reliability

### Tier 1
Official:
- SEC
- company filings
- company IR
- exchange
- official company announcement

### Tier 2
Professional market-data providers:
- Polygon
- Alpaca
- Finnhub
- FMP

### Tier 3
Public discussion:
- reputable news
- X
- secondary research

AI harus memberi weight sesuai source tier.

---

# 64. UI Source Indicators

Example:

```text
SOURCE
SEC

VERIFIED
●

UPDATED
2m ago
```

Or:

```text
SOURCE
X

UNVERIFIED CLAIM
●

Cross-check recommended
```

---

# 65. Search / Discovery

Search:
- company
- ticker
- newly public

Filters:
- days public
- exchange
- sector
- market cap
- strategy
- risk
- intelligence score
- thesis

---

# 66. Main Product Loop

```text
DISCOVER
↓
UNDERSTAND
↓
RESEARCH
↓
CHOOSE STRATEGY
↓
REVIEW
↓
ALLOCATE
↓
APPROVE
↓
VAULT
↓
MONITOR
↓
REBALANCE
```

---

# 67. Phase 1 — Newly Public Intelligence

Required:
- US IPO detection
- 30/90/180-day universe
- company profiles
- days-public calculation
- SEC
- market data
- news
- X
- options
- ownership
- official website
- Intelligence Core
- intelligence score
- thesis
- risks
- catalysts
- evidence
- research activity
- browser view
- source links
- price chart
- thesis history
- event radar
- watchlist

---

# 68. Phase 2 — Strategy Engine

Required:
- Growth
- Momentum
- Defensive
- strategy configuration
- stock ranking
- strategy fit
- recommendations
- suggested allocations
- user customization
- evidence
- confidence
- recommendation history

---

# 69. Phase 3 — Strategy Vault

Required:
- connect wallet
- Robinhood Chain
- USDG support where verified/available
- ETH gas
- Stock Token registry
- vault creation
- deposits
- withdrawals
- portfolio
- NAV
- P&L
- allocations
- strategy constraints
- approval system
- transaction history
- execution
- performance history

---

# 70. Phase 4 — Automation

Architecture must support:

### Assisted
User executes.

### Guided
User approves.

### Autonomous
Rules execute automatically.

**Guided is default.**

---

# 71. Phase 5 — Advanced Intelligence

Architecture for:
- persistent memory
- thesis evolution
- historical evidence
- research replay
- strategy learning
- outcome analysis
- agent performance
- strategy performance
- event-driven research

---

# 72. Future Extension

Architecture should support:
- additional strategies
- China market
- global IPOs
- strategy marketplace
- user-created strategies
- strategy leaderboard
- more asset types
- additional tokenized equities
- automated portfolio management

Jangan clutter MVP UI dengan future functionality.

---

# 73. Security Principles

### Never trust AI
AI adalah untrusted decision software.

### Never trust frontend
Limits divalidasi backend/onchain.

### Never trust arbitrary token addresses
Gunakan verified asset registry.

### Never trust stale prices
Check oracle freshness.

### Never expose private keys
Execution isolated.

### Never allow arbitrary contract calls
Use whitelisted routes.

### Never allow model-defined recipients
No AI-generated arbitrary fund transfers.

---

# 74. Smart Contract Security

Before mainnet:
- unit tests
- integration tests
- invariant tests
- fuzzing
- static analysis
- fork tests
- testnet deployment
- external audit jika real capital deployed

Vault contracts should consider:
- emergency pause
- asset allowlist
- strategy limits
- withdrawal safeguards
- upgrade controls
- multisig/timelock where appropriate

---

# 75. UX Trust

Always answer:

```text
WHAT DATA?
WHERE FROM?
WHEN UPDATED?
WHY THIS RECOMMENDATION?
WHAT WILL HAPPEN?
HOW MUCH?
WHAT ARE THE RISKS?
```

before capital deployment.

---

# 76. Final Product Identity

**EQUENCY is not a stock screener.**

It is not simply an AI analyst.

It is not simply a vault.

It is a system that creates a **living Intelligence Core around newly public companies**, continuously researches their public-market lifecycle, converts that intelligence into strategy-specific recommendations, and gives users a controlled path from:

**company discovery → intelligence → strategy → decision → capital → performance → new intelligence.**

The experience should make the user feel that the **new public market is alive, observable, and continuously being understood by EQUENCY.**

---

# 77. Final Tagline

**EQUENCY**

### Intelligence for the newly public.

**Every newly public company gets an Intelligence Core.**

**Research the new public market. Build a strategy. Put capital behind it.**

**Intelligence → Strategy → Capital**

---

# 78. Developer One-Liner

> Build EQUENCY as a Robinhood Chain-native intelligence and strategy platform where every newly public company receives a continuously operating Intelligence Core that researches its business and market, produces evidence-backed strategy recommendations, and connects those recommendations to user-controlled Strategy Vaults for onchain capital deployment.

---

# 79. Implementation Priority

```text
1. Data ingestion
↓
2. Company universe
↓
3. Intelligence Core
↓
4. Research engine
↓
5. Company detail UI
↓
6. Strategy engine
↓
7. Strategy recommendation UI
↓
8. Wallet + Robinhood Chain
↓
9. Vault contracts
↓
10. Execution
↓
11. P&L / accounting
↓
12. Automation modes
↓
13. Monitoring + admin
```

**Do not build the Vault first.**

The **Intelligence Core is the identity of EQUENCY**.

The Vault is where intelligence eventually becomes capital.

---

# 80. Recommended Reference Sources

These are suggestions, not mandatory vendors.

## Robinhood Chain
- https://docs.robinhood.com/chain/
- https://docs.robinhood.com/chain/connecting/
- https://docs.robinhood.com/chain/stock-tokens/
- https://docs.robinhood.com/chain/building-with-stock-tokens/

## SEC
- https://www.sec.gov/search-filings/edgar-application-programming-interfaces

## IPO Calendar
- https://site.financialmodelingprep.com/developer/docs/stable/ipos-calendar
- https://api.finnhub.io/docs/api/ipo-calendar

## Market Data
- https://docs.alpaca.markets/
- https://polygon.io/docs/

## Browser Research
- https://playwright.dev/

## Product References
- https://www.agencypad.fun/
- https://www.agencypad.fun/docs/minds
- https://www.agencypad.fun/how
- https://zupiter.tech/
- https://zupiter.tech/app

---

# 81. Final Product Loop

```text
NEW COMPANY GOES PUBLIC
          ↓
EQUENCY DETECTS IT
          ↓
INTELLIGENCE CORE CREATED
          ↓
CORE RESEARCHES COMPANY
          ↓
SEC + MARKET + OPTIONS + NEWS + X
          ↓
OFFICIAL WEBSITE RESEARCH
          ↓
EVIDENCE IS CROSS-CHECKED
          ↓
THESIS IS CREATED
          ↓
THESIS CONTINUOUSLY UPDATES
          ↓
STRATEGY ENGINE EVALUATES COMPANY
          ↓
USER CHOOSES STRATEGY
          ↓
EQUENCY RECOMMENDS STOCKS
          ↓
USER REVIEWS + ADJUSTS
          ↓
USER CONNECTS WALLET
          ↓
STRATEGY VAULT
          ↓
USDG / ETH / SUPPORTED STOCK TOKENS
          ↓
USER APPROVES
          ↓
ROBINHOOD CHAIN EXECUTION
          ↓
PORTFOLIO PERFORMANCE
          ↓
NEW MARKET DATA
          ↓
INTELLIGENCE CORE UPDATES AGAIN
          ↺
```

# EQUENCY

**Intelligence for the newly public.**
