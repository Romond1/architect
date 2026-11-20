import { ACHIEVEMENTS_BY_ID } from '../../config/rewards/achievements';
import { getNextSequentialCommission } from '../commissions/commissionService';
import { getCustomerProfile } from '../customers/customerState';
import { creditWallet } from '../economy/personalWallet';
import { getArchitectRank } from '../rewards/achievementService';
import type {
  CelebrationPayload,
  CostItem,
  FeedbackRecord,
  FrameworkState,
  PortfolioEntry,
  RabbitExpression,
  SubmissionRecord,
} from '../types';
import { createUniqueId } from '../utils/id';

export interface CreateSubmissionInput {
  commissionId: string;
  projectTitle: string;
  notes: string;
  reportedCost: number | null;
  itemizedCosts?: CostItem[];
  imageArtifactId: string;
  projectData?: unknown;
  source: 'manual' | 'workspace';
  timestamp?: string;
}

export function createSubmission(
  state: FrameworkState,
  input: CreateSubmissionInput
): { state: FrameworkState; submissionId: string | null } {
  const commission = state.commissions.find((c) => c.id === input.commissionId);
  const progress = state.commissionProgress[input.commissionId];
  if (!commission || !progress || progress.unlockState === 'locked') {
    return { state, submissionId: null };
  }

  const now = input.timestamp ?? new Date().toISOString();
  const submissionId = createUniqueId('sub');
  const submission: SubmissionRecord = {
    id: submissionId,
    commissionId: commission.id,
    createdAt: now,
    projectTitle: input.projectTitle.trim() || `${commission.title} Draft`,
    notes: input.notes.trim(),
    reportedCost:
      input.reportedCost !== null && Number.isFinite(input.reportedCost)
        ? Math.max(0, Math.round(input.reportedCost))
        : null,
    itemizedCosts: input.itemizedCosts?.map((item) => ({ ...item })),
    imageArtifactId: input.imageArtifactId,
    projectData: input.projectData,
    source: input.source,
    status: 'submitted',
  };

  return {
    submissionId,
    state: {
      ...state,
      submissions: {
        ...state.submissions,
        [submissionId]: submission,
      },
      commissionProgress: {
        ...state.commissionProgress,
        [commission.id]: {
          ...progress,
          unlockState:
            progress.unlockState === 'unlocked_pending_accept'
              ? 'active'
              : progress.unlockState,
          status: 'design_submitted',
          activeSubmissionId: submissionId,
        },
      },
    },
  };
}

export function markSubmissionUnderReview(
  state: FrameworkState,
  commissionId: string,
  submissionId?: string
): FrameworkState {
  const progress = state.commissionProgress[commissionId];
  if (!progress) {
    return state;
  }
  const targetSubId = submissionId ?? progress.activeSubmissionId;
  if (!targetSubId || !state.submissions[targetSubId]) {
    return state;
  }

  return {
    ...state,
    submissions: {
      ...state.submissions,
      [targetSubId]: {
        ...state.submissions[targetSubId],
        status: 'under_review',
      },
    },
    commissionProgress: {
      ...state.commissionProgress,
      [commissionId]: {
        ...progress,
        status: 'under_review',
      },
    },
  };
}

export interface RequestRevisionInput {
  commissionId: string;
  submissionId?: string;
  message: string;
  expression?: RabbitExpression;
  unmetRequirementIds?: string[];
  isCustom?: boolean;
  timestamp?: string;
}

