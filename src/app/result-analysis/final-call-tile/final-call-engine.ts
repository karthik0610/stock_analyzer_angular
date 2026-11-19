export type StockSymbol = 'RELIANCE' | 'HDFCBANK' | 'INFY' | 'TCS' | 'ICICIBANK' | 'BHARTIARTL';

export type InvestmentHorizon = 'swing' | 'shortTerm' | 'mediumTerm' | 'longTerm';

export const investmentHorizonOrder: InvestmentHorizon[] = ['swing', 'shortTerm', 'mediumTerm', 'longTerm'];

export type TradeSetupId = 'breakout' | 'pullback' | 'supportReversal' | 'rangeBreakout';

export const tradeSetupOrder: TradeSetupId[] = ['breakout', 'pullback', 'supportReversal', 'rangeBreakout'];

export interface TradeSetupDefinition {
  id: TradeSetupId;
  label: string;
  description: string;
  formula: string;
  entryTrigger: string;
}

export const tradeSetupDefinitions: Record<TradeSetupId, TradeSetupDefinition> = {
  breakout: {
    id: 'breakout',
    label: 'A · Breakout Entry',
    description: 'Resistance close, above-normal volume, positive relative strength, supportive market trend, and a non-extended breakout candle.',
    formula: 'Entry = resistance + 0.2%. Stop priority: thesis/structure with volatility buffer, then horizon ATR, then percentage. Target 1 = nearest resistance at ≥1.5R.',
    entryTrigger: 'Wait for the close above resistance or a confirmed retest; do not buy the first breakout candle.',
  },
  pullback: {
    id: 'pullback',
    label: 'B · Pullback Entry',
    description: 'Bullish primary trend, price above the 200 DMA, rising 50 DMA, support pullback, and reversal confirmation.',
    formula: 'Entry = support + 0.1 × ATR after reversal. Stop prioritizes thesis/structure, then horizon ATR, then percentage; targets use qualified resistance.',
    entryTrigger: 'Look for a bullish reversal, higher low, RSI recovery, volume expansion on recovery, or pullback-trendline break.',
  },
  supportReversal: {
    id: 'supportReversal',
    label: 'C · Support Reversal',
    description: 'Daily / weekly support, declining selling pressure, and a confirmed reversal near support.',
    formula: 'Entry = support + 0.1 × ATR after reversal. Stop prioritizes thesis/structure, then horizon ATR, then percentage; targets use qualified resistance.',
    entryTrigger: 'Wait for a reversal confirmation; an oversold RSI reading by itself is not a buy signal.',
  },
  rangeBreakout: {
    id: 'rangeBreakout',
    label: 'D · Consolidation / Range Breakout',
    description: 'Tight range, volatility contraction, clear range resistance, breakout close, and volume expansion.',
    formula: 'Entry = range high + 0.2%. Stop prioritizes range invalidation, then horizon ATR, then percentage; targets use qualified resistance or a measured range move.',
    entryTrigger: 'Require a closing breakout with volume expansion; avoid an extended first candle.',
  },
};

export const scoringCategories = [
  'Business Quality',
  'Financial Health',
  'Valuation',
  'Technical Strength',
  'Institutional / Events / Macro',
  'Risk & Portfolio',
] as const;

export type ScoringCategory = (typeof scoringCategories)[number];

export interface HorizonDefinition {
  id: InvestmentHorizon;
  label: string;
  timeframe: string;
  entryBasis: string;
}

export const horizonDefinitions: Record<InvestmentHorizon, HorizonDefinition> = {
  swing: {
    id: 'swing',
    label: 'Swing Trading',
    timeframe: '5–30 trading days',
    entryBasis: 'Breakout, pullback, support, momentum, and volume.',
  },
  shortTerm: {
    id: 'shortTerm',
    label: 'Short-Term',
    timeframe: '1–3 months',
    entryBasis: 'Trend, momentum, catalysts, and technical structure.',
  },
  mediumTerm: {
    id: 'mediumTerm',
    label: 'Medium-Term',
    timeframe: '3–12 months',
    entryBasis: 'Earnings growth, valuation, sector cycle, and weekly trends.',
  },
  longTerm: {
    id: 'longTerm',
    label: 'Long-Term Investing',
    timeframe: '1–5+ years',
    entryBasis: 'Business quality, compounding, financials, valuation, and governance.',
  },
};

