# Stock Analyzer

An Angular dashboard mockup for stock screening and trade setup review. It uses
sample data only; it is not connected to a live market data provider.

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