export function requestSubmissionRevision(
  state: FrameworkState,
  input: RequestRevisionInput
): FrameworkState {
  const progress = state.commissionProgress[input.commissionId];
  if (!progress) {
    return state;
  }
  const targetSubId = input.submissionId ?? progress.activeSubmissionId;
  if (!targetSubId || !state.submissions[targetSubId]) {
    return state;
  }

  const now = input.timestamp ?? new Date().toISOString();
  const feedbackId = createUniqueId('fb');
  const feedback: FeedbackRecord = {
    id: feedbackId,
    commissionId: input.commissionId,
    submissionId: targetSubId,
    createdAt: now,
    status: 'revision_requested',
    message:
      input.message.trim() ||
      "Let's refine a few details together before we finalize this design!",
    expression: input.expression ?? 'concerned',
    unmetRequirementIds: input.unmetRequirementIds
      ? [...input.unmetRequirementIds]
      : [],
    isCustom: Boolean(input.isCustom),
  };

  return {
    ...state,
    submissions: {
      ...state.submissions,
      [targetSubId]: {
        ...state.submissions[targetSubId],
        status: 'revision_requested',
      },
    },
    feedbackHistory: {
      ...state.feedbackHistory,
      [feedbackId]: feedback,
    },
    commissionProgress: {
      ...state.commissionProgress,
      [input.commissionId]: {
        ...progress,
        status: 'revision_requested',
        latestFeedbackId: feedbackId,
      },
    },
  };
}

export interface ApproveSubmissionInput {
  commissionId: string;
  submissionId?: string;
  feedbackMessage?: string;
  expression?: RabbitExpression;
  isCustomFeedback?: boolean;
  timestamp?: string;
}