export const horizonWeights: Record<InvestmentHorizon, Record<ScoringCategory, number>> = {
  swing: {
    'Business Quality': 5,
    'Financial Health': 5,
    Valuation: 5,
    'Technical Strength': 45,
    'Institutional / Events / Macro': 20,
    'Risk & Portfolio': 20,
  },
  shortTerm: {
    'Business Quality': 10,
    'Financial Health': 10,
    Valuation: 10,
    'Technical Strength': 35,
    'Institutional / Events / Macro': 20,
    'Risk & Portfolio': 15,
  },
  mediumTerm: {
    'Business Quality': 20,
    'Financial Health': 20,
    Valuation: 15,
    'Technical Strength': 20,
    'Institutional / Events / Macro': 15,
    'Risk & Portfolio': 10,
  },
  longTerm: {
    'Business Quality': 25,
    'Financial Health': 25,
    Valuation: 20,
    'Technical Strength': 10,
    'Institutional / Events / Macro': 10,
    'Risk & Portfolio': 10,
  },
};

export interface TradePlan {
  invalidationConditions: string;
  timeBasedExit: string;
}

export interface PositionSizingInputs {
  portfolioValue: number;
  riskPercentage: number;
  availableCapital: number;
  maxStockAllocationPercentage: number;
  remainingSectorExposurePercentage: number;
  averageDailyVolumeShares: number;
  maxDailyVolumeParticipationPercentage: number;
}

export interface PositionSizingResult {
  riskBudget: string;
  riskPerShare: string;
  shares: number;
  capitalRequired: string;
  riskAtStop: string;
  allocationPercentage: string;
  limitingFactors: string[];
}

export interface SetupMarketInputs {
  currentPrice: number;
  resistance: number;
  support: number;
  nextResistance: number;
  breakoutStructureLow: number;
  retestLow: number;
  rangeLow: number;
  rangeHigh: number;
  atr: number;
  tickSize: number;
  liquidityBuffer: number;
  percentageStopRate: number;
  volumeRatio20Day: number;
  relativeStrengthPositive: boolean;
  marketTrendSupportive: boolean;
  breakoutCandleExtensionPercent: number;
  primaryTrendBullish: boolean;
  priceAbove200Dma: boolean;
  fiftyDmaRising: boolean;
  pullbackReversalConfirmed: boolean;
  sellingPressureDeclining: boolean;
  supportReversalConfirmed: boolean;
  rangeTight: boolean;
  volatilityContracted: boolean;
}

export interface SetupCondition {
  label: string;
  met: boolean;
}

export interface SetupTradePlan extends TradePlan {
  setup: TradeSetupDefinition;
  conditions: SetupCondition[];
  setupReady: boolean;
  stopLossCandidates: StopLossCandidate[];
  selectedStopMethod: string;
  targetOneResistanceQualified: boolean;
  entryZone: string;
  stopLoss: string;
  targetOne: string;
  targetTwo: string;
  riskRewardText: string;
  riskRewardToTargetOne: number;
  positionSizing: PositionSizingResult;
}

export interface StopLossCandidate {
  method: string;
  price: string;
  selected: boolean;
  reason: string;
}

export interface StockEvaluationInput {
  categoryScores: Record<ScoringCategory, number>;
  evidenceVerifiedByCategory: Record<ScoringCategory, boolean>;
  tradePlan: TradePlan;
  setupMarket: SetupMarketInputs;
  positionSizing: PositionSizingInputs;
  gates: {
    majorGovernanceRedFlag: boolean;
    stopLossDefined: boolean;
    liquidityAdequate: boolean;
    criticalDataCurrent: boolean;
    extensionPercentByHorizon: Record<InvestmentHorizon, number>;
    majorEventRiskByHorizon: Record<InvestmentHorizon, boolean>;
  };
}

export type ScoreClassification = 'Exceptional' | 'Strong' | 'Good' | 'Neutral' | 'Weak' | 'Poor';

export type RuleBasedDecision =
  | 'BUY CANDIDATE'
  | 'CONDITIONAL BUY / WAIT'
  | 'WATCHLIST'
  | 'AVOID FRESH ENTRY'
  | 'REJECT'
  | 'WAIT'
  | 'AVOID';

export interface ScoringBreakdownRow {
  category: ScoringCategory;
  score: number;
  weight: number;
  contribution: number;
  evidenceVerified: boolean;
}

export interface FinalCallEvaluation {
  overallScore: number;
  classification: ScoreClassification;
  qualityAssessment: string;
  candidateAction: RuleBasedDecision;
  decision: RuleBasedDecision;
  decisionSummary: string;
  blockingReasons: string[];
  breakdown: ScoringBreakdownRow[];
  tradePlan: SetupTradePlan;
}

