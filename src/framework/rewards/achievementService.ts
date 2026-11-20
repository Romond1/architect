import { ARCHITECT_RANKS, DEFAULT_STUDIO_CONFIG } from '../../config/studio';
import { INITIAL_ACHIEVEMENTS } from '../../config/rewards/achievements';
import type { AchievementDefinition, EarnedAchievement, FrameworkState } from '../types';

export interface VisibleAchievementView {
  definition: AchievementDefinition;
  earned: EarnedAchievement | null;
  revealed: boolean;
  displayTitle: string;
  displayDescription: string;
}

export function getArchitectRank(earnedCount: number): string {
  let rank: string = DEFAULT_STUDIO_CONFIG.initialRank;
  for (const step of ARCHITECT_RANKS) {
    if (earnedCount >= step.minAchievements) {
      rank = step.title;
    }
  }
  return rank;
}

/**
 * Prevents premature spoilers: an achievement's details are hidden while its
 * linked commission is still locked, unless the achievement is already earned
 * or the viewer is in teacher spoiler-preview mode.
 */
export function isAchievementRevealed(
  achievement: AchievementDefinition,
  state: Pick<FrameworkState, 'commissionProgress' | 'earnedAchievements'>
): boolean {
  if (state.earnedAchievements[achievement.id]) {
    return true;
  }
  const linkedProgress = state.commissionProgress[achievement.linkedCommissionId];
  if (!linkedProgress) {
    return false;
  }
  return linkedProgress.unlockState !== 'locked';
}

export function getVisibleAchievementList(
  state: Pick<FrameworkState, 'commissionProgress' | 'earnedAchievements'>,
  options?: { includeSpoilersForTeacher?: boolean }
): VisibleAchievementView[] {
  const showAll = Boolean(options?.includeSpoilersForTeacher);
  return INITIAL_ACHIEVEMENTS.map((definition, index) => {
    const earned = state.earnedAchievements[definition.id] ?? null;
    const revealed = showAll || isAchievementRevealed(definition, state);
    return {
      definition,
      earned,
      revealed,
      displayTitle: revealed ? definition.title : `Locked Honor #${index + 1}`,
      displayDescription: revealed ? definition.description : definition.lockedHint,
    };
  });
}