export function approveCommissionSubmission(
  state: FrameworkState,
  input: ApproveSubmissionInput
): FrameworkState {
  const commission = state.commissions.find((c) => c.id === input.commissionId);
  const progress = state.commissionProgress[input.commissionId];
  if (!commission || !progress) {
    return state;
  }

  const targetSubId = input.submissionId ?? progress.activeSubmissionId;
  const submission = targetSubId ? state.submissions[targetSubId] : undefined;
  if (!submission) {
    return state;
  }

  // Idempotency guard: if this exact submission was already approved and the
  // commission is already completed, do not award coins or duplicate portfolio entries.
  if (
    submission.status === 'approved' &&
    progress.status === 'commission_completed' &&
    progress.paymentAwarded
  ) {
    return state;
  }

  const now = input.timestamp ?? new Date().toISOString();
  const customer = getCustomerProfile(commission.customerId);
  const dialogue =
    input.feedbackMessage && input.feedbackMessage.trim().length > 0
      ? input.feedbackMessage.trim()
      : commission.successDialogue;
  const expression: RabbitExpression =
    input.expression ?? (commission.isGrandFinale ? 'extremelyHappy' : 'celebrating');

  const feedbackId = createUniqueId('fb');
  const approvalFeedback: FeedbackRecord = {
    id: feedbackId,
    commissionId: commission.id,
    submissionId: submission.id,
    createdAt: now,
    status: 'commission_completed',
    message: dialogue,
    expression,
    isCustom: Boolean(input.isCustomFeedback),
  };

  // 1. Personal Wallet Payment (strictly idempotent per commission)
  let nextWallet = state.wallet;
  let coinsEarnedNow = 0;
  const paymentAlreadyAwarded = progress.paymentAwarded;
  if (!paymentAlreadyAwarded && commission.architectPayment > 0) {
    const creditResult = creditWallet(
      nextWallet,
      commission.architectPayment,
      `Commission ${commission.order} completed: ${commission.title}`,
      {
        type: 'commission_payment',
        relatedCommissionId: commission.id,
        timestamp: now,
      }
    );
    if (creditResult.ok) {
      nextWallet = creditResult.wallet;
      coinsEarnedNow = commission.architectPayment;
    }
  }

  // 2. Achievement Unlock (strictly idempotent)
  const nextAchievements = { ...state.earnedAchievements };
  const achievementDef = commission.achievementId
    ? ACHIEVEMENTS_BY_ID[commission.achievementId]
    : undefined;
  let unlockedAchievementId: string | undefined;

  if (
    achievementDef &&
    !progress.achievementAwarded &&
    !nextAchievements[achievementDef.id]
  ) {
    nextAchievements[achievementDef.id] = {
      achievementId: achievementDef.id,
      unlockedAt: now,
      commissionId: commission.id,
    };
    unlockedAchievementId = achievementDef.id;
  }

  const newRank = getArchitectRank(Object.keys(nextAchievements).length);

  // 3. Immutable Portfolio Snapshot
  const portfolioEntry: PortfolioEntry = {
    id: createUniqueId('pf'),
    commissionId: commission.id,
    commissionOrder: commission.order,
    commissionTitle: commission.title,
    customerName: customer.name,
    completedAt: now,
    projectTitle: submission.projectTitle,
    studentNotes: submission.notes,
    imageArtifactId: submission.imageArtifactId,
    requirementsSnapshot: commission.requirements.map((r) => ({ ...r })),
    dimensionsSnapshot: commission.dimensions.map((d) => ({ ...d })),
    constructionBudgetSnapshot: commission.constructionBudget,
    reportedCostSnapshot: submission.reportedCost,
    itemizedCostsSnapshot: submission.itemizedCosts?.map((c) => ({ ...c })),
    customerFeedback: dialogue,
    paymentReceived: paymentAlreadyAwarded ? 0 : commission.architectPayment,
    achievementId: achievementDef?.id,
    achievementTitle: achievementDef?.title,
  };

  // Replace only if this commission was previously completed & reopened by teacher;
  // earlier commissions' snapshots remain completely untouched.
  const existingEntryIdx = state.portfolio.findIndex(
    (entry) => entry.commissionId === commission.id
  );
  const nextPortfolio = [...state.portfolio];
  if (existingEntryIdx >= 0) {
    const previousPaid = nextPortfolio[existingEntryIdx].paymentReceived;
    nextPortfolio[existingEntryIdx] = {
      ...portfolioEntry,
      paymentReceived: Math.max(previousPaid, portfolioEntry.paymentReceived),
    };
  } else {
    nextPortfolio.push(portfolioEntry);
    nextPortfolio.sort((a, b) => a.commissionOrder - b.commissionOrder);
  }

  // 4. Unlock Next Commission as 'unlocked_pending_accept' without auto-advancing
  const nextCommission = getNextSequentialCommission(state, commission.id);
  const nextCommissionProgressMap = {
    ...state.commissionProgress,
    [commission.id]: {
      ...progress,
      unlockState: 'completed' as const,
      status: 'commission_completed' as const,
      paymentAwarded: true,
      achievementAwarded: progress.achievementAwarded || Boolean(achievementDef),
      completedAt: progress.completedAt ?? now,
      latestFeedbackId: feedbackId,
    },
  };

  if (
    nextCommission &&
    nextCommissionProgressMap[nextCommission.id]?.unlockState === 'locked'
  ) {
    nextCommissionProgressMap[nextCommission.id] = {
      ...nextCommissionProgressMap[nextCommission.id],
      unlockState: 'unlocked_pending_accept',
    };
  }

  // 5. Celebration Payload
  const celebration: CelebrationPayload = {
    commissionId: commission.id,
    commissionTitle: commission.title,
    customerName: customer.name,
    dialogue,
    expression,
    coinsEarned: coinsEarnedNow,
    paymentAlreadyAwarded,
    achievementId: unlockedAchievementId ?? achievementDef?.id,
    newRank,
    submissionId: submission.id,
    imageArtifactId: submission.imageArtifactId,
    projectTitle: submission.projectTitle,
    reportedCost: submission.reportedCost,
    constructionBudget: commission.constructionBudget,
    nextCommissionId:
      nextCommission &&
      nextCommissionProgressMap[nextCommission.id]?.unlockState ===
        'unlocked_pending_accept'
        ? nextCommission.id
        : undefined,
    isGrandFinale: Boolean(commission.isGrandFinale),
  };

  return {
    ...state,
    submissions: {
      ...state.submissions,
      [submission.id]: {
        ...submission,
        status: 'approved',
      },
    },
    feedbackHistory: {
      ...state.feedbackHistory,
      [feedbackId]: approvalFeedback,
    },
    wallet: nextWallet,
    earnedAchievements: nextAchievements,
    portfolio: nextPortfolio,
    commissionProgress: nextCommissionProgressMap,
    activeCelebration: celebration,
  };
}
