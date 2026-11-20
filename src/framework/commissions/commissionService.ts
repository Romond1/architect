import { INITIAL_COMMISSIONS } from '../../config/commissions/initialCommissions';
import { DEFAULT_STUDIO_CONFIG } from '../../config/studio';
import { createInitialWallet } from '../economy/personalWallet';
import type {
  CommissionConfig,
  CommissionDimension,
  CommissionProgressRecord,
  CommissionRequirement,
  FrameworkState,
  RabbitExpression,
} from '../types';
import { createUniqueId } from '../utils/id';

export const FRAMEWORK_SCHEMA_VERSION = 1;

function cloneCommission(c: CommissionConfig): CommissionConfig {
  return {
    ...c,
    dimensions: c.dimensions.map((d) => ({ ...d })),
    requirements: c.requirements.map((r) => ({ ...r })),
  };
}

export function createInitialCommissionProgress(
  commissions: CommissionConfig[]
): Record<string, CommissionProgressRecord> {
  const progress: Record<string, CommissionProgressRecord> = {};
  const sorted = [...commissions].sort((a, b) => a.order - b.order);
  sorted.forEach((commission, index) => {
    progress[commission.id] = {
      commissionId: commission.id,
      unlockState: index === 0 ? 'active' : 'locked',
      status: 'awaiting_design',
      paymentAwarded: false,
      achievementAwarded: false,
      acceptedAt: index === 0 ? new Date().toISOString() : undefined,
    };
  });
  return progress;
}

export function createInitialFrameworkState(): FrameworkState {
  const commissions = INITIAL_COMMISSIONS.map(cloneCommission);
  return {
    schemaVersion: FRAMEWORK_SCHEMA_VERSION,
    preferences: {
      soundEnabled: true,
      reducedMotion: false,
      studioTitle: DEFAULT_STUDIO_CONFIG.studioTitle,
    },
    activeCommissionId: commissions[0].id,
    commissions,
    commissionProgress: createInitialCommissionProgress(commissions),
    submissions: {},
    feedbackHistory: {},
    wallet: createInitialWallet(),
    inventory: {
      ownedItemIds: [],
      equippedSlots: {},
    },
    earnedAchievements: {},
    portfolio: [],
    activeCelebration: null,
  };
}

export function getSortedCommissions(state: FrameworkState): CommissionConfig[] {
  return [...state.commissions].sort((a, b) => a.order - b.order);
}

export function getNextSequentialCommission(
  state: FrameworkState,
  currentCommissionId: string
): CommissionConfig | undefined {
  const sorted = getSortedCommissions(state);
  const idx = sorted.findIndex((c) => c.id === currentCommissionId);
  if (idx === -1 || idx + 1 >= sorted.length) {
    return undefined;
  }
  return sorted[idx + 1];
}

export function getReadyToAcceptCommission(
  state: FrameworkState
): CommissionConfig | undefined {
  const sorted = getSortedCommissions(state);
  return sorted.find(
    (c) => state.commissionProgress[c.id]?.unlockState === 'unlocked_pending_accept'
  );
}

export function acceptUnlockedCommission(
  state: FrameworkState,
  commissionId: string,
  timestamp?: string
): FrameworkState {
  const progress = state.commissionProgress[commissionId];
  if (!progress) {
    return state;
  }
  if (
    progress.unlockState !== 'unlocked_pending_accept' &&
    progress.unlockState !== 'active'
  ) {
    return state;
  }

  return {
    ...state,
    activeCommissionId: commissionId,
    activeCelebration: null,
    commissionProgress: {
      ...state.commissionProgress,
      [commissionId]: {
        ...progress,
        unlockState: 'active',
        acceptedAt: progress.acceptedAt ?? timestamp ?? new Date().toISOString(),
      },
    },
  };
}

export function manuallyUnlockCommission(
  state: FrameworkState,
  commissionId: string,
  activateImmediately = false
): FrameworkState {
  const progress = state.commissionProgress[commissionId];
  if (!progress) {
    return state;
  }
  const nextUnlockState =
    progress.unlockState === 'locked'
      ? activateImmediately
        ? 'active'
        : 'unlocked_pending_accept'
      : progress.unlockState;

  return {
    ...state,
    activeCommissionId: activateImmediately ? commissionId : state.activeCommissionId,
    commissionProgress: {
      ...state.commissionProgress,
      [commissionId]: {
        ...progress,
        unlockState: nextUnlockState,
        acceptedAt:
          activateImmediately && !progress.acceptedAt
            ? new Date().toISOString()
            : progress.acceptedAt,
      },
    },
  };
}

