# FinEdge fundamental analysis

The Fundamental Analysis screen uses the FinEdge stock-symbols, financials, ratios,
and financial-metrics endpoints. The Stock Analysis screen derives 3Y revenue and
net-profit CAGR from one consolidated annual P&L response, using the same latest
fiscal-year window for `income` and `profitLossForThePeriod`. Its provider
interface is in `fundamental-data-provider.ts`; new data providers can implement
that interface and be registered in `app.config.ts`.

The same annual P&L response also derives latest-year Net Profit Margin from
`profitOrLossAttributableToOwners`. Banks use `interestEarned` as the denominator;
other companies use `revenueFromOperations`, without adding `otherIncome`.

For local development, replace `YOUR_FINEDGE_API_KEY` in `finedgeapi.constants.ts`
with your own token. FinEdge sends the token as a `token` query parameter. A key
embedded in an Angular app is visible to users, so production deployments should
proxy these requests through a server and keep the key there.
