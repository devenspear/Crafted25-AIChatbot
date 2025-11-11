/**
 * API Billing & Cost Calculation Utilities
 * Tracks token usage and estimates costs for Anthropic Claude API
 */

// Claude 3.5 Haiku Pricing (per million tokens)
// https://www.anthropic.com/pricing
export const CLAUDE_PRICING = {
  'claude-3-5-haiku-20241022': {
    input: 0.80,   // $0.80 per 1M input tokens
    output: 4.00,  // $4.00 per 1M output tokens
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.00,   // $3.00 per 1M input tokens
    output: 15.00, // $15.00 per 1M output tokens
  },
};

export interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
}

export interface BillingMetrics {
  today: CostBreakdown;
  yesterday: CostBreakdown;
  last7Days: CostBreakdown;
  last30Days: CostBreakdown;
  dailyCosts: Array<{
    date: string;
    cost: number;
    tokens: number;
  }>;
  averageDailyCost: number;
  projectedMonthlyCost: number;
  budgetStatus?: {
    monthlyBudget?: number;
    percentUsed?: number;
    daysRemaining?: number;
    projectedOverage?: number;
  };
}

/**
 * Calculate cost for token usage based on model pricing
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = 'claude-3-5-haiku-20241022'
): CostBreakdown {
  const pricing = CLAUDE_PRICING[model as keyof typeof CLAUDE_PRICING] || CLAUDE_PRICING['claude-3-5-haiku-20241022'];

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    totalCost: Number(totalCost.toFixed(6)),
    model,
  };
}

/**
 * Format cost for display (e.g., $0.0024 or $1.25)
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  } else if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

/**
 * Calculate projected monthly cost based on current usage
 */
export function calculateProjectedMonthlyCost(
  dailyCosts: number[],
  daysElapsed: number
): number {
  if (dailyCosts.length === 0 || daysElapsed === 0) return 0;

  const totalCost = dailyCosts.reduce((sum, cost) => sum + cost, 0);
  const averageDailyCost = totalCost / daysElapsed;
  const daysInMonth = 30; // Approximate

  return averageDailyCost * daysInMonth;
}

/**
 * Calculate budget status
 */
export function calculateBudgetStatus(
  currentMonthCost: number,
  monthlyBudget: number,
  daysElapsed: number
): {
  percentUsed: number;
  daysRemaining: number;
  projectedOverage: number;
  isOverBudget: boolean;
  projectedMonthlyCost: number;
} {
  const daysInMonth = 30;
  const daysRemaining = daysInMonth - daysElapsed;
  const percentUsed = (currentMonthCost / monthlyBudget) * 100;

  // Project monthly cost based on current daily average
  const averageDailyCost = daysElapsed > 0 ? currentMonthCost / daysElapsed : 0;
  const projectedMonthlyCost = averageDailyCost * daysInMonth;
  const projectedOverage = Math.max(0, projectedMonthlyCost - monthlyBudget);

  return {
    percentUsed: Number(percentUsed.toFixed(2)),
    daysRemaining,
    projectedOverage: Number(projectedOverage.toFixed(2)),
    isOverBudget: currentMonthCost > monthlyBudget,
    projectedMonthlyCost: Number(projectedMonthlyCost.toFixed(2)),
  };
}

/**
 * Get cost efficiency metrics
 */
export function getCostEfficiency(
  totalMessages: number,
  totalCost: number
): {
  costPerMessage: number;
  messagesPerDollar: number;
} {
  const costPerMessage = totalMessages > 0 ? totalCost / totalMessages : 0;
  const messagesPerDollar = totalCost > 0 ? totalMessages / totalCost : 0;

  return {
    costPerMessage: Number(costPerMessage.toFixed(4)),
    messagesPerDollar: Number(messagesPerDollar.toFixed(2)),
  };
}
