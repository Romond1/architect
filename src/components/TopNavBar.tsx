import {
  Award,
  BookOpen,
  Coins,
  Compass,
  FolderKanban,
  GraduationCap,
  ShoppingBag,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { ActiveTab } from '../framework/types';
import { StudioLogo } from './StudioLogo';
import styles from './TopNavBar.module.css';

interface TopNavBarProps {
  studioTitle: string;
  architectRank: string;
  walletBalance: number;
  completedCount: number;
  totalCount: number;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenCommissions: () => void;
  onOpenTeacherControls: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  equippedItemIds: string[];
  hasPendingCommissionAccept?: boolean;
}

export function TopNavBar({
  studioTitle,
  architectRank,
  walletBalance,
  completedCount,
  totalCount,
  activeTab,
  onSelectTab,
  onOpenCommissions,
  onOpenTeacherControls,
  soundEnabled,
  onToggleSound,
  reducedMotion,
  onToggleReducedMotion,
  equippedItemIds,
  hasPendingCommissionAccept = false,
}: TopNavBarProps) {
  const hasGoldPencil = equippedItemIds.includes('golden-architect-pencil');
  const hasBronzeTrophy = equippedItemIds.includes('bronze-studio-trophy');
  const hasGoldTrophy = equippedItemIds.includes('golden-architect-trophy');

  return (
    <header className={styles.navBar}>
      <div className={styles.brandCluster}>
        <StudioLogo size={38} />
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <h1 className={styles.studioTitle}>{studioTitle}</h1>
            {hasGoldPencil && (
              <span
                className={styles.ornamentChip}
                title="Equipped: Golden Architect Pencil"
                data-testid="equipped-golden-pencil"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M4 17L16 5L19 8L7 20L3 21Z"
                    fill="#e8bc5d"
                    stroke="#8a6213"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>
            )}
            {hasBronzeTrophy && (
              <span
                className={styles.ornamentChip}
                title="Equipped: Bronze Studio Trophy"
                data-testid="equipped-bronze-trophy"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M7 4H17L15 12C14 15 10 15 9 12Z"
                    fill="#cd8c52"
                    stroke="#7e4d23"
                    strokeWidth="1.6"
                  />
                  <rect x="8" y="17" width="8" height="3" rx="1" fill="#5e3d24" />
                </svg>
              </span>
            )}
            {hasGoldTrophy && (
              <span
                className={styles.ornamentChip}
                title="Equipped: Golden Architect Trophy"
                data-testid="equipped-gold-trophy"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 4H18L16 12C15 15.5 9 15.5 8 12Z"
                    fill="#e8bc5d"
                    stroke="#8a6213"
                    strokeWidth="1.6"
                  />
                  <rect x="7" y="17" width="10" height="3" rx="1" fill="#26465b" />
                </svg>
              </span>
            )}
          </div>
          <div className={styles.subCluster}>
            <span className={styles.rankBadge} data-testid="architect-rank">
              {architectRank}
            </span>
            <button
              type="button"
              className={styles.progressBtn}
              onClick={onOpenCommissions}
              data-testid="open-commissions-btn"
            >
              <FolderKanban size={14} />
              <span>
                Commissions {completedCount}/{totalCount}
              </span>
              {hasPendingCommissionAccept && (
                <span className={styles.newDot} title="New commission ready!" />
              )}
            </button>
          </div>
        </div>
      </div>

      <nav className={styles.navTabs} aria-label="Studio sections">
        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'studio' ? styles.tabActive : ''
          }`}
          onClick={() => onSelectTab('studio')}
          data-testid="nav-tab-studio"
        >
          <Compass size={16} />
          <span>Studio</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'portfolio' ? styles.tabActive : ''
          }`}
          onClick={() => onSelectTab('portfolio')}
          data-testid="nav-tab-portfolio"
        >
          <BookOpen size={16} />
          <span>Portfolio</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'achievements' ? styles.tabActive : ''
          }`}
          onClick={() => onSelectTab('achievements')}
          data-testid="nav-tab-achievements"
        >
          <Award size={16} />
          <span>Achievements</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'shop' ? styles.tabActive : ''
          }`}
          onClick={() => onSelectTab('shop')}
          data-testid="nav-tab-shop"
        >
          <ShoppingBag size={16} />
          <span>Reward Shop</span>
        </button>
      </nav>

      <div className={styles.rightCluster}>
        <div
          className={styles.walletPill}
          title="Himari's Personal Coin Balance"
          data-testid="personal-wallet-balance"
        >
          <Coins size={16} className={styles.coinIcon} />
          <div className={styles.walletText}>
            <span className={styles.walletLabel}>Personal</span>
            <strong className={styles.walletAmount}>
              {walletBalance.toLocaleString()} coins
            </strong>
          </div>
        </div>

        <button
          type="button"
          className={styles.iconBtn}
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Mute studio sounds' : 'Enable studio sounds'}
          title={soundEnabled ? 'Sound: On' : 'Sound: Off'}
        >
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>

        <button
          type="button"
          className={`${styles.iconBtn} ${
            reducedMotion ? styles.iconBtnActive : ''
          }`}
          onClick={onToggleReducedMotion}
          aria-pressed={reducedMotion}
          aria-label={
            reducedMotion ? 'Disable reduced motion' : 'Enable reduced motion'
          }
          title={reducedMotion ? 'Reduced Motion: On' : 'Animations: On'}
        >
          <Sparkles size={17} />
        </button>

        <button
          type="button"
          className={styles.teacherBtn}
          onClick={onOpenTeacherControls}
          title="Teacher Controls"
          data-testid="open-teacher-controls-btn"
        >
          <GraduationCap size={15} />
          <span>Teacher</span>
        </button>
      </div>
    </header>
  );
}
