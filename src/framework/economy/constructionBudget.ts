import type { CostItem } from '../types';

export type BudgetUtilizationStatus =
  | 'not_reported'
  | 'healthy'
  | 'near_limit'
  | 'over_budget';

export interface ConstructionBudgetSummary {
  totalBudget: number;
  reportedCost: number | null;
  effectiveExpenditure: number;
  remainingBudget: number;
  utilizationPercent: number;
  isOverBudget: boolean;
  status: BudgetUtilizationStatus;
  itemizedCosts: CostItem[];
}

export function sumItemizedCosts(items?: CostItem[]): number | null {
  if (!items || items.length === 0) {
    return null;
  }
  return items.reduce((sum, item) => sum + (Number.isFinite(item.totalCost) ? item.totalCost : 0), 0);
}

/**
 * Pure calculation for the customer's construction budget.
 * Completely independent from the architect's personal coin wallet.
 */
export function calculateBudgetSummary(
  totalBudget: number,
  reportedCost: number | null,
  itemizedCosts?: CostItem[]
): ConstructionBudgetSummary {
  const safeBudget = Math.max(0, Number.isFinite(totalBudget) ? totalBudget : 0);
  const safeItems = itemizedCosts ? itemizedCosts.map((item) => ({ ...item })) : [];
  const itemSum = sumItemizedCosts(safeItems);
  const resolvedCost =
    reportedCost !== null && Number.isFinite(reportedCost)
      ? Math.max(0, reportedCost)
      : itemSum !== null
        ? Math.max(0, itemSum)
        : null;

  if (resolvedCost === null) {
    return {
      totalBudget: safeBudget,
      reportedCost: null,
      effectiveExpenditure: 0,
      remainingBudget: safeBudget,
      utilizationPercent: 0,
      isOverBudget: false,
      status: 'not_reported',
      itemizedCosts: safeItems,
    };
  }

  const remainingBudget = safeBudget - resolvedCost;
  const rawPercent = safeBudget > 0 ? (resolvedCost / safeBudget) * 100 : resolvedCost > 0 ? 100 : 0;
  const utilizationPercent = Math.round(rawPercent);
  const isOverBudget = resolvedCost > safeBudget;

  let status: BudgetUtilizationStatus = 'healthy';
  if (isOverBudget) {
    status = 'over_budget';
  } else if (rawPercent >= 85) {
    status = 'near_limit';
  }

  return {
    totalBudget: safeBudget,
    reportedCost: resolvedCost,
    effectiveExpenditure: resolvedCost,
    remainingBudget,
    utilizationPercent,
    isOverBudget,
    status,
    itemizedCosts: safeItems,
  };
}