export function reopenCommission(
  state: FrameworkState,
  commissionId: string
): FrameworkState {
  const progress = state.commissionProgress[commissionId];
  if (!progress) {
    return state;
  }

  return {
    ...state,
    activeCommissionId: commissionId,
    activeCelebration: null,
    commissionProgress: {
      ...state.commissionProgress,
      [commissionId]: {
        ...progress,
        unlockState: 'active',
        status: 'awaiting_design',
        // Preserve paymentAwarded and achievementAwarded to guarantee idempotency!
      },
    },
  };
}

export function switchActiveCommission(
  state: FrameworkState,
  commissionId: string
): FrameworkState {
  const progress = state.commissionProgress[commissionId];
  if (!progress || progress.unlockState === 'locked') {
    return state;
  }
  if (progress.unlockState === 'unlocked_pending_accept') {
    return acceptUnlockedCommission(state, commissionId);
  }
  return {
    ...state,
    activeCommissionId: commissionId,
  };
}

export function updateCommissionConfig(
  state: FrameworkState,
  commissionId: string,
  patch: Partial<
    Pick<
      CommissionConfig,
      | 'title'
      | 'customerDialogue'
      | 'successDialogue'
      | 'initialExpression'
      | 'constructionBudget'
      | 'architectPayment'
      | 'requirements'
      | 'dimensions'
    >
  >
): FrameworkState {
  const exists = state.commissions.some((c) => c.id === commissionId);
  if (!exists) {
    return state;
  }

  return {
    ...state,
    commissions: state.commissions.map((commission) => {
      if (commission.id !== commissionId) {
        return commission;
      }
      return {
        ...commission,
        ...patch,
        constructionBudget:
          patch.constructionBudget !== undefined
            ? Math.max(0, Math.round(patch.constructionBudget))
            : commission.constructionBudget,
        architectPayment:
          patch.architectPayment !== undefined
            ? Math.max(0, Math.round(patch.architectPayment))
            : commission.architectPayment,
        requirements: patch.requirements
          ? patch.requirements.map((r) => ({ ...r }))
          : commission.requirements,
        dimensions: patch.dimensions
          ? patch.dimensions.map((d) => ({ ...d }))
          : commission.dimensions,
      };
    }),
  };
}

export interface NewCommissionInput {
  title: string;
  customerDialogue: string;
  successDialogue: string;
  initialExpression?: RabbitExpression;
  requirements: Array<string | CommissionRequirement>;
  dimensions: CommissionDimension[];
  constructionBudget: number;
  architectPayment: number;
  achievementId?: string;
}

export function createCustomCommission(
  state: FrameworkState,
  input: NewCommissionInput
): FrameworkState {
  const sorted = getSortedCommissions(state);
  const nextOrder = sorted.length > 0 ? sorted[sorted.length - 1].order + 1 : 1;
  const newId = createUniqueId(`commission-${nextOrder}`);
  const lastCommission = sorted[sorted.length - 1];
  const lastCompleted =
    lastCommission &&
    state.commissionProgress[lastCommission.id]?.unlockState === 'completed';

  const normalizedRequirements: CommissionRequirement[] = input.requirements
    .map((req, index) => {
      if (typeof req === 'string') {
        return {
          id: `${newId}-req-${index + 1}`,
          text: req.trim(),
        };
      }
      return {
        id: req.id || `${newId}-req-${index + 1}`,
        text: req.text.trim(),
      };
    })
    .filter((req) => req.text.length > 0);

  const newCommission: CommissionConfig = {
    id: newId,
    order: nextOrder,
    title: input.title.trim() || `Custom Commission ${nextOrder}`,
    customerId: 'mr-rabbit',
    customerDialogue: input.customerDialogue.trim(),
    successDialogue:
      input.successDialogue.trim() ||
      'Thank you so much, architect! What a thoughtful creation.',
    initialExpression: input.initialExpression ?? 'curious',
    requirements: normalizedRequirements,
    dimensions: input.dimensions.filter(
      (d) => d.label.trim().length > 0 && d.value.trim().length > 0
    ),
    constructionBudget: Math.max(0, Math.round(input.constructionBudget)),
    architectPayment: Math.max(0, Math.round(input.architectPayment)),
    achievementId: input.achievementId ?? '',
  };

  return {
    ...state,
    commissions: [...state.commissions, newCommission],
    commissionProgress: {
      ...state.commissionProgress,
      [newId]: {
        commissionId: newId,
        unlockState: lastCompleted ? 'unlocked_pending_accept' : 'locked',
        status: 'awaiting_design',
        paymentAwarded: false,
        achievementAwarded: false,
      },
    },
  };
}