const minimumRiskReward = 1.5;
const maximumEntryExtensionPercent = 5;
const maximumSupportDistancePercent = 2.5;

function formatPrice(price: number): string {
  const roundedPrice = Math.round(price * 100) / 100;
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(roundedPrice)}`;
}

function makeSetupTradePlan(
  input: StockEvaluationInput,
  horizon: InvestmentHorizon,
  setupId: TradeSetupId,
): SetupTradePlan {
  const market = input.setupMarket;
  const setup = tradeSetupDefinitions[setupId];
  let entry: number;
  let entryZone: string;
  let conditions: SetupCondition[];

  switch (setupId) {
    case 'breakout': {
      entry = market.resistance * 1.002;
      entryZone = `${formatPrice(market.resistance)}+ on a confirmed close or successful retest`;
      conditions = [
        { label: 'Resistance is identified', met: market.resistance > 0 },
        { label: `Daily close is above resistance (${formatPrice(market.resistance)})`, met: market.currentPrice > market.resistance },
        {
          label: `Volume ${market.volumeRatio20Day.toFixed(2)}× 20-day average (need ≥1.5×)`,
          met: market.volumeRatio20Day >= 1.5,
        },
        { label: 'Relative strength versus the index is positive', met: market.relativeStrengthPositive },
        { label: 'Market trend is supportive', met: market.marketTrendSupportive },
        {
          label: `Breakout candle extension is at most ${maximumEntryExtensionPercent}%`,
          met: market.breakoutCandleExtensionPercent <= maximumEntryExtensionPercent,
        },
      ];
      break;
    }
    case 'pullback': {
      entry = market.support + market.atr * 0.1;
      entryZone = `${formatPrice(market.support)}–${formatPrice(entry)} after reversal confirmation`;
      const supportDistance = Math.abs(market.currentPrice - market.support) / market.support * 100;
      conditions = [
        { label: 'Primary trend is bullish', met: market.primaryTrendBullish },
        { label: 'Price is above the 200 DMA', met: market.priceAbove200Dma },
        { label: '50 DMA is trending upward', met: market.fiftyDmaRising },
        {
          label: `Price is within ${maximumSupportDistancePercent}% of support`,
          met: supportDistance <= maximumSupportDistancePercent,
        },
        { label: 'A pullback reversal is confirmed', met: market.pullbackReversalConfirmed },
      ];
      break;
    }
    case 'supportReversal': {
      entry = market.support + market.atr * 0.1;
      const supportDistance = Math.abs(market.currentPrice - market.support) / market.support * 100;
      entryZone = `${formatPrice(market.support)}–${formatPrice(entry)} after reversal confirmation`;
      conditions = [
        { label: 'Major support is identified', met: market.support > 0 },
        {
          label: `Price is within ${maximumSupportDistancePercent}% of support`,
          met: supportDistance <= maximumSupportDistancePercent,
        },
        { label: 'Selling pressure is declining', met: market.sellingPressureDeclining },
        { label: 'A support reversal is confirmed', met: market.supportReversalConfirmed },
      ];
      break;
    }
    case 'rangeBreakout': {
      entry = market.rangeHigh * 1.002;
      entryZone = `${formatPrice(market.rangeHigh)}+ after a confirmed range breakout`;
      conditions = [
        { label: 'Price is forming a tight range', met: market.rangeTight },
        { label: 'Volatility has contracted', met: market.volatilityContracted },
        { label: 'Range resistance is clearly identified', met: market.rangeHigh > market.rangeLow },
        { label: `Daily close is above range resistance (${formatPrice(market.rangeHigh)})`, met: market.currentPrice > market.rangeHigh },
        {
          label: `Volume ${market.volumeRatio20Day.toFixed(2)}× 20-day average (need ≥1.5×)`,
          met: market.volumeRatio20Day >= 1.5,
        },
        {
          label: `Breakout candle extension is at most ${maximumEntryExtensionPercent}%`,
          met: market.breakoutCandleExtensionPercent <= maximumEntryExtensionPercent,
        },
      ];
      break;
    }
  }

  const buffer = Math.max(market.tickSize, market.liquidityBuffer, market.atr * 0.25);
  const stopLevels = (() => {
    switch (setupId) {
      case 'breakout':
        return [
          { method: 'Thesis invalidation', level: market.breakoutStructureLow },
          { method: 'Retest structure', level: market.retestLow },
        ];
      case 'pullback':
      case 'supportReversal':
        return [{ method: 'Thesis / structural support', level: market.support }];
      case 'rangeBreakout':
        return [{ method: 'Thesis / range structure', level: market.rangeLow }];
    }
  })();
  const atrMultipliers: Record<InvestmentHorizon, number> = {
    swing: 2,
    shortTerm: 2.5,
    mediumTerm: 3,
    longTerm: 3.5,
  };
  const rawStopCandidates = [
    ...stopLevels.map(({ method, level }) => ({
      method,
      value: level - buffer,
      reason: `Invalidation level less a ${formatPrice(buffer)} volatility/liquidity buffer`,
    })),
    {
      method: 'ATR',
      value: entry - market.atr * atrMultipliers[horizon],
      reason: `${atrMultipliers[horizon]}× ATR for ${horizon.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
    },
    {
      method: 'Percentage',
      value: entry * (1 - market.percentageStopRate),
      reason: `${(market.percentageStopRate * 100).toFixed(1)}% below entry`,
    },
  ];
  const stopLossCandidates: StopLossCandidate[] = rawStopCandidates
    .filter(({ value }) => Number.isFinite(value) && value > 0 && value < entry)
    .map(({ method, value, reason }, index) => ({
      method,
      price: formatPrice(value),
      selected: index === 0,
      reason,
    }));
  const selectedStop = rawStopCandidates.find(({ value }) => Number.isFinite(value) && value > 0 && value < entry);
  const stop = selectedStop?.value ?? 0;
  const risk = stop > 0 ? entry - stop : 0;
  const resistanceCandidates = [
    { value: market.resistance, reason: 'Identified resistance' },
    { value: market.nextResistance, reason: 'Next resistance' },
    ...(setupId === 'rangeBreakout' && market.rangeHigh > market.rangeLow
      ? [{ value: market.rangeHigh + (market.rangeHigh - market.rangeLow), reason: 'Measured range move' }]
      : []),
  ]
    .filter(({ value }) => Number.isFinite(value) && value > entry)
    .sort((a, b) => a.value - b.value);
  const targetOneCandidate = resistanceCandidates.find(
    ({ value }) => risk > 0 && (value - entry) / risk >= minimumRiskReward,
  );
  const targetOne = targetOneCandidate?.value ?? 0;
  const targetTwoResistance = resistanceCandidates.find(({ value }) => value > targetOne);
  const targetTwoRiskMultiple = risk > 0 ? entry + risk * 2.5 : 0;
  const targetTwo = targetTwoResistance?.value ??
    (targetOne > 0 && targetTwoRiskMultiple > targetOne ? targetTwoRiskMultiple : 0);

  const riskRewardToTargetOne = risk > 0 ? (targetOne - entry) / risk : 0;
  const riskRewardToTargetTwo = risk > 0 ? (targetTwo - entry) / risk : 0;
  const formatRiskReward = (ratio: number) => `1:${ratio.toFixed(2)}`;
  const sharesByRisk = risk > 0
    ? Math.floor(input.positionSizing.portfolioValue * input.positionSizing.riskPercentage / 100 / risk)
    : 0;
  const stockAllocationCap = input.positionSizing.portfolioValue
    * input.positionSizing.maxStockAllocationPercentage / 100;
  const sectorAllocationCap = input.positionSizing.portfolioValue
    * input.positionSizing.remainingSectorExposurePercentage / 100;
  const shareLimits = [
    { label: 'risk budget', shares: sharesByRisk },
    { label: 'available capital', shares: Math.floor(input.positionSizing.availableCapital / entry) },
    { label: 'stock allocation cap', shares: Math.floor(stockAllocationCap / entry) },
    { label: 'remaining sector exposure', shares: Math.floor(sectorAllocationCap / entry) },
    {
      label: 'daily liquidity participation',
      shares: Math.floor(
        input.positionSizing.averageDailyVolumeShares
        * input.positionSizing.maxDailyVolumeParticipationPercentage / 100,
      ),
    },
  ];
  const shares = Math.max(0, Math.min(...shareLimits.map(({ shares: limit }) => limit)));
  const riskBudget = input.positionSizing.portfolioValue * input.positionSizing.riskPercentage / 100;
  const capitalRequired = shares * entry;
  const limitingFactors = shareLimits
    .filter(({ shares: limit }) => limit === shares)
    .map(({ label }) => label);
  const positionSizing: PositionSizingResult = {
    riskBudget: formatPrice(riskBudget),
    riskPerShare: risk > 0 ? formatPrice(risk) : 'Unavailable',
    shares,
    capitalRequired: formatPrice(capitalRequired),
    riskAtStop: formatPrice(shares * risk),
    allocationPercentage: input.positionSizing.portfolioValue > 0
      ? `${(capitalRequired / input.positionSizing.portfolioValue * 100).toFixed(2)}%`
      : 'Unavailable',
    limitingFactors,
  };

  return {
    ...input.tradePlan,
    setup,
    conditions,
    setupReady: conditions.every((condition) => condition.met),
    stopLossCandidates,
    selectedStopMethod: selectedStop?.method ?? 'Unavailable',
    targetOneResistanceQualified: targetOneCandidate !== undefined,
    entryZone,
    stopLoss: stop > 0 ? `${formatPrice(stop)} · closing basis (${selectedStop?.method ?? 'stop'})` : 'Not defined',
    targetOne: targetOne > 0
      ? `${formatPrice(targetOne)} · ${targetOneCandidate?.reason ?? 'resistance'}`
      : 'No resistance provides the minimum risk/reward',
    targetTwo: targetTwo > 0
      ? `${formatPrice(targetTwo)} · ${targetTwoResistance?.reason ?? '2.5R projection'}`
      : 'No higher target level is available',
    riskRewardToTargetOne,
    riskRewardText: targetOne > 0
      ? `${formatRiskReward(riskRewardToTargetOne)} to Target 1 · ${
        targetTwo > 0 ? `${formatRiskReward(riskRewardToTargetTwo)} to Target 2` : 'Target 2 unavailable'
      }`
      : 'Unavailable — no qualified resistance',
    positionSizing,
  };
}

