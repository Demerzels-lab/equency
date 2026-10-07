---
target: home (src/app/page.tsx)
total_score: 25
p0_count: 2
p1_count: 2
timestamp: 2026-10-07T09-18-19Z
slug: src-app-page-tsx
---
# EQUENCY critique — home + /explore
Method: dual-agent (A: design review · B: deterministic detector)

## Design Health (Nielsen 0–4)
| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of status | 3 | good (loaders/progress/badges); live "0" counts read as broken |
| 2 | Match real world | 2 | jargon CTAs ("Open the terminal"), abstract globe teaches nothing |
| 3 | User control | 3 | ⌘K / back / clear present |
| 4 | Consistency | 2 | 3 heading treatments; non-sequential 01/05; 2 card recipes |
| 5 | Error prevention | 3 | PAPER labels, honest states |
| 6 | Recognition | 3 | ⌘K, visible nav, explore filters |
| 7 | Flexibility | 3 | ⌘K, compare, watch |
| 8 | Aesthetic/minimalist | 1 | over-decorated; globe bleeds through all sections; ~10 motion systems |
| 9 | Error recovery | 3 | honest fallbacks / empty states |
| 10 | Help/docs | 2 | FAQ only; no onboarding/tooltips |
| Total | | 25/40 | Acceptable — usability OK; PREMIUM/brand-distinctiveness is the failure |

## Anti-patterns verdict
LLM: Reads AI-made — reaches for category reflexes (decorative "crypto globe" hero that does no work; JetBrains Mono as universal "technical" shorthand; uppercase eyebrow above every section; numbered 01/05 markers; "…in numbers" template; two identical glowing-card grids; ~10 scattered motion systems; default teal+indigo fintech accent). Over-engineered, not low-effort.
Detector: numbered-section-markers (vault, true), gradient-text (built CSS, investigate), em-dash-overuse + layout-transition(width) likely false positives.

## Priority issues
- [P0] Hero globe is a fixed full-viewport canvas → grid lines slice through Pillars/Numbers/LiveFeed cards. Reads as a z-index accident. Fix: constrain canvas to the hero only; solid bg below.
- [P0] Replace decorative globe with a FUNCTIONAL hero (RobinID lesson): a search field → type/pick a newly-public ticker → a mini Intelligence Core populates live inline. The hero should BE the product.
- [P1] Kill uniform mono + eyebrow + numbered-marker grammar. Reserve mono for tabular/code; .label+nav → sans; drop ≥3 of 6 section eyebrows; remove SectionMark (or make a real 01–05 sequence).
- [P1] Collapse ~10 motion systems to one orchestrated spine (the Intelligence→Strategy→Capital loop). Cut orb-glow spin, foreground SVG ring, and one of starfield/spotlight.
- [P2] Two near-identical card grids (Pillars + Numbers). Differentiate by job: Pillars → editorial 3-step loop diagram; Numbers → quiet single-line stat strip.
- [P3] Generic teal+indigo + arbitrary headline color split. Commit to teal; reserve indigo for the Capital/Vault layer only; single-color headline.

## Persona red flags
- Jordan (first-timer): spinning globe + jargon CTAs, no "try it"; bounce risk.
- Riley (stress-tester): big "0" stats look broken; grid lines through cards read unfinished.
- Casey (mobile): review flagged hero clip/overflow — likely a headless --window-size artifact (true 390 verified 0-overflow earlier); re-verify. ⌘K glyph shows mojibake in headless only.

## Strengths
- Intellectual honesty as design value (LIVE/SIMULATED, "nothing fabricated", real zeros).
- /explore is the real product and looks it (distributions + dense scannable table).
- Real SEC data wired into the chrome (hero nodes, live console).
