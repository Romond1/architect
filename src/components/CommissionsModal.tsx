import { CheckCircle2, FolderOpen, Lock, Mail, Sparkles, X } from 'lucide-react';
import type {
  CommissionConfig,
  CommissionProgressRecord,
} from '../framework/types';
import modalStyles from './Modal.module.css';

interface CommissionsModalProps {
  commissions: CommissionConfig[];
  progressMap: Record<string, CommissionProgressRecord>;
  activeCommissionId: string;
  onSelectActive: (commissionId: string) => void;
  onAcceptUnlocked: (commissionId: string) => void;
  onClose: () => void;
}

export function CommissionsModal({
  commissions,
  progressMap,
  activeCommissionId,
  onSelectActive,
  onAcceptUnlocked,
  onClose,
}: CommissionsModalProps) {
  const sorted = [...commissions].sort((a, b) => a.order - b.order);

  return (
    <div
      className={modalStyles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="commissions-modal-title"
      data-testid="commissions-modal"
    >
      <div className={modalStyles.dialog}>
        <div className={modalStyles.dialogHeader}>
          <div>
            <span className={modalStyles.dialogEyebrow}>Studio Roadmap</span>
            <h2 id="commissions-modal-title" className={modalStyles.dialogTitle}>
              Customer Commissions
            </h2>
          </div>
          <button
            type="button"
            className={modalStyles.closeBtn}
            onClick={onClose}
            aria-label="Close commissions roadmap"
          >
            <X size={18} />
          </button>
        </div>

        <div className={modalStyles.dialogBody}>
          {sorted.map((commission) => {
            const progress = progressMap[commission.id];
            const unlockState = progress?.unlockState ?? 'locked';
            const isCurrent = commission.id === activeCommissionId;

            if (unlockState === 'locked') {
              return (
                <div
                  key={commission.id}
                  data-testid={`commission-locked-${commission.order}`}
                  style={{
                    border: '1.5px dashed var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    background: 'var(--bg-surface-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '10px',
                        background: 'var(--bg-studio-elevated)',
                        border: '1px solid var(--border-strong)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Mail size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.06rem', color: 'var(--text-primary)' }}>
                        Sealed Commission #{commission.order}
                      </div>
                      <div style={{ fontSize: '0.96rem', color: 'var(--text-muted)' }}>
                        Sealed envelope — complete earlier commissions to discover this request.
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Lock size={15} />
                    Locked
                  </span>
                </div>
              );
            }

            if (unlockState === 'unlocked_pending_accept') {
              return (
                <div
                  key={commission.id}
                  data-testid={`commission-ready-${commission.order}`}
                  style={{
                    border: '2px solid var(--accent-terracotta)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 18px',
                    background: 'var(--accent-terracotta-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--accent-terracotta)',
                      }}
                    >
                      New Request Unlocked &bull; Commission {commission.order}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.16rem' }}>
                      {commission.title}
                    </div>
                    <div style={{ fontSize: '0.96rem', color: 'var(--text-secondary)' }}>
                      Fee: {commission.architectPayment.toLocaleString()} coins &bull; Budget:{' '}
                      {commission.constructionBudget.toLocaleString()} coins
                    </div>
                  </div>
                  <button
                    type="button"
                    className={modalStyles.primaryBtn}
                    onClick={() => {
                      onAcceptUnlocked(commission.id);
                      onClose();
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Open &amp; Accept</span>
                  </button>
                </div>
              );
            }

            const isDone = unlockState === 'completed';
            return (
              <div
                key={commission.id}
                style={{
                  border: `1.5px solid ${
                    isCurrent ? 'var(--accent-blueprint)' : 'var(--border-warm)'
                  }`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  background: isCurrent
                    ? 'var(--accent-blueprint-soft)'
                    : 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: isDone
                        ? 'var(--accent-sage-soft)'
                        : 'var(--bg-surface)',
                      color: isDone
                        ? 'var(--accent-sage)'
                        : 'var(--accent-blueprint)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isDone ? <CheckCircle2 size={20} /> : <FolderOpen size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      Commission {commission.order}: {commission.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {isDone ? 'Completed' : 'In Progress'} &bull;{' '}
                      {commission.architectPayment.toLocaleString()} coins fee
                    </div>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    type="button"
                    className={modalStyles.secondaryBtn}
                    onClick={() => {
                      onSelectActive(commission.id);
                      onClose();
                    }}
                  >
                    View in Studio
                  </button>
                )}
                {isCurrent && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--accent-blueprint)',
                    }}
                  >
                    Currently Open
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className={modalStyles.dialogFooter}>
          <button
            type="button"
            className={modalStyles.secondaryBtn}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