function classifyScore(score: number): ScoreClassification {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Strong';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Neutral';
  if (score >= 40) return 'Weak';
  return 'Poor';
}

function actionForClassification(classification: ScoreClassification): RuleBasedDecision {
  switch (classification) {
    case 'Exceptional':
    case 'Strong':
      return 'BUY CANDIDATE';
    case 'Good':
      return 'CONDITIONAL BUY / WAIT';
    case 'Neutral':
      return 'WATCHLIST';
    case 'Weak':
      return 'AVOID FRESH ENTRY';
    case 'Poor':
      return 'REJECT';
  }
}

function assessmentForClassification(classification: ScoreClassification): string {
  switch (classification) {
    case 'Exceptional':
      return 'Exceptional score — consider only when entry and risk checks clear.';
    case 'Strong':
      return 'Strong score — a candidate only after all entry gates clear.';
    case 'Good':
      return 'Potential candidate; wait for price and evidence confirmation.';
    case 'Neutral':
      return 'Watchlist based on score; no fresh buy signal.';
    case 'Weak':
      return 'Weak score; avoid a fresh entry.';
    case 'Poor':
      return 'Poor score; reject under this demo classification.';
  }
}

function validateTradeInputs(input: StockEvaluationInput): void {
  const { positionSizing, setupMarket } = input;
  const sizingValues = [
    positionSizing.portfolioValue,
    positionSizing.riskPercentage,
    positionSizing.availableCapital,
    positionSizing.maxStockAllocationPercentage,
    positionSizing.remainingSectorExposurePercentage,
    positionSizing.averageDailyVolumeShares,
    positionSizing.maxDailyVolumeParticipationPercentage,
  ];
  if (sizingValues.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError('Position sizing inputs must be finite and non-negative.');
  }
  if (positionSizing.portfolioValue <= 0) {
    throw new RangeError('Portfolio value must be greater than zero.');
  }
  if (
    positionSizing.riskPercentage > 100
    || positionSizing.maxStockAllocationPercentage > 100
    || positionSizing.remainingSectorExposurePercentage > 100
    || positionSizing.maxDailyVolumeParticipationPercentage > 100
  ) {
    throw new RangeError('Risk, allocation, and liquidity percentages must not exceed 100.');
  }
  const marketValues = [
    setupMarket.currentPrice,
    setupMarket.resistance,
    setupMarket.support,
    setupMarket.nextResistance,
    setupMarket.breakoutStructureLow,
    setupMarket.retestLow,
    setupMarket.rangeLow,
    setupMarket.rangeHigh,
    setupMarket.atr,
    setupMarket.tickSize,
    setupMarket.liquidityBuffer,
    setupMarket.percentageStopRate,
  ];
  if (marketValues.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError('Trade setup market inputs must be finite and non-negative.');
  }
  if (setupMarket.atr <= 0 || setupMarket.tickSize <= 0) {
    throw new RangeError('ATR and tick size must be greater than zero.');
  }
  if (setupMarket.percentageStopRate <= 0 || setupMarket.percentageStopRate >= 1) {
    throw new RangeError('Percentage stop rate must be greater than 0 and less than 1.');
  }
}

