import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { calculateBudgetSummary } from '../framework/economy/constructionBudget';
import type { CostItem } from '../framework/types';
import styles from './BudgetMeter.module.css';

interface BudgetMeterProps {
  customerName: string;
  totalBudget: number;
  reportedCost: number | null;
  itemizedCosts?: CostItem[];
  sourceLabel?: string;
}

export function BudgetMeter({
  customerName,
  totalBudget,
  reportedCost,
  itemizedCosts,
  sourceLabel,
}: BudgetMeterProps) {
  const [expanded, setExpanded] = useState(false);
  const summary = calculateBudgetSummary(totalBudget, reportedCost, itemizedCosts);

  const clampedPercent = Math.min(100, Math.max(0, summary.utilizationPercent));

  return (
    <section
      className={styles.meterCard}
      aria-label={`${customerName}'s Construction Budget`}
      data-testid="construction-budget-meter"
    >
      <div className={styles.headerRow}>
        <div>
          <span className={styles.eyebrow}>{customerName}&apos;s Construction Budget</span>
          <div className={styles.subNote}>
            Project material &amp; building allowance (separate from your personal coins)
          </div>
        </div>
        {sourceLabel && <span className={styles.sourceBadge}>{sourceLabel}</span>}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Available</span>
          <strong className={styles.statValue} data-testid="budget-total">
            {summary.totalBudget.toLocaleString()} coins
          </strong>
        </div>

        <div className={styles.statBox}>
          <span className={styles.statLabel}>Reported Cost</span>
          <strong className={styles.statValue} data-testid="budget-reported">
            {summary.reportedCost !== null
              ? `${summary.reportedCost.toLocaleString()} coins`
              : 'Not reported yet'}
          </strong>
        </div>

        <div className={styles.statBox}>
          <span className={styles.statLabel}>Remaining</span>
          <strong
            className={`${styles.statValue} ${
              summary.isOverBudget ? styles.overText : ''
            }`}
            data-testid="budget-remaining"
          >
            {summary.remainingBudget.toLocaleString()} coins
          </strong>
        </div>
      </div>

      <div className={styles.barWrap}>
        <div className={styles.barTrack} role="progressbar" aria-valuenow={clampedPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`${styles.barFill} ${styles[summary.status]}`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
        <span className={styles.percentLabel}>
          {summary.reportedCost !== null
            ? `${summary.utilizationPercent}% used`
            : '0% used'}
        </span>
      </div>

      {summary.isOverBudget && (
        <p className={styles.overNotice}>
          Reported construction cost exceeds {customerName}&apos;s available budget by{' '}
          {Math.abs(summary.remainingBudget).toLocaleString()} coins.
        </p>
      )}

      {summary.itemizedCosts.length > 0 && (
        <div className={styles.itemizedWrap}>
          <button
            type="button"
            className={styles.expandBtn}
            onClick={() => setExpanded((prev) => !prev)}
          >
            <span>Itemized expenses ({summary.itemizedCosts.length})</span>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {expanded && (
            <ul className={styles.itemList}>
              {summary.itemizedCosts.map((item) => (
                <li key={item.id} className={styles.itemRow}>
                  <span>{item.label}</span>
                  <span className="tabular-nums">
                    {item.totalCost.toLocaleString()} coins
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
