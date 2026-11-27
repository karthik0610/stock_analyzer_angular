export type AnalysisStatus = 'positive' | 'caution' | 'negative' | 'neutral';

export interface AnalysisPoint {
  label: string;
  value: string;
  detail?: string;
  status?: AnalysisStatus;
}

export interface AnalysisCategory {
  title: string;
  points: AnalysisPoint[];
  warnings?: AnalysisPoint[];
  summary?: string;
}

export const analysisCategories: AnalysisCategory[] = [
  {
    title: '1. Business Understanding',
    points: [
      { label: 'Company', value: 'Reliance Industries', detail: 'Illustrative company profile.', status: 'neutral' },
      { label: 'What does the company do?', value: 'Energy, retail, telecom, and digital services.', detail: 'A diversified Indian business serving consumers and enterprises.' },
      { label: 'How does it make money?', value: 'Products, retail sales, plans, and subscriptions.', detail: 'Revenue model: energy and materials, retail, telecom, and digital services.' },
      { label: 'Who are its customers?', value: 'B2B · B2C · Government', detail: 'Example mix: enterprises, shoppers and subscribers, plus public-sector contracts.' },
      { label: 'Competitors and market position', value: 'Leader in some segments; peer in others.', detail: 'Example peers: Indian Oil, Bharti Airtel, and large retailers.' },
      { label: 'Moat / competitive advantage', value: 'Brand · scale · infrastructure · network', detail: 'Illustrative advantages that may be difficult and costly to replicate.' },
      { label: 'Industry direction', value: 'Retail and digital: growing · Energy: mature', detail: 'Outlook varies across the company’s business segments.' },
    ],
  },
  {
    title: '2. Fundamental / Financial Health',
    points: [
      { label: 'Revenue growth', value: 'Loading…', detail: 'Calculated from FinEdge consolidated annual P&L income.', status: 'neutral' },
      { label: 'Net profit growth', value: 'Loading…', detail: 'Calculated from FinEdge consolidated annual P&L profit.', status: 'neutral' },
      { label: 'Net Profit Margin (NPM)', value: 'Loading…', detail: 'Calculated from the latest FinEdge annual P&L.', status: 'neutral' },
      { label: 'Operating Profit Margin (OPM / EBITDA)', value: '17.2%', detail: 'Example core business profitability.', status: 'positive' },
      { label: 'EPS (Earnings Per Share)', value: '₹60.40 · +10.2% YoY', detail: 'Example earnings per share are growing.', status: 'positive' },
      { label: 'ROE (Return on Equity)', value: '10.1%', detail: 'Below the 15% healthy reference from your checklist.', status: 'caution' },
      { label: 'ROCE (Return on Capital Employed)', value: '14.2%', detail: 'Near, but below, the 15% reference.', status: 'caution' },
      { label: 'ROA (Return on Assets)', value: '4.3%', detail: 'Especially useful when reviewing banks and NBFCs.', status: 'neutral' },
      { label: 'PE Ratio', value: '24.7×', detail: 'Example sector PE: 22×; own 5-year average: 21.5×.', status: 'caution' },
      { label: 'PB Ratio (Price-to-Book)', value: '2.4×', detail: 'Compare with sector peers, especially for banks and asset-heavy firms.' },
      { label: 'EV/EBITDA', value: '12.8×', detail: 'Example peer-comparison multiple, accounting for debt.' },
      { label: 'PEG Ratio', value: '2.0×', detail: 'Near the costly reference level of 2×.', status: 'caution' },
      { label: 'Dividend Yield', value: '0.4%', detail: 'Example annual dividend as a percentage of share price.' },
      { label: 'Debt-to-Equity (D/E)', value: '0.42×', detail: 'Below the 2× high-risk reference.', status: 'positive' },
      { label: 'Interest Coverage', value: '4.8×', detail: 'Above the 3× reference.', status: 'positive' },
      { label: 'Current Ratio', value: '1.12×', detail: 'Below the 1.5× comfortable reference.', status: 'caution' },
      { label: 'Free Cash Flow (FCF)', value: '₹18,400 Cr · positive', detail: 'Example FCF is up 6% year over year.', status: 'positive' },
      { label: 'Operating Cash Flow', value: '₹1.52 lakh Cr', detail: 'Example cash from operations is positive.', status: 'positive' },
      { label: 'FCF vs Net Profit', value: '0.25×', detail: 'Example FCF is much lower than net profit; investigate earnings quality.', status: 'caution' },
      { label: 'Cash Flow from Operations / Revenue', value: '16.8%', detail: 'Below the 50% reference in your checklist.', status: 'caution' },
    ],
  },
  {
    title: '3. Technical Analysis',
    points: [
      { label: 'Price vs 200-Day Moving Average', value: '5.1% above · ₹1,245', detail: 'Example long-term trend is positive.', status: 'positive' },
      { label: 'Price vs 50 DMA', value: '1.5% above · ₹1,289', detail: 'Example short-to-medium trend is mildly positive.', status: 'positive' },
      { label: 'RSI (Relative Strength Index)', value: '58 · Neutral', detail: 'Between the 30 oversold and 70 overbought references.', status: 'neutral' },
      { label: 'MACD', value: 'Bullish crossover', detail: 'Example momentum signal.', status: 'positive' },
      { label: 'Support & Resistance', value: 'Support ₹1,285 · Resistance ₹1,340', detail: 'Illustrative levels only.', status: 'neutral' },
      { label: '52-Week High / Low', value: '₹1,115 – ₹1,610', detail: 'Example price sits within the yearly range.', status: 'neutral' },
      { label: 'Volume', value: '1.18× 20-day average', detail: 'Example move has above-average volume.', status: 'positive' },
      { label: 'Bollinger Bands', value: 'Mid-band · consolidating', detail: 'Example price remains between the upper and lower bands.', status: 'neutral' },
      { label: 'Supertrend Indicator', value: 'BUY', detail: 'Illustrative ATR-based trend signal.', status: 'positive' },
    ],
  },
  {
    title: '4. Shareholding Pattern',
    points: [
      { label: 'Promoter Holding', value: '50.3% · unchanged QoQ', detail: 'Above the 50% reference; track changes over time.', status: 'positive' },
      { label: 'Promoter Pledge', value: '0.0%', detail: 'No pledged shares in this example.', status: 'positive' },
      { label: 'FII Holding', value: '18.1% · +0.3 pp QoQ', detail: 'Example foreign institutional ownership is rising.', status: 'positive' },
      { label: 'DII Holding', value: '16.6% · +0.5 pp QoQ', detail: 'Example domestic institutional ownership is rising.', status: 'positive' },
      { label: 'Retail Holding', value: '15.0% · −0.8 pp QoQ', detail: 'Example retail ownership is slightly lower.', status: 'neutral' },
      { label: 'Quarter-on-Quarter Change', value: 'Institutions net buyers', detail: 'Example FII and DII holdings increased this quarter.', status: 'positive' },
    ],
  },
  {
    title: '5. Balance Sheet Strength',
    points: [
      { label: 'Total Debt vs Cash', value: 'Debt ₹3.2 lakh Cr · Cash ₹1.8 lakh Cr', detail: 'Example net debt: ₹1.4 lakh Cr.', status: 'caution' },
      { label: 'Receivables Days', value: '44 days · +2 days YoY', detail: 'Monitor further increases in collection time.', status: 'caution' },
      { label: 'Inventory Days', value: '39 days · stable', detail: 'Interpret inventory levels in the context of the sector.', status: 'neutral' },
      { label: 'Working Capital', value: '₹42,000 Cr · stable', detail: 'Example working-capital position is not materially stretched.', status: 'positive' },
      { label: 'Goodwill / Intangibles', value: '6.2% of total assets', detail: 'Example level; review acquisition history and impairment risk.', status: 'neutral' },
      { label: 'Contingent Liabilities', value: '3.2% of net worth', detail: 'Review notes to accounts for the nature of these obligations.', status: 'caution' },
    ],
  },
  {
    title: '6. Management & Governance',
    points: [
      { label: 'Promoter Track Record', value: '4 / 5 · sample rating', detail: 'Illustrative review of long-term shareholder value creation.', status: 'positive' },
      { label: 'Salary vs Company Size', value: '0.4% of net profit', detail: 'Example promoter remuneration ratio.', status: 'positive' },
      { label: 'Related-Party Transactions', value: '2.1% of revenue', detail: 'Example level; review terms and disclosures.', status: 'neutral' },
      { label: 'Auditor Quality & Opinion', value: 'Unmodified · sample', detail: 'No qualification in this illustrative example.', status: 'positive' },
      { label: 'Accounting Quality', value: 'No restatements in 5 years', detail: 'Example record; check consistency of accounting policies.', status: 'positive' },
      { label: 'Corporate Governance Rating', value: 'A− · sample rating', detail: 'Illustrative rating; check SEBI orders and exchange penalties.', status: 'positive' },
      { label: 'Management Commentary', value: 'Guidance broadly on track', detail: 'Example summary of calls and shareholder communications.', status: 'positive' },
    ],
  },
  {
    title: '7. Corporate Events & News',
    points: [
      { label: 'Upcoming Results Date', value: '20 Jan 2027 · example', detail: 'Illustrative date only; verify before trading.', status: 'neutral' },
      { label: 'Dividend History', value: 'Paid in 5 / 5 years · example', detail: 'Example pattern of consistent dividends.', status: 'positive' },
      { label: 'Stock Splits & Bonuses', value: 'No recent action · example', detail: 'Review announcements for any change.', status: 'neutral' },
      { label: 'Mergers & Acquisitions', value: 'One integration underway · example', detail: 'Assess whether the deal creates or destroys value.', status: 'caution' },
      { label: 'Rights Issues / QIP / FPO', value: 'No issue in 3 years · example', detail: 'Check for potential dilution.', status: 'positive' },
      { label: 'SEBI / Regulatory Actions', value: 'No active action · example', detail: 'Verify against official filings and notices.', status: 'positive' },
      { label: 'Recent News', value: 'Retail demand improving · example', detail: 'Track policy changes, export restrictions, and sector news.', status: 'neutral' },
    ],
  },
  {
    title: '8. Macro & Sector Factors',
    points: [
      { label: 'Interest-Rate Environment', value: 'Stable · example scenario', detail: 'Rising rates may pressure debt-heavy firms and NBFCs; banks can be affected differently.', status: 'neutral' },
      { label: 'Inflation', value: '4.2% · example scenario', detail: 'Example input-cost impact is partly offset by pricing power.', status: 'neutral' },
      { label: 'Currency Risk', value: 'Moderate USD exposure', detail: 'A weaker rupee may help exporters and hurt importers.', status: 'caution' },
      { label: 'Government Policy', value: 'Neutral to positive · example', detail: 'Monitor PLI schemes, import duties, and sector rules.', status: 'positive' },
      { label: 'Sector Cycle', value: 'Mid-cycle · example', detail: 'Cycle phase can change by business segment.', status: 'neutral' },
      { label: 'Global Factors', value: 'Oil: high sensitivity · China: moderate', detail: 'Oil prices and global demand can affect costs and sales.', status: 'caution' },
      { label: 'FII Flows', value: 'Net inflow · example month', detail: 'Use overall foreign flows as a market-sentiment indicator.', status: 'positive' },
    ],
  },
  {
    title: '9. Valuation vs Growth (Entry Price)',
    points: [
      { label: 'Intrinsic Value vs Market Price', value: '₹1,360 vs ₹1,308 · example DCF', detail: 'Illustrative estimate; assumptions can materially change the result.', status: 'positive' },
      { label: 'Margin of Safety', value: '3.8% · limited', detail: 'A larger discount may provide more protection from estimation errors.', status: 'caution' },
      { label: 'PEG vs Growth', value: '2.0× PEG · 12.4% growth', detail: 'Example is above the preferred PEG below 1.', status: 'caution' },
      { label: 'Historical PE Band', value: '62nd percentile · example', detail: 'Above the midpoint of the company’s example 5-year range.', status: 'caution' },
      { label: 'Sector PE Comparison', value: '24.7× vs 22× sector', detail: 'Example stock trades above the sector average.', status: 'caution' },
    ],
  },
  {
    title: '10. Risk Assessment',
    points: [
      { label: 'Concentration Risk', value: 'Top segment: 32% of revenue', detail: 'Example exposure is moderate; review client and product dependence.', status: 'caution' },
      { label: 'Regulatory Risk', value: 'Medium · example', detail: 'Policy changes could affect parts of the business.', status: 'caution' },
      { label: 'Promoter / Key-Person Risk', value: 'Low to medium · example', detail: 'Assess leadership succession and dependence on key individuals.', status: 'neutral' },
      { label: 'Commodity-Price Risk', value: 'High · example', detail: 'Oil and feedstock prices can move margins.', status: 'negative' },
      { label: 'Cyclicality', value: 'Moderate · example', detail: 'Some segments may be more cyclical than others.', status: 'caution' },
      { label: 'Litigation Risk', value: 'One low-impact case · example', detail: 'Review pending cases and annual-report disclosures.', status: 'caution' },
      { label: 'ESG Risks', value: 'Medium · example', detail: 'Assess environmental, social, and governance exposures.', status: 'caution' },
    ],
    warnings: [
      { label: 'Promoter pledge / selling', value: 'No major flag · example', status: 'positive' },
      { label: 'Auditor resignation / qualification', value: 'None · example', status: 'positive' },
      { label: 'Revenue up, profit down', value: 'Not observed · example', status: 'positive' },
      { label: 'High debt + low interest cover', value: 'Not observed · example', status: 'positive' },
      { label: 'Frequent equity dilution', value: 'None in 3 years · example', status: 'positive' },
      { label: 'Cash flow far below reported profit', value: 'Monitor · example', status: 'caution' },
      { label: 'Unusually large related-party deals', value: 'None identified · example', status: 'positive' },
      { label: 'SEBI investigation / exchange penalty', value: 'None identified · example', status: 'positive' },
      { label: 'Aggressive guidance repeatedly missed', value: 'Not observed · example', status: 'positive' },
    ],
  },
  {
    title: '11. Portfolio & Personal Fit',
    points: [
      { label: 'Investment Goal', value: 'Growth + some income', detail: 'Illustrative fit; align with your own goals.', status: 'neutral' },
      { label: 'Time Horizon', value: '3–5 years · example', detail: 'Different from a short-term trading horizon.', status: 'neutral' },
      { label: 'Risk Appetite', value: 'Moderate to high · example', detail: 'Consider the risk profile of large-, mid-, and small-cap holdings.', status: 'caution' },
      { label: 'Diversification', value: 'Sector exposure: 18%', detail: 'Example portfolio is above a 15% sector target.', status: 'caution' },
      { label: 'Position Sizing', value: '5% of portfolio · example', detail: 'Avoid concentrating too much in one stock; 5–10% is a common reference.' },
      { label: 'Tax Implications', value: 'STCG 20% · LTCG 12.5% above ₹1.25 lakh', detail: 'Example based on the rates in your checklist; verify current tax rules.', status: 'neutral' },
    ],
  },
  {
    title: '12. Key Documents to Read',
    points: [
      { label: 'Annual Report', value: 'Reviewed · example', detail: 'Director’s letter, risk factors, and notes to accounts.', status: 'positive' },
      { label: 'Concall Transcript', value: 'Reviewed · example', detail: 'Management honesty, guidance, and analyst Q&A.', status: 'positive' },
      { label: 'Quarterly Results', value: 'Q2 trend: revenue +8% · example', detail: 'Check revenue/profit trends and QoQ/YoY margins.', status: 'neutral' },
      { label: 'Credit Rating Report', value: 'Stable · example', detail: 'Review upgrades or downgrades for debt-heavy companies.', status: 'positive' },
      { label: 'DRHP (for new listings)', value: 'Not applicable · listed company', detail: 'For a new listing, review its business model, risks, and use of funds.', status: 'neutral' },
    ],
  },
];

