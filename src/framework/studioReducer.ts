import {
  acceptUnlockedCommission,
  createCustomCommission,
  createInitialFrameworkState,
  manuallyUnlockCommission,
  reopenCommission,
  switchActiveCommission,
  updateCommissionConfig,
  type NewCommissionInput,
} from './commissions/commissionService';
import { adjustWallet } from './economy/personalWallet';
import {
  equipShopItem,
  purchaseShopItem,
  unequipShopItem,
} from './rewards/shopService';
import {
  approveCommissionSubmission,
  createSubmission,
  markSubmissionUnderReview,
  requestSubmissionRevision,
  type ApproveSubmissionInput,
  type CreateSubmissionInput,
  type RequestRevisionInput,
} from './submissions/submissionService';
import type { CommissionConfig, FrameworkState, StudioPreferences } from './types';

export type FrameworkAction =
  | { type: 'SUBMIT_DESIGN'; payload: CreateSubmissionInput }
  | {
      type: 'MARK_UNDER_REVIEW';
      payload: { commissionId: string; submissionId?: string };
    }
  | { type: 'REQUEST_REVISION'; payload: RequestRevisionInput }
  | { type: 'APPROVE_SUBMISSION'; payload: ApproveSubmissionInput }
  | { type: 'DISMISS_CELEBRATION' }
  | { type: 'ACCEPT_COMMISSION'; payload: { commissionId: string } }
  | { type: 'SWITCH_COMMISSION'; payload: { commissionId: string } }
  | { type: 'PURCHASE_SHOP_ITEM'; payload: { itemId: string } }
  | { type: 'EQUIP_SHOP_ITEM'; payload: { itemId: string } }
  | { type: 'UNEQUIP_SHOP_ITEM'; payload: { itemId: string } }
  | {
      type: 'TEACHER_UNLOCK_COMMISSION';
      payload: { commissionId: string; activateImmediately?: boolean };
    }
  | { type: 'TEACHER_REOPEN_COMMISSION'; payload: { commissionId: string } }
  | {
      type: 'TEACHER_UPDATE_COMMISSION';
      payload: {
        commissionId: string;
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
        >;
      };
    }
  | { type: 'TEACHER_CREATE_COMMISSION'; payload: NewCommissionInput }
  | {
      type: 'TEACHER_ADJUST_WALLET';
      payload: { delta: number; reason: string };
    }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<StudioPreferences> }
  | { type: 'REPLACE_STATE'; payload: FrameworkState }
  | { type: 'RESET_ALL' };

export function studioReducer(
  state: FrameworkState,
  action: FrameworkAction
): FrameworkState {
  switch (action.type) {
    case 'SUBMIT_DESIGN':
      return createSubmission(state, action.payload).state;

    case 'MARK_UNDER_REVIEW':
      return markSubmissionUnderReview(
        state,
        action.payload.commissionId,
        action.payload.submissionId
      );

    case 'REQUEST_REVISION':
      return requestSubmissionRevision(state, action.payload);

    case 'APPROVE_SUBMISSION':
      return approveCommissionSubmission(state, action.payload);

    case 'DISMISS_CELEBRATION':
      return state.activeCelebration
        ? { ...state, activeCelebration: null }
        : state;

    case 'ACCEPT_COMMISSION':
      return acceptUnlockedCommission(state, action.payload.commissionId);

    case 'SWITCH_COMMISSION':
      return switchActiveCommission(state, action.payload.commissionId);

    case 'PURCHASE_SHOP_ITEM':
      return purchaseShopItem(state, action.payload.itemId).state;

    case 'EQUIP_SHOP_ITEM':
      return equipShopItem(state, action.payload.itemId);

    case 'UNEQUIP_SHOP_ITEM':
      return unequipShopItem(state, action.payload.itemId);

    case 'TEACHER_UNLOCK_COMMISSION':
      return manuallyUnlockCommission(
        state,
        action.payload.commissionId,
        action.payload.activateImmediately
      );

    case 'TEACHER_REOPEN_COMMISSION':
      return reopenCommission(state, action.payload.commissionId);

    case 'TEACHER_UPDATE_COMMISSION':
      return updateCommissionConfig(
        state,
        action.payload.commissionId,
        action.payload.patch
      );

    case 'TEACHER_CREATE_COMMISSION':
      return createCustomCommission(state, action.payload);

    case 'TEACHER_ADJUST_WALLET': {
      const adjusted = adjustWallet(
        state.wallet,
        action.payload.delta,
        action.payload.reason
      );
      return adjusted.ok ? { ...state, wallet: adjusted.wallet } : state;
    }

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
          studioTitle:
            action.payload.studioTitle !== undefined
              ? action.payload.studioTitle.trim() ||
                state.preferences.studioTitle
              : state.preferences.studioTitle,
        },
      };

    case 'REPLACE_STATE':
      return action.payload;

    case 'RESET_ALL':
      return createInitialFrameworkState();

    default:
      return state;
  }
}
