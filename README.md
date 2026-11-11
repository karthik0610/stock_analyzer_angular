# Stock Analyzer

An Angular dashboard mockup for stock screening and trade setup review. It uses
sample data only; it is not connected to a live market data provider. The
watchlist company names and NSE symbols are taken from the Large Cap category
in `src/assets/AverageMarketCapitalization30Jun2026.xlsx`; displayed prices and
daily changes are generated mock values. The watchlist and bullish/bearish top
15 panels share `StockDataService`; top movers are sorted from the current quote
values. A future WebSocket can publish quote changes through
`StockDataService.updateQuote(symbol, quote)`. The browser-only simulated quote
stream updates watchlist prices and percentage changes every two seconds; the
top-15 mover panels recompute from those same shared quotes. The scanner stays
active until stopped, refreshes every two seconds, and rescans immediately on
quote or rule-input updates. It finalizes positive movers only when every
enabled blocking rule passes; a missing mandatory or hard-safety input is
unavailable, never treated as a pass. With the current mock quote feed, there
is no verified bid/ask, daily turnover history, time-slot volume history,
benchmark, or account state, so the scanner will report blockers rather than
fabricating a final trade candidate.

The 24-entry version 1.0 trading-rule registry and thresholds are defined in
`src/app/services/trading-rules/rule-registry.ts`; calculations and explicit
pass/fail/unavailable results are in
`src/app/services/trading-rules/trading-rule-engine.ts`. Candle-based rules
include session VWAP, EMA alignment, RSI, MACD, ATR, confirmed BOS/CHOCH,
support/resistance, ORB, FVG, Order Block, relative strength, risk/reward,
position sizing, profit booking, and trailing stops. Rules needing market,
order-book, historical-session, or portfolio data stay unavailable until
provided through `StockDataService.updateRuleInputs(symbol, inputs)`. The
Large-Cap category is taken from the bundled workbook; other account and
market inputs are not inferred from simulated prices.

The FVG thresholds in `FVG_RULE_CONFIG` are gap ≥ 0.15 ATR(14),
middle-candle body ≥ 0.5 ATR, and middle-candle volume ≥ 1.5× the preceding
14-candle average. A break of structure is recorded as a preference. Fully
mitigated and invalidated zones are rejected; chart overlays reuse the same
analysis. The Order Block rule is separately implemented in
`src/app/services/trading-rules/order-block-rule.ts`: it identifies the last
opposite-direction candle before displacement, requires a ≥ 1 ATR(14) body and
a confirmed structure break, and tracks fresh/touched/mitigated/invalidated
status. These are algorithmic price-action zones, not claims about
institutional orders. The mock feed includes generated OHLCV candles only;
real-market results require a data provider.

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). The page is split into
standalone components for the header, watchlist, top movers, trading rules,
finalized stocks, and the stock-analysis placeholder.

## Build and test

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```