interface StockSampleProfile {
  businessPoints: Record<string, Partial<AnalysisPoint>>;
  summaries: Record<string, string>;
  pointOverrides: Record<string, Record<string, Partial<AnalysisPoint>>>;
}

const stockSampleProfiles: Record<string, StockSampleProfile> = {
  HDFCBANK: {
    businessPoints: {
      Company: { value: 'HDFC Bank' },
      'What does the company do?': { value: 'Banking, lending, cards, and digital financial services.', detail: 'Illustrative private-sector bank profile.' },
      'How does it make money?': { value: 'Net interest income, fees, cards, and lending.', detail: 'Example revenue from deposits, loans, payments, and other services.' },
      'Who are its customers?': { value: 'Individuals · SMEs · Corporates', detail: 'Example retail and commercial banking customer mix.' },
      'Competitors and market position': { value: 'Large private-bank leader.', detail: 'Example peers: ICICI Bank, SBI, and Axis Bank.' },
      'Moat / competitive advantage': { value: 'Brand · branch network · deposits', detail: 'Illustrative trust, distribution, and customer relationships.' },
      'Industry direction': { value: 'Credit and digital banking: growing', detail: 'Deposit competition and credit quality remain important.' },
    },
    summaries: {
      '2. Fundamental / Financial Health': 'Demo bank snapshot: NIM 3.6%, ROE 17.1%.',
      '3. Technical Analysis': 'Demo quote ₹1,680; 200 DMA ₹1,620; RSI 54; neutral-to-positive trend.',
      '4. Shareholding Pattern': 'Demo promoter stake 25.2%; FII +0.4 pp QoQ; pledge 0%.',
      '5. Balance Sheet Strength': 'Bank-specific demo: capital adequacy 19.3%; gross NPA 1.4%; deposits remain the key funding base.',
      '6. Management & Governance': 'Demo review: clean audit opinion; monitor integration, asset quality, and governance disclosures.',
      '7. Corporate Events & News': 'Demo snapshot: quarterly results due 20 Jan 2027; no active regulatory event assumed.',
      '8. Macro & Sector Factors': 'Demo drivers: deposit costs, policy rates, credit demand, and household savings.',
      '9. Valuation vs Growth (Entry Price)': 'Demo value ₹1,740 vs market ₹1,680; P/B and sustainable ROE are key checks.',
      '10. Risk Assessment': 'Demo focus: unsecured-loan quality, deposit competition, and regulatory requirements.',
      '11. Portfolio & Personal Fit': 'Demo profile: large-cap financial exposure; moderate risk and a 3–5 year horizon.',
      '12. Key Documents to Read': 'Demo documents: annual report, quarterly asset-quality tables, and RBI disclosures.',
    },
    pointOverrides: {
      '2. Fundamental / Financial Health': {
        'ROE (Return on Equity)': { value: '17.1%', status: 'positive' },
        'ROA (Return on Assets)': { value: '1.9%', detail: 'Illustrative bank profitability measure.' },
        'PE Ratio': { value: '21.8×', status: 'neutral' },
        'PB Ratio (Price-to-Book)': { value: '2.8×', status: 'neutral' },
      },
      '3. Technical Analysis': {
        'Price vs 200-Day Moving Average': { value: '3.7% above · ₹1,620', status: 'positive' },
        'RSI (Relative Strength Index)': { value: '54 · Neutral', status: 'neutral' },
      },
      '4. Shareholding Pattern': {
        'Promoter Holding': { value: '25.2% · unchanged QoQ', status: 'neutral' },
        'FII Holding': { value: '47.3% · +0.4 pp QoQ', status: 'positive' },
        'Promoter Pledge': { value: '0.0%', status: 'positive' },
      },
    },
  },
  INFY: {
    businessPoints: {
      Company: { value: 'Infosys Ltd' },
      'What does the company do?': { value: 'IT services, consulting, cloud, and digital transformation.', detail: 'Illustrative global technology-services profile.' },
      'How does it make money?': { value: 'Long-term projects, managed services, and consulting.', detail: 'Example revenue from enterprise technology contracts.' },
      'Who are its customers?': { value: 'Global enterprises · B2B', detail: 'Example customers across financial services, retail, and manufacturing.' },
      'Competitors and market position': { value: 'Global IT services leader.', detail: 'Example peers: TCS, Wipro, Accenture, and Cognizant.' },
      'Moat / competitive advantage': { value: 'Brand · talent · delivery network', detail: 'Illustrative client relationships and global delivery scale.' },
      'Industry direction': { value: 'Cloud and AI services: growing', detail: 'Technology budgets and client spending cycles can vary.' },
    },
    summaries: {
      '2. Fundamental / Financial Health': 'Demo IT snapshot: operating margin 21.0%, ROE 31.0%, net cash.',
      '3. Technical Analysis': 'Demo quote ₹1,662; 200 DMA ₹1,590; RSI 57; positive trend.',
      '4. Shareholding Pattern': 'Demo promoter stake 14.3%; FII 33.2%; pledge 0%.',
      '5. Balance Sheet Strength': 'Demo snapshot: net cash ₹28,000 Cr; receivable days 66; monitor collections.',
      '6. Management & Governance': 'Demo review: unmodified audit opinion; monitor attrition, guidance, and related-party disclosures.',
      '7. Corporate Events & News': 'Demo snapshot: results due 15 Jan 2027; deal wins and client spending are key updates.',
      '8. Macro & Sector Factors': 'Demo drivers: US/Europe technology budgets, currency moves, and AI demand.',
      '9. Valuation vs Growth (Entry Price)': 'Demo value ₹1,710 vs market ₹1,662; compare growth with the historical PE band.',
      '10. Risk Assessment': 'Demo focus: client concentration, discretionary IT spending, talent costs, and currency exposure.',
      '11. Portfolio & Personal Fit': 'Demo profile: export-oriented large-cap growth exposure; moderate risk.',
      '12. Key Documents to Read': 'Demo documents: annual report, client-concentration notes, and quarterly deal commentary.',
    },
    pointOverrides: {
      '2. Fundamental / Financial Health': {
        'Operating Profit Margin (OPM / EBITDA)': { value: '21.0%', status: 'positive' },
        'ROE (Return on Equity)': { value: '31.0%', status: 'positive' },
        'PE Ratio': { value: '27.4×', status: 'caution' },
        'Debt-to-Equity (D/E)': { value: '0.08× · net cash', status: 'positive' },
      },
      '3. Technical Analysis': {
        'Price vs 200-Day Moving Average': { value: '4.5% above · ₹1,590', status: 'positive' },
        'RSI (Relative Strength Index)': { value: '57 · Neutral', status: 'neutral' },
      },
      '4. Shareholding Pattern': {
        'Promoter Holding': { value: '14.3% · unchanged QoQ', status: 'neutral' },
        'FII Holding': { value: '33.2% · +0.3 pp QoQ', status: 'positive' },
        'Promoter Pledge': { value: '0.0%', status: 'positive' },
      },
    },
  },
  TCS: {
    businessPoints: {
      Company: { value: 'Tata Consultancy Services' },
      'What does the company do?': { value: 'IT consulting, software services, and business solutions.', detail: 'Illustrative global technology-services profile.' },
      'How does it make money?': { value: 'Enterprise projects, managed services, and outsourcing.', detail: 'Example revenue from long-term client contracts.' },
      'Who are its customers?': { value: 'Global enterprises · B2B', detail: 'Example customers across banking, retail, and manufacturing.' },
      'Competitors and market position': { value: 'Global scale leader in IT services.', detail: 'Example peers: Infosys, Accenture, Wipro, and Cognizant.' },
      'Moat / competitive advantage': { value: 'Brand · scale · client relationships', detail: 'Illustrative delivery footprint and long-term contracts.' },
      'Industry direction': { value: 'Digital transformation: growing', detail: 'Client technology budgets remain a key cycle indicator.' },
    },
    summaries: {
      '2. Fundamental / Financial Health': 'Demo IT snapshot: operating margin 24.5%, ROE 52.0%, net cash.',
      '3. Technical Analysis': 'Demo quote ₹4,356; 200 DMA ₹4,190; RSI 61; positive momentum.',
      '4. Shareholding Pattern': 'Demo promoter stake 71.7%; FII 12.8%; pledge 0%.',
      '5. Balance Sheet Strength': 'Demo snapshot: net cash ₹45,000 Cr; receivable days 72; low debt.',
      '6. Management & Governance': 'Demo review: unmodified audit opinion; monitor succession, margins, and disclosures.',
      '7. Corporate Events & News': 'Demo snapshot: results due 9 Jan 2027; large deal wins are a key update.',
      '8. Macro & Sector Factors': 'Demo drivers: global IT spending, wage inflation, and currency movements.',
      '9. Valuation vs Growth (Entry Price)': 'Demo value ₹4,520 vs market ₹4,356; compare premium with expected growth.',
      '10. Risk Assessment': 'Demo focus: client concentration, global spending cuts, automation, and talent retention.',
      '11. Portfolio & Personal Fit': 'Demo profile: quality large-cap exposure; lower volatility than many smaller IT peers.',
      '12. Key Documents to Read': 'Demo documents: annual report, deal pipeline updates, and quarterly margin commentary.',
    },
    pointOverrides: {
      '2. Fundamental / Financial Health': {
        'Operating Profit Margin (OPM / EBITDA)': { value: '24.5%', status: 'positive' },
        'ROE (Return on Equity)': { value: '52.0%', status: 'positive' },
        'PE Ratio': { value: '31.2×', status: 'caution' },
        'Debt-to-Equity (D/E)': { value: '0.05× · net cash', status: 'positive' },
      },
      '3. Technical Analysis': {
        'Price vs 200-Day Moving Average': { value: '4.0% above · ₹4,190', status: 'positive' },
        'RSI (Relative Strength Index)': { value: '61 · Neutral', status: 'neutral' },
      },
      '4. Shareholding Pattern': {
        'Promoter Holding': { value: '71.7% · unchanged QoQ', status: 'positive' },
        'FII Holding': { value: '12.8% · +0.2 pp QoQ', status: 'positive' },
        'Promoter Pledge': { value: '0.0%', status: 'positive' },
      },
    },
  },
  ICICIBANK: {
    businessPoints: {
      Company: { value: 'ICICI Bank' },
      'What does the company do?': { value: 'Banking, lending, payments, and financial products.', detail: 'Illustrative private-sector bank profile.' },
      'How does it make money?': { value: 'Interest income, fees, cards, and wealth services.', detail: 'Example revenue from retail and corporate banking.' },
      'Who are its customers?': { value: 'Individuals · SMEs · Corporates', detail: 'Example retail, business, and institutional clients.' },
      'Competitors and market position': { value: 'Large private-bank leader.', detail: 'Example peers: HDFC Bank, SBI, and Axis Bank.' },
      'Moat / competitive advantage': { value: 'Brand · digital channels · distribution', detail: 'Illustrative customer reach and product breadth.' },
      'Industry direction': { value: 'Formal credit and digital banking: growing', detail: 'Deposit costs and credit quality remain important.' },
    },
    summaries: {
      '2. Fundamental / Financial Health': 'Demo bank snapshot: ROE 17.8%, NIM 4.4%.',
      '3. Technical Analysis': 'Demo quote ₹1,287; 200 DMA ₹1,220; RSI 59; positive trend.',
      '4. Shareholding Pattern': 'Demo promoter stake 50.9%; FII 44.1%; pledge 0%.',
      '5. Balance Sheet Strength': 'Bank-specific demo: capital adequacy 16.8%; gross NPA 1.9%; monitor loan mix.',
      '6. Management & Governance': 'Demo review: clean audit opinion; track credit quality and governance disclosures.',
      '7. Corporate Events & News': 'Demo snapshot: results due 24 Jan 2027; asset quality is a key update.',
      '8. Macro & Sector Factors': 'Demo drivers: policy rates, deposit competition, credit demand, and inflation.',
      '9. Valuation vs Growth (Entry Price)': 'Demo value ₹1,340 vs market ₹1,287; compare P/B with sustainable ROE.',
      '10. Risk Assessment': 'Demo focus: unsecured credit, deposit costs, regulatory capital, and loan quality.',
      '11. Portfolio & Personal Fit': 'Demo profile: financial-sector growth exposure; moderate risk and 3–5 year horizon.',
      '12. Key Documents to Read': 'Demo documents: annual report, quarterly asset-quality tables, and RBI disclosures.',
    },
    pointOverrides: {
      '2. Fundamental / Financial Health': {
        'ROE (Return on Equity)': { value: '17.8%', status: 'positive' },
        'ROA (Return on Assets)': { value: '2.2%', detail: 'Illustrative bank profitability measure.' },
        'PE Ratio': { value: '18.6×', status: 'neutral' },
        'PB Ratio (Price-to-Book)': { value: '3.2×', status: 'neutral' },
      },
      '3. Technical Analysis': {
        'Price vs 200-Day Moving Average': { value: '5.5% above · ₹1,220', status: 'positive' },
        'RSI (Relative Strength Index)': { value: '59 · Neutral', status: 'neutral' },
      },
      '4. Shareholding Pattern': {
        'Promoter Holding': { value: '50.9% · unchanged QoQ', status: 'positive' },
        'FII Holding': { value: '44.1% · +0.2 pp QoQ', status: 'positive' },
        'Promoter Pledge': { value: '0.0%', status: 'positive' },
      },
    },
  },
  BHARTIARTL: {
    businessPoints: {
      Company: { value: 'Bharti Airtel' },
      'What does the company do?': { value: 'Mobile, broadband, enterprise, and digital services.', detail: 'Illustrative telecommunications profile.' },
      'How does it make money?': { value: 'Mobile plans, broadband, enterprise connectivity, and infrastructure.', detail: 'Example recurring subscription and service revenue.' },
      'Who are its customers?': { value: 'Consumers · Businesses · Government', detail: 'Example mobile, broadband, and enterprise customers.' },
      'Competitors and market position': { value: 'Leading national telecom operator.', detail: 'Example peers: Reliance Jio and Vodafone Idea.' },
      'Moat / competitive advantage': { value: 'Brand · spectrum · network · scale', detail: 'Illustrative network investment and subscriber base.' },
      'Industry direction': { value: 'Data usage and 5G: growing', detail: 'Competition, spectrum costs, and pricing are key factors.' },
    },
    summaries: {
      '2. Fundamental / Financial Health': 'Demo telecom snapshot: EBITDA margin 52.0%, net debt/EBITDA 1.8×.',
      '3. Technical Analysis': 'Demo quote ₹1,712; 200 DMA ₹1,630; RSI 63; positive trend.',
      '4. Shareholding Pattern': 'Demo promoter stake 55.1%; FII 18.2%; pledge 0%.',
      '5. Balance Sheet Strength': 'Demo snapshot: net debt ₹1.9 lakh Cr; spectrum liabilities are a key balance-sheet item.',
      '6. Management & Governance': 'Demo review: clean audit opinion; monitor leverage, spectrum commitments, and disclosures.',
      '7. Corporate Events & News': 'Demo snapshot: results due 7 Feb 2027; tariff and 5G updates are key events.',
      '8. Macro & Sector Factors': 'Demo drivers: spectrum policy, data demand, equipment costs, and interest rates.',
      '9. Valuation vs Growth (Entry Price)': 'Demo value ₹1,770 vs market ₹1,712; compare growth with leverage and PE.',
      '10. Risk Assessment': 'Demo focus: capital intensity, spectrum obligations, competition, and leverage.',
      '11. Portfolio & Personal Fit': 'Demo profile: telecom growth exposure; moderate-to-high risk and multi-year horizon.',
      '12. Key Documents to Read': 'Demo documents: annual report, spectrum-liability notes, and subscriber metrics.',
    },
    pointOverrides: {
      '2. Fundamental / Financial Health': {
        'Operating Profit Margin (OPM / EBITDA)': { value: '52.0%', status: 'positive' },
        'Debt-to-Equity (D/E)': { value: '1.4×', status: 'caution' },
        'Interest Coverage': { value: '3.6×', status: 'positive' },
      },
      '3. Technical Analysis': {
        'Price vs 200-Day Moving Average': { value: '5.0% above · ₹1,630', status: 'positive' },
        'RSI (Relative Strength Index)': { value: '63 · Neutral', status: 'neutral' },
      },
      '4. Shareholding Pattern': {
        'Promoter Holding': { value: '55.1% · unchanged QoQ', status: 'positive' },
        'FII Holding': { value: '18.2% · +0.3 pp QoQ', status: 'positive' },
        'Promoter Pledge': { value: '0.0%', status: 'positive' },
      },
    },
  },
};

export function getAnalysisCategoriesForStock(symbol: string): AnalysisCategory[] {
  const profile = stockSampleProfiles[symbol];
  if (!profile) {
    return analysisCategories.map((category) => ({
      ...category,
      points: category.points.map((point) => ({ ...point })),
      warnings: category.warnings?.map((warning) => ({ ...warning })),
    }));
  }

  return analysisCategories.map((category) => {
    const categoryOverrides = profile.pointOverrides[category.title] ?? {};
    const businessOverrides: Record<string, Partial<AnalysisPoint>> = category.title === '1. Business Understanding'
      ? profile.businessPoints
      : {};

    return {
      ...category,
      summary: profile.summaries[category.title] ?? category.summary,
      points: category.points.map((point) => ({
        ...point,
        ...businessOverrides[point.label],
        ...categoryOverrides[point.label],
      })),
      warnings: category.warnings?.map((warning) => ({
        ...warning,
        ...categoryOverrides[warning.label],
      })),
    };
  });
}
