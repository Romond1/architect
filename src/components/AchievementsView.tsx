import { Lock, Sparkles } from 'lucide-react';
import { getVisibleAchievementList } from '../framework/rewards/achievementService';
import type { FrameworkState } from '../framework/types';
import { AchievementMedal } from './AchievementMedal';
import styles from './GalleryView.module.css';
import { MrRabbitPortrait } from './MrRabbitPortrait';

interface AchievementsViewProps {
  state: FrameworkState;
  architectRank: string;
  equippedItemIds: string[];
}

export function AchievementsView({
  state,
  architectRank,
  equippedItemIds,
}: AchievementsViewProps) {
  const list = getVisibleAchievementList(state, {
    includeSpoilersForTeacher: false,
  });
  const earnedCount = Object.keys(state.earnedAchievements).length;
  const totalEarnedEver = state.wallet.transactions
    .filter((tx) => tx.type === 'commission_payment')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className={styles.pageWrap} data-testid="achievements-view">
      {/* Architect Profile Summary */}
      <div className={styles.heroCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <MrRabbitPortrait
            expression={earnedCount >= 5 ? 'extremelyHappy' : earnedCount > 0 ? 'impressed' : 'greeting'}
            equippedItemIds={equippedItemIds}
            reducedMotion={state.preferences.reducedMotion}
            size="sm"
          />
          <div>
            <span
              style={{
                fontSize: '0.86rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--accent-terracotta)',
              }}
            >
              Architect Profile
            </span>
            <h2 className={styles.heroTitle}>{architectRank}</h2>
            <p className={styles.heroSub}>
              {earnedCount} of {list.length} studio medals earned &bull; Total
              commission earnings: {totalEarnedEver.toLocaleString()} coins &bull;
              Current personal wallet: {state.wallet.balance.toLocaleString()} coins
            </p>
          </div>
        </div>

        <div className={styles.badgeRow}>
          {equippedItemIds.length === 0 ? (
            <span className={styles.badge}>No cosmetics equipped yet</span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeGold}`}>
              <Sparkles size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              {equippedItemIds.length} cosmetic{equippedItemIds.length === 1 ? '' : 's'} equipped
            </span>
          )}
        </div>
      </div>

      {/* Achievements Medal Gallery */}
      <div className={styles.grid}>
        {list.map((item) => {
          const isUnlocked = Boolean(item.earned);
          return (
            <article
              key={item.definition.id}
              className={`${styles.card} ${isUnlocked ? styles.cardHighlighted : ''}`}
              data-testid={`achievement-card-${item.definition.id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <AchievementMedal
                  visualTheme={item.definition.visualTheme}
                  unlocked={isUnlocked}
                  revealed={item.revealed}
                  size={90}
                />
                <div>
                  <span
                    className={`${styles.badge} ${
                      isUnlocked ? styles.badgeGold : ''
                    }`}
                  >
                    {isUnlocked ? 'Unlocked' : item.revealed ? 'Ready to Earn' : 'Locked'}
                  </span>
                  <h3 style={{ fontSize: '1.24rem', marginTop: '7px' }}>
                    {item.displayTitle}
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.58 }}>
                {item.displayDescription}
              </p>

              {isUnlocked && item.earned ? (
                <div style={{ fontSize: '0.92rem', color: 'var(--accent-sage)', fontWeight: 700 }}>
                  Earned on {new Date(item.earned.unlockedAt).toLocaleDateString()}
                </div>
              ) : !item.revealed ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Lock size={14} />
                  <span>Details revealed as your studio grows</span>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
