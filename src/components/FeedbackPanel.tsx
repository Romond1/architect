import { CheckCircle2, Clock, FileCheck2, MessageSquareWarning, Sparkles } from 'lucide-react';
import type {
  CommissionConfig,
  CommissionProgressRecord,
  CommissionStatus,
  FeedbackRecord,
  SubmissionRecord,
} from '../framework/types';
import styles from './FeedbackPanel.module.css';

export const STATUS_LABELS: Record<CommissionStatus, string> = {
  awaiting_design: 'Awaiting design',
  design_submitted: 'Design submitted',
  under_review: 'Under review',
  revision_requested: 'Revision requested',
  commission_approved: 'Commission approved',
  commission_completed: 'Commission completed',
};

interface FeedbackPanelProps {
  commission: CommissionConfig;
  progress: CommissionProgressRecord;
  submission?: SubmissionRecord;
  submissionImageUrl?: string | null;
  latestFeedback?: FeedbackRecord;
  nextReadyCommission?: CommissionConfig;
  onAcceptNextCommission?: (commissionId: string) => void;
}

export function FeedbackPanel({
  commission,
  progress,
  submission,
  submissionImageUrl,
  latestFeedback,
  nextReadyCommission,
  onAcceptNextCommission,
}: FeedbackPanelProps) {
  const status = progress.status;
  const unmetIds = new Set(latestFeedback?.unmetRequirementIds ?? []);
  const unmetRequirements = commission.requirements.filter((r) =>
    unmetIds.has(r.id)
  );

  return (
    <section
      className={`${styles.panel} ${styles[`tone_${status}`] ?? ''}`}
      aria-label="Customer Feedback"
      data-testid="customer-feedback-panel"
    >
      <div className={styles.headerRow}>
        <span className={styles.eyebrow}>Customer Feedback</span>
        <span className={styles.statusChip} data-testid="feedback-status-label">
          {status === 'commission_completed' || status === 'commission_approved' ? (
            <CheckCircle2 size={14} />
          ) : status === 'revision_requested' ? (
            <MessageSquareWarning size={14} />
          ) : status === 'under_review' || status === 'design_submitted' ? (
            <FileCheck2 size={14} />
          ) : (
            <Clock size={14} />
          )}
          <span>{STATUS_LABELS[status]}</span>
        </span>
      </div>

      {status === 'awaiting_design' && !submission && (
        <p className={styles.helperText}>
          No design submitted yet for this commission. Once you build your tools and
          prepare a plan, click <strong>Deliver Design</strong> to send it to{' '}
          Mr. Rabbit.
        </p>
      )}

      {submission && (
        <div className={styles.submissionSummary}>
          {submissionImageUrl && (
            <img
              src={submissionImageUrl}
              alt={submission.projectTitle}
              className={styles.thumb}
            />
          )}
          <div className={styles.subMeta}>
            <div className={styles.subTitle}>{submission.projectTitle}</div>
            <div className={styles.subTime}>
              Submitted {new Date(submission.createdAt).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              {submission.reportedCost !== null
                ? ` • Reported cost: ${submission.reportedCost.toLocaleString()} coins`
                : ''}
            </div>
            {submission.notes && (
              <p className={styles.subNotes}>&ldquo;{submission.notes}&rdquo;</p>
            )}
          </div>
        </div>
      )}

      {status === 'design_submitted' && (
        <p className={styles.helperText}>
          Your design packet is on Mr. Rabbit&apos;s desk! Ask your teacher to review
          the submission together inside <strong>Teacher Controls</strong>.
        </p>
      )}

      {status === 'under_review' && (
        <p className={styles.helperText}>
          Mr. Rabbit and your teacher are examining your design right now against
          each requirement.
        </p>
      )}

      {status === 'revision_requested' && latestFeedback && (
        <div className={styles.feedbackBody}>
          <p className={styles.feedbackQuote}>
            &ldquo;{latestFeedback.message}&rdquo;
          </p>
          {unmetRequirements.length > 0 && (
            <div className={styles.unmetBox}>
              <div className={styles.unmetLabel}>Let&apos;s focus on:</div>
              <ul className={styles.unmetList}>
                {unmetRequirements.map((req) => (
                  <li key={req.id}>{req.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(status === 'commission_completed' || status === 'commission_approved') && (
        <div className={styles.feedbackBody}>
          <p className={styles.feedbackQuote}>
            &ldquo;{latestFeedback?.message ?? commission.successDialogue}&rdquo;
          </p>
          {nextReadyCommission && onAcceptNextCommission && (
            <button
              type="button"
              className={styles.nextBtn}
              onClick={() => onAcceptNextCommission(nextReadyCommission.id)}
              data-testid="accept-next-commission-inline"
            >
              <Sparkles size={16} />
              <span>
                Accept Commission {nextReadyCommission.order}:{' '}
                {nextReadyCommission.title}
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
