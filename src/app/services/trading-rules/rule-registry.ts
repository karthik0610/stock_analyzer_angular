export type TradingRuleId =
  | 'R001'
  | 'R002'
  | 'R003'
  | 'R004'
  | 'R005'
  | 'R005B'
  | 'R006'
  | 'R007'
  | 'R008'
  | 'R009'
  | 'R010'
  | 'R011'
  | 'R012'
  | 'R013'
  | 'R014'
  | 'R015'
  | 'R016'
  | 'R017'
  | 'R018'
  | 'R019'
  | 'R020'
  | 'R021'
  | 'R022'
  | 'R023';

export type TradingRulePriority =
  | 'Mandatory'
  | 'Filter'
  | 'Confirmation'
  | 'Scored'
  | 'Setup'
  | 'Mandatory for trade location'
  | 'Mandatory for risk'
  | 'Hard safety'
  | 'Trade management';

export interface TradingRuleDefinition {
  id: TradingRuleId;
  name: string;
  detail: string;
  priority: TradingRulePriority;
  blocking: boolean;
  toggleable: boolean;
  enabledByDefault: boolean;
}

export const TRADING_RULE_DEFINITIONS: readonly TradingRuleDefinition[] = [
  {
    id: 'R001',
    name: 'Liquidity · 20-day ADTV',
    detail: 'Average daily traded value ≥ ₹10 crore',
    priority: 'Mandatory',
    blocking: true,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R002',
    name: 'Bid-ask spread',
    detail: 'Quoted spread ≤ 0.10%',
    priority: 'Mandatory',
    blocking: true,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R003',
    name: 'Market-cap category',
    detail: 'AMFI category; small caps need extra depth checks',
    priority: 'Filter',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R004',
    name: 'Session VWAP',
    detail: 'Price vs cumulative session VWAP and its slope',
    priority: 'Mandatory',
    blocking: true,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R005',
    name: 'EMA 9 / EMA 20',
    detail: 'Directional trend alignment on primary candles',
    priority: 'Mandatory',
    blocking: true,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R005B',
    name: 'Higher-timeframe EMA 50 / 200',
    detail: 'Directional confirmation from supplied higher-timeframe candles',
    priority: 'Confirmation',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R006',
    name: 'Time-adjusted relative volume',
    detail: 'Current 5-minute volume ≥ 1.5× matching time-slot baseline',
    priority: 'Mandatory',
    blocking: true,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R007',
    name: 'RSI (14)',
    detail: 'Bullish 55–70 · bearish 30–45',
    priority: 'Scored',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R008',
    name: 'MACD (12, 26, 9)',
    detail: 'MACD / signal alignment and histogram direction',
    priority: 'Scored',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R009',
    name: 'Opening Range Breakout',
    detail: '15-minute range break with volume, VWAP and EMA confirmation',
    priority: 'Setup',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R010',
    name: 'Break of Structure',
    detail: 'Close beyond a confirmed 2-left / 2-right swing',
    priority: 'Confirmation',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R011',
    name: 'Fair Value Gap',
    detail: 'Three-candle imbalance with ATR, body and volume qualification',
    priority: 'Confirmation',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R012',
    name: 'Order Block',
    detail: 'Opposing candle, displacement and confirmed structure break',
    priority: 'Confirmation',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R013',
    name: 'Support / resistance',
    detail: 'Previous-day levels, pivots and confirmed swings',
    priority: 'Mandatory for trade location',
    blocking: true,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R014',
    name: 'ATR (14)',
    detail: 'Wilder volatility measure for risk and stops',
    priority: 'Mandatory for risk',
    blocking: true,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R015',
    name: 'Reward / risk',
    detail: 'Executable target-to-stop risk ratio ≥ 2.0',
    priority: 'Mandatory',
    blocking: true,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R016',
    name: 'Daily loss limit',
    detail: 'Block entries at capital × 1.5% daily loss',
    priority: 'Hard safety',
    blocking: true,
    toggleable: false,
    enabledByDefault: true,
  },
  {
    id: 'R017',
    name: 'Maximum open positions',
    detail: 'Hard limit of 3 simultaneous positions',
    priority: 'Hard safety',
    blocking: true,
    toggleable: false,
    enabledByDefault: true,
  },
  {
    id: 'R018',
    name: 'Market regime',
    detail: 'NIFTY trend, VWAP and market breadth must agree',
    priority: 'Mandatory',
    blocking: true,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R019',
    name: 'Relative strength vs NIFTY',
    detail: '15 / 30 / 60-minute stock performance vs benchmark',
    priority: 'Scored',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R020',
    name: 'Change of Character',
    detail: 'Confirmed structural break against the prior swing trend',
    priority: 'Confirmation',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R021',
    name: 'Position sizing',
    detail: 'Risk budget ÷ per-share risk, capped by capital and costs',
    priority: 'Mandatory',
    blocking: true,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R022',
    name: 'Profit booking',
    detail: 'Manage partial exits at 1.5R / 2R / 3R',
    priority: 'Trade management',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
  {
    id: 'R023',
    name: 'Trailing stop loss',
    detail: 'ATR / structure trail that tightens but never widens',
    priority: 'Trade management',
    blocking: false,
    toggleable: true,
    enabledByDefault: true,
  },
] as const;

export const TRADING_RULE_CONFIG = Object.freeze({
  strategyVersion: '1.0',
  minimumAdtvRupees: 100_000_000,
  adtvLookbackSessions: 20,
  maximumSpreadPercent: 0.1,
  vwapSessionReset: true,
  emaFastPeriod: 9,
  emaSlowPeriod: 20,
  higherTrendFastPeriod: 50,
  higherTrendSlowPeriod: 200,
  relativeVolumeLookbackSessions: 20,
  minimumRelativeVolume: 1.5,
  rsiPeriod: 14,
  bullishRsiMinimum: 55,
  bullishRsiMaximum: 70,
  bearishRsiMinimum: 30,
  bearishRsiMaximum: 45,
  macdFastPeriod: 12,
  macdSlowPeriod: 26,
  macdSignalPeriod: 9,
  openingRangeMinutes: 15,
  swingLeftBars: 2,
  swingRightBars: 2,
  minimumBreakoutAtr: 0.05,
  minimumBosBodyAtr: 0.5,
  atrPeriod: 14,
  minimumRewardRisk: 2,
  dailyLossPercent: 1.5,
  riskPerTradePercent: 0.5,
  maximumOpenPositions: 3,
  relativeStrengthPeriodsMinutes: [15, 30, 60] as const,
  zoneClusterPercent: 0.2,
  stopBufferAtr: 0.2,
  atrStopMultiple: 1.5,
  targetRiskMultiples: [1.5, 2, 3] as const,
  targetBookingPercents: [40, 30, 30] as const,
  trailingAtrMultiple: 1.5,
});
