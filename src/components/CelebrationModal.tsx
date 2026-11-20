import { Award, Coins, Sparkles, X } from 'lucide-react';
import { ACHIEVEMENTS_BY_ID } from '../config/rewards/achievements';
import type { CelebrationPayload, CommissionConfig } from '../framework/types';
import { AchievementMedal } from './AchievementMedal';
import { ConfettiOverlay } from './ConfettiOverlay';
import modalStyles from './Modal.module.css';
import { MrRabbitPortrait } from './MrRabbitPortrait';

interface CelebrationModalProps {
  celebration: CelebrationPayload;
  nextCommission?: CommissionConfig;
  submissionImageUrl?: string | null;
  equippedItemIds: string[];
  reducedMotion: boolean;
  onDismiss: () => void;
  onAcceptNext: (commissionId: string) => void;
}

export function CelebrationModal({
  celebration,
  nextCommission,
  submissionImageUrl,
  equippedItemIds,
  reducedMotion,
  onDismiss,
  onAcceptNext,
}: CelebrationModalProps) {
  const achievement = celebration.achievementId
    ? ACHIEVEMENTS_BY_ID[celebration.achievementId]
    : undefined;

  return (
    <>
      <ConfettiOverlay
        reducedMotion={reducedMotion}
        isGrandFinale={celebration.isGrandFinale}
      />

      <div
        className={modalStyles.backdrop}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        data-testid="celebration-modal"
      >
        <div
          className={`${modalStyles.dialog} ${
            celebration.isGrandFinale ? modalStyles.dialogWide : ''
          }`}
          style={{
            borderColor: celebration.isGrandFinale
              ? 'var(--accent-gold)'
              : 'var(--border-strong)',
          }}
        >
          <div className={modalStyles.dialogHeader}>
            <div>
              <span className={modalStyles.dialogEyebrow}>
                {celebration.isGrandFinale
                  ? 'Grand Studio Milestone Achieved!'
                  : 'Commission Approved!'}
              </span>
              <h2 id="celebration-title" className={modalStyles.dialogTitle}>
                {celebration.isGrandFinale
                  ? 'Master Architect & Studio Creator!'
                  : `${celebration.commissionTitle} Completed!`}
              </h2>
            </div>
            <button
              type="button"
              className={modalStyles.closeBtn}
              onClick={onDismiss}
              aria-label="Close celebration"
            >
              <X size={18} />
            </button>
          </div>

          <div className={modalStyles.dialogBody}>
            {/* Mr. Rabbit Celebration Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                flexWrap: 'wrap',
                background: 'var(--bg-surface-muted)',
                border: '1.5px solid var(--border-warm)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <MrRabbitPortrait
                expression={celebration.expression}
                equippedItemIds={equippedItemIds}
                reducedMotion={reducedMotion}
                size="md"
              />
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: 'var(--accent-terracotta)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                  }}
                >
                  {celebration.customerName} is delighted:
                </div>
                <p
                  style={{
                    fontSize: '1.14rem',
                    lineHeight: 1.58,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  &ldquo;{celebration.dialogue}&rdquo;
                </p>
                {celebration.isGrandFinale && (
                  <p
                    style={{
                      marginTop: '10px',
                      fontSize: '1rem',
                      color: 'var(--accent-sage)',
                      fontWeight: 700,
                    }}
                  >
                    You designed Mr. Rabbit&apos;s home AND built the software tools
                    inside your own architecture studio from scratch!
                  </p>
                )}
              </div>
            </div>

            {/* Earned Rewards Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
              }}
            >
              <div
                style={{
                  background: 'var(--accent-gold-soft)',
                  border: '1.5px solid var(--accent-gold-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '13px',
                }}
              >
                <Coins size={30} color="var(--accent-gold)" />
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Personal Earnings
                  </div>
                  <strong style={{ fontSize: '1.26rem' }}>
                    {celebration.paymentAlreadyAwarded
                      ? 'Already awarded'
                      : `+${celebration.coinsEarned.toLocaleString()} coins`}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--accent-blueprint-soft)',
                  border: '1.5px solid var(--border-blueprint)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '13px',
                }}
              >
                <Award size={30} color="var(--accent-blueprint)" />
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Studio Rank
                  </div>
                  <strong style={{ fontSize: '1.16rem' }}>{celebration.newRank}</strong>
                </div>
              </div>
            </div>

            {/* Achievement Medal + Accepted Design Preview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px',
              }}
            >
              {achievement && (
                <div
                  style={{
                    border: '1.5px solid var(--border-warm)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <AchievementMedal
                    visualTheme={achievement.visualTheme}
                    unlocked
                    revealed
                    size={82}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--accent-gold)',
                      }}
                    >
                      Achievement Unlocked
                    </div>
                    <strong style={{ fontSize: '1.16rem' }}>{achievement.title}</strong>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                      {achievement.description}
                    </p>
                  </div>
                </div>
              )}

              <div
                style={{
                  border: '1.5px solid var(--border-blueprint)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-blueprint)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-blueprint)' }}>
                  Saved to Portfolio: {celebration.projectTitle}
                </div>
                {submissionImageUrl && (
                  <img
                    src={submissionImageUrl}
                    alt={celebration.projectTitle}
                    style={{
                      maxHeight: '140px',
                      width: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className={modalStyles.dialogFooter}>
            <button
              type="button"
              className={modalStyles.secondaryBtn}
              onClick={onDismiss}
              data-testid="celebration-keep-exploring"
            >
              Keep Celebrating Here
            </button>
            {nextCommission && (
              <button
                type="button"
                className={modalStyles.primaryBtn}
                onClick={() => onAcceptNext(nextCommission.id)}
                data-testid="celebration-accept-next"
              >
                <Sparkles size={16} />
                <span>
                  Accept Commission {nextCommission.order}: {nextCommission.title}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
