# Stock Analyzer

An Angular dashboard mockup for stock screening and trade setup review. It uses
sample data only; it is not connected to a live market data provider. The
watchlist company names and NSE symbols are taken from the Large Cap category
in `src/assets/AverageMarketCapitalization30Jun2026.xlsx`; displayed prices and
daily changes are generated mock values. The watchlist and bullish/bearish top
15 panels share `StockDataService`; top movers are sorted from the current quote
values. A future WebSocket can publish quote changes through
`StockDataService.updateQuote(symbol, quote)`.

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
