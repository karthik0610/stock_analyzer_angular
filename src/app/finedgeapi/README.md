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

Operating Profit Margin is also calculated from that response. Banks use
`(income - expenditureExcludingProvisions) / income` as PPOP margin; other
companies use `ebitda` (or `operatingProfit`) divided by `revenueFromOperations`.

Diluted EPS uses the latest annual values for
`profitOrLossAttributableToOwners / dilutedOutstandingShares`. When the prior
fiscal-year EPS is available and positive, the UI also displays its YoY change.

ROE combines latest-year P&L profit attributable to owners (falling back to
`profitLossForThePeriod`) with same-year balance-sheet `capital + reserves`.
Minority-interest fields are excluded from the denominator.

ROA uses latest-year P&L `profitOrLossAttributableToOwners` divided by same-year
balance-sheet `assets`.

PE and PB are read from the latest year in the
`annual-price-ratios/:symbol?statement_type=s` response. The endpoint request
is independent, so a price-ratios failure does not block the other metrics.

The “Competitors and market position” point uses
`peers/:symbol?group=sector`. It excludes the selected company from the
returned symbols and displays the remaining sector peers; the endpoint does not
provide a ranking or market-position measure.

“What does the company do?” uses the `description` from
`company-profile/:symbol`. “How does it make money?” uses the segment names
from the latest dated entry returned by
`segment-revenue/:symbol?statement_type=s&statement_code=pl&period=annual`.

The Market Snapshot card reads the selected stock’s quote from
`quote?symbol=:symbol`, including price movement, session and 52-week ranges,
market capitalization, open price, shares, volume, and trade time.

The Shareholding Pattern cards use
`shareholdings/pattern/:symbol?period=quarterly`. The latest two entries in
`columns` identify the current and previous quarters; `Promoters`,
`InstitutionsForeign`, `InstitutionsDomestic`, and `NonInstitutions` provide
promoter, FII, DII, and retail percentages. QoQ changes are percentage-point
differences, and the institutional direction is the sum of FII and DII changes.
Promoter pledge is intentionally left blank until its response fields are
available.

ROCE is shown as not applicable for banks when latest-year `interestEarned` is
positive. For other companies it uses `(profitLossBeforeTax + financeCosts) /
(totalAssets - currentLiabilities)`, falling back to
`(capital + reserves + totalDebt)` (or `borrowings`) for capital employed.

For local development, replace `YOUR_FINEDGE_API_KEY` in `finedgeapi.constants.ts`
with your own token. FinEdge sends the token as a `token` query parameter. A key
embedded in an Angular app is visible to users, so production deployments should
proxy these requests through a server and keep the key there.
