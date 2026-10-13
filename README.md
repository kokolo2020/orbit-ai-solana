# ORBIT AI — Solana Research Lab v1.0

A mobile-friendly, **paper-only** dashboard for researching recent Solana token profiles and manually simulating trades.

## Current features
- Fetch recent Solana token profiles and pair quotes via the public [DexScreener API](https://docs.dexscreener.com/api/reference).
- Screen pair liquidity with a **basic, incomplete** minimum-$10,000 heuristic.
- Simulate manual buys and full-position sells with *illustrative* 1% adverse slippage and 0.5% fees per side.
- Keep a browser-local portfolio starting at $10,000 USD, append-only-in-app event history, and JSON export.
- View indicative market marks for held tokens where quotes are available.
- Responsive phone/tablet/desktop interface.

## Explicitly not implemented
- No real trades, wallet, signing, or token custody.
- No always-on backend, persistent server ledger, or multi-device synchronization.
- No trained AI, probability engine, wallet funding graphs, or trader performance scoring.
- No complete on-chain token-launch feed, validated contract audits, or guaranteed API availability.
- No exchange-grade fill model; rates and prices are hypothetical, and holdings may become illiquid or unquotable.

## Deploy
This static site can be deployed from the repository on Netlify with build command blank and publish directory `.`. The included `netlify.toml` sets these values. Netlify automatically deploys connected GitHub changes once Git integration is configured.

Alternatively, run `python3 -m http.server 8080` from the repository directory and visit `http://localhost:8080`.

## Safety and data
The portfolio lives in the browser's localStorage under `orbit-ai-v1-local-portfolio`. Clearing browser data loses the records, so export your ledger if needed. Never store API secrets or private keys in browser-side code.

## Planned v2
Introduce server-side market ingestion, a normalized event database, historical forward-testing, portfolio reconciliation and a robust paper execution engine. Add holder-graph analysis and probability models only after validated data pipelines and realistic out-of-sample testing.

Not investment advice; new tokens are highly speculative.