export function evaluateFinalCall(
  input: StockEvaluationInput,
  horizon: InvestmentHorizon,
  setupId: TradeSetupId = 'pullback',
): FinalCallEvaluation {
  validateTradeInputs(input);
  const weights = horizonWeights[horizon];
  const totalWeight = scoringCategories.reduce((total, category) => total + weights[category], 0);
  if (totalWeight !== 100) {
    throw new Error(`Weights for ${horizon} must total 100; received ${totalWeight}.`);
  }

  const breakdown = scoringCategories.map((category): ScoringBreakdownRow => {
    const score = input.categoryScores[category];
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new RangeError(`Score for ${category} must be between 0 and 100.`);
    }

    return {
      category,
      score,
      weight: weights[category],
      contribution: Math.round(score * weights[category]) / 100,
      evidenceVerified: input.evidenceVerifiedByCategory[category],
    };
  });

  const overallScore = Math.round(breakdown.reduce((total, row) => total + row.contribution, 0));
  const classification = classifyScore(overallScore);
  const candidateAction = actionForClassification(classification);
  const tradePlan = makeSetupTradePlan(input, horizon, setupId);
  const blockingReasons: string[] = [];
  const unverifiedCategories = breakdown
    .filter((row) => !row.evidenceVerified)
    .map((row) => row.category);

  if (!input.gates.stopLossDefined) {
    blockingReasons.push('A reasonable stop-loss level is not defined.');
  }
  if (tradePlan.selectedStopMethod === 'Unavailable') {
    blockingReasons.push('No valid stop-loss candidate is below the planned entry.');
  }
  if (!tradePlan.setupReady) {
    const unmetConditions = tradePlan.conditions
      .filter((condition) => !condition.met)
      .map((condition) => condition.label);
    blockingReasons.push(`The ${tradePlan.setup.label} setup is not confirmed: ${unmetConditions.join('; ')}.`);
  }
  if (!tradePlan.targetOneResistanceQualified) {
    blockingReasons.push('No technical resistance target provides the minimum risk/reward; reject this entry setup.');
  } else if (tradePlan.riskRewardToTargetOne < minimumRiskReward) {
    blockingReasons.push(`Risk/reward to Target 1 is below the demo minimum of 1:${minimumRiskReward}.`);
  }
  if (tradePlan.positionSizing.shares <= 0) {
    blockingReasons.push('Position sizing is zero under the configured risk, capital, allocation, or liquidity limits.');
  }
  if (!input.gates.liquidityAdequate) {
    blockingReasons.push('Liquidity is inadequate for the selected strategy.');
  }

  const extensionPercent = input.gates.extensionPercentByHorizon[horizon];
  if (extensionPercent > maximumEntryExtensionPercent) {
    blockingReasons.push(
      `Price is ${extensionPercent}% above the ideal entry, beyond the demo ${maximumEntryExtensionPercent}% limit.`,
    );
  }
  if (input.gates.majorEventRiskByHorizon[horizon]) {
    blockingReasons.push('A major event creates unacceptable risk for this strategy.');
  }
  if (!input.gates.criticalDataCurrent) {
    blockingReasons.push('Critical metrics are missing or stale.');
  }
  if (unverifiedCategories.length > 0) {
    blockingReasons.push(`Section 12 evidence is unverified for: ${unverifiedCategories.join(', ')}.`);
  }

  let decision = candidateAction;
  let decisionSummary = 'No override is active. This is a candidate rating, not an instruction to place an order.';

  if (input.gates.majorGovernanceRedFlag) {
    decision = 'AVOID';
    blockingReasons.unshift('A major accounting or governance red flag blocks the trade.');
    decisionSummary = 'A major governance override takes priority over the score.';
  } else if (blockingReasons.length > 0) {
    decision = 'WAIT';
    decisionSummary = 'The score describes stock quality; one or more trade or evidence gates block entry.';
  }

  return {
    overallScore,
    classification,
    qualityAssessment: assessmentForClassification(classification),
    candidateAction,
    decision,
    decisionSummary,
    blockingReasons,
    breakdown,
    tradePlan,
  };
}
