import { CheckCircle2, Coins, Send, Trophy } from 'lucide-react';
import { ACHIEVEMENTS_BY_ID } from '../config/rewards/achievements';
import {
  getCustomerProfile,
  resolveCustomerDialogue,
  resolveRabbitExpression,
} from '../framework/customers/customerState';
import type {
  CommissionConfig,
  CommissionProgressRecord,
  FeedbackRecord,
  SubmissionRecord,
} from '../framework/types';
import type { WorkspaceDeliverableStatus } from '../workspace/integration';
import { BudgetMeter } from './BudgetMeter';
import styles from './CustomerPanel.module.css';
import { FeedbackPanel, STATUS_LABELS } from './FeedbackPanel';
import { MrRabbitPortrait } from './MrRabbitPortrait';
import { SpeechBubble } from './SpeechBubble';

interface CustomerPanelProps {
  commission: CommissionConfig;
  progress: CommissionProgressRecord;
  submission?: SubmissionRecord;
  submissionImageUrl?: string | null;
  latestFeedback?: FeedbackRecord;
  equippedItemIds: string[];
  reducedMotion: boolean;
  workspaceStatus: WorkspaceDeliverableStatus;
  nextReadyCommission?: CommissionConfig;
  onOpenDelivery: () => void;
  onAcceptNextCommission: (commissionId: string) => void;
}

export function CustomerPanel({
  commission,
  progress,
  submission,
  submissionImageUrl,
  latestFeedback,
  equippedItemIds,
  reducedMotion,
  workspaceStatus,
  nextReadyCommission,
  onOpenDelivery,
  onAcceptNextCommission,
}: CustomerPanelProps) {
  const customer = getCustomerProfile(commission.customerId);
  const expression = resolveRabbitExpression(
    commission,
    progress,
    latestFeedback,
    workspaceStatus.hasDeliverable
  );
  const dialogue = resolveCustomerDialogue(commission, progress, latestFeedback);
  const unmetSet = new Set(latestFeedback?.unmetRequirementIds ?? []);
  const achievement = commission.achievementId
    ? ACHIEVEMENTS_BY_ID[commission.achievementId]
    : undefined;

  const effectiveReportedCost =
    workspaceStatus.estimatedCost ?? submission?.reportedCost ?? null;
  const effectiveItemized =
    workspaceStatus.itemizedCosts && workspaceStatus.itemizedCosts.length > 0
      ? workspaceStatus.itemizedCosts
      : submission?.itemizedCosts;
  const costSourceLabel =
    workspaceStatus.estimatedCost !== null
      ? 'From workspace'
      : submission?.reportedCost !== null && submission?.reportedCost !== undefined
        ? 'From submission'
        : undefined;

  const bubbleTone =
    progress.status === 'revision_requested'
      ? 'revision'
      : progress.status === 'commission_completed' ||
          progress.status === 'commission_approved'
        ? 'celebration'
        : 'default';

  const isCompleted = progress.status === 'commission_completed';

  return (
    <aside className={styles.panel} aria-label="Customer Brief and Delivery">
      {/* Customer Header & Portrait */}
      <div className={styles.customerHero}>
        <MrRabbitPortrait
          expression={expression}
          equippedItemIds={equippedItemIds}
          reducedMotion={reducedMotion}
          size="md"
        />
        <div className={styles.customerMeta}>
          <div className={styles.customerNameRow}>
            <h2 className={styles.customerName}>{customer.name}</h2>
            <span className={styles.commissionPill}>
              Commission {commission.order}
            </span>
          </div>
          <p className={styles.customerSubtitle}>{customer.subtitle}</p>
          <div className={styles.traitsList}>
            {customer.personalityTraits.slice(0, 4).map((trait) => (
              <span key={trait} className={styles.traitChip}>
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dialogue Speech Bubble */}
      <SpeechBubble
        speaker={customer.name}
        text={dialogue}
        reducedMotion={reducedMotion}
        tone={bubbleTone}
      />

      {/* Current Commission Card */}
      <section className={styles.commissionCard} aria-label="Current Commission">
        <div className={styles.commissionHeader}>
          <div>
            <span className={styles.eyebrow}>Active Commission</span>
            <h3 className={styles.commissionTitle} data-testid="active-commission-title">
              {commission.title}
            </h3>
          </div>
          <span
            className={`${styles.statusPill} ${styles[`status_${progress.status}`]}`}
            data-testid="commission-status-badge"
          >
            {STATUS_LABELS[progress.status]}
          </span>
        </div>

        {/* Dimensions strip if any */}
        {commission.dimensions.length > 0 && (
          <div className={styles.dimensionsRow}>
            {commission.dimensions.map((dim) => (
              <div key={dim.id} className={styles.dimChip}>
                <span className={styles.dimLabel}>{dim.label}:</span>{' '}
                <strong>{dim.value}</strong>
              </div>
            ))}
          </div>
        )}

        {/* Explicit Architectural Requirements */}
        <div>
          <div className={styles.reqHeading}>Architectural Requirements</div>
          <ul className={styles.reqList} data-testid="commission-requirements-list">
            {commission.requirements.map((req) => {
              const needsAttention =
                progress.status === 'revision_requested' && unmetSet.has(req.id);
              return (
                <li
                  key={req.id}
                  className={`${styles.reqItem} ${
                    needsAttention ? styles.reqFlagged : ''
                  }`}
                >
                  <span className={styles.reqBullet} aria-hidden="true">
                    {isCompleted ? <CheckCircle2 size={15} /> : '•'}
                  </span>
                  <span>{req.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Offered Payment & Achievement */}
        <div className={styles.offerRow}>
          <div className={styles.offerItem}>
            <Coins size={16} className={styles.goldIcon} />
            <div>
              <span className={styles.offerLabel}>Architect Fee</span>
              <strong className={styles.offerValue} data-testid="commission-payment-offer">
                {commission.architectPayment.toLocaleString()} coins
              </strong>
            </div>
          </div>
          {achievement && (
            <div className={styles.offerItem}>
              <Trophy size={16} className={styles.terracottaIcon} />
              <div>
                <span className={styles.offerLabel}>Honor Offered</span>
                <strong className={styles.offerValue}>{achievement.title}</strong>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Customer Construction Budget */}
      <BudgetMeter
        customerName={customer.name}
        totalBudget={commission.constructionBudget}
        reportedCost={effectiveReportedCost}
        itemizedCosts={effectiveItemized}
        sourceLabel={costSourceLabel}
      />

      {/* Primary Delivery CTA */}
      <div className={styles.deliveryCtaWrap}>
        <button
          type="button"
          className={styles.deliverBtn}
          onClick={onOpenDelivery}
          data-testid="deliver-design-btn"
        >
          <Send size={17} />
          <span>
            {progress.status === 'revision_requested'
              ? 'Deliver Revised Design'
              : progress.status === 'design_submitted' ||
                  progress.status === 'under_review'
                ? 'Update Delivered Design'
                : 'Deliver Design'}
          </span>
        </button>
      </div>

      {/* Customer Feedback Panel */}
      <FeedbackPanel
        commission={commission}
        progress={progress}
        submission={submission}
        submissionImageUrl={submissionImageUrl}
        latestFeedback={latestFeedback}
        nextReadyCommission={nextReadyCommission}
        onAcceptNextCommission={onAcceptNextCommission}
      />
    </aside>
  );
}
