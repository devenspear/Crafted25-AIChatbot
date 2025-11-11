/**
 * Analytics Billing Integration
 * Combines analytics events with cost calculations
 */

import { getAnalyticsEvents } from './analytics-kv';
import {
  calculateCost,
  calculateProjectedMonthlyCost,
  calculateBudgetStatus,
  getCostEfficiency,
  type BillingMetrics,
  type CostBreakdown,
} from './billing';

/**
 * Get comprehensive billing metrics from analytics data
 */
export async function getBillingMetrics(monthlyBudget?: number): Promise<BillingMetrics> {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Get events for different time periods
  const last30Days = await getAnalyticsEvents(now - 30 * oneDayMs, now);
  const last7Days = await getAnalyticsEvents(now - 7 * oneDayMs, now);
  const today = await getAnalyticsEvents(now - oneDayMs, now);
  const yesterday = await getAnalyticsEvents(now - 2 * oneDayMs, now - oneDayMs);

  // Calculate costs for each period
  const todayCost = calculatePeriodCost(today);
  const yesterdayCost = calculatePeriodCost(yesterday);
  const last7DaysCost = calculatePeriodCost(last7Days);
  const last30DaysCost = calculatePeriodCost(last30Days);

  // Calculate daily breakdown for the last 30 days
  const dailyCosts = calculateDailyCosts(last30Days, 30);

  // Calculate average and projections
  const averageDailyCost = dailyCosts.length > 0
    ? dailyCosts.reduce((sum, day) => sum + day.cost, 0) / dailyCosts.length
    : 0;

  const projectedMonthlyCost = calculateProjectedMonthlyCost(
    dailyCosts.map(d => d.cost),
    dailyCosts.length
  );

  // Calculate budget status if budget is provided
  let budgetStatus;
  if (monthlyBudget && monthlyBudget > 0) {
    const currentDate = new Date();
    const daysElapsed = currentDate.getDate();
    const currentMonthCost = last30DaysCost.totalCost;

    const status = calculateBudgetStatus(currentMonthCost, monthlyBudget, daysElapsed);
    budgetStatus = {
      monthlyBudget,
      percentUsed: status.percentUsed,
      daysRemaining: status.daysRemaining,
      projectedOverage: status.projectedOverage,
    };
  }

  return {
    today: todayCost,
    yesterday: yesterdayCost,
    last7Days: last7DaysCost,
    last30Days: last30DaysCost,
    dailyCosts,
    averageDailyCost: Number(averageDailyCost.toFixed(4)),
    projectedMonthlyCost: Number(projectedMonthlyCost.toFixed(2)),
    budgetStatus,
  };
}

/**
 * Calculate total cost for a period of events
 */
function calculatePeriodCost(events: Array<{ eventType: string; tokensUsed?: { input: number; output: number }; modelUsed?: string }>): CostBreakdown {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let model = 'claude-3-5-haiku-20241022';

  events.forEach(event => {
    if (event.eventType === 'chat_response' && event.tokensUsed) {
      totalInputTokens += event.tokensUsed.input;
      totalOutputTokens += event.tokensUsed.output;
      if (event.modelUsed) {
        model = event.modelUsed;
      }
    }
  });

  return calculateCost(totalInputTokens, totalOutputTokens, model);
}

/**
 * Calculate daily costs for a given period
 */
function calculateDailyCosts(
  events: Array<{ timestamp: number; eventType: string; tokensUsed?: { input: number; output: number }; modelUsed?: string }>,
  days: number
): Array<{ date: string; cost: number; tokens: number }> {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const dailyData: Record<string, { inputTokens: number; outputTokens: number; model: string }> = {};

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date(now - i * oneDayMs);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = {
      inputTokens: 0,
      outputTokens: 0,
      model: 'claude-3-5-haiku-20241022',
    };
  }

  // Aggregate events by day
  events.forEach(event => {
    if (event.eventType === 'chat_response' && event.tokensUsed) {
      const date = new Date(event.timestamp);
      const dateStr = date.toISOString().split('T')[0];

      if (dailyData[dateStr]) {
        dailyData[dateStr].inputTokens += event.tokensUsed.input;
        dailyData[dateStr].outputTokens += event.tokensUsed.output;
        if (event.modelUsed) {
          dailyData[dateStr].model = event.modelUsed;
        }
      }
    }
  });

  // Calculate costs for each day
  return Object.entries(dailyData)
    .map(([date, data]) => {
      const cost = calculateCost(data.inputTokens, data.outputTokens, data.model);
      return {
        date,
        cost: cost.totalCost,
        tokens: cost.totalTokens,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get cost efficiency metrics for a time period
 */
export async function getCostEfficiencyMetrics(days: number = 30) {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const events = await getAnalyticsEvents(now - days * oneDayMs, now);
  const totalMessages = events.filter(e => e.eventType === 'chat_request').length;
  const costBreakdown = calculatePeriodCost(events);

  return {
    ...getCostEfficiency(totalMessages, costBreakdown.totalCost),
    totalMessages,
    totalCost: costBreakdown.totalCost,
    totalTokens: costBreakdown.totalTokens,
  };
}
