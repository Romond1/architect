import { CUSTOMERS_BY_ID, MR_RABBIT_CUSTOMER } from '../../config/customers/mrRabbit';
import type {
  CommissionConfig,
  CommissionProgressRecord,
  CustomerProfile,
  FeedbackRecord,
  RabbitExpression,
} from '../types';

export function getCustomerProfile(customerId: string): CustomerProfile {
  return CUSTOMERS_BY_ID[customerId] ?? MR_RABBIT_CUSTOMER;
}

export function resolveRabbitExpression(
  commission: CommissionConfig,
  progress: CommissionProgressRecord,
  latestFeedback?: FeedbackRecord,
  workspaceHasDeliverable?: boolean
): RabbitExpression {
  if (progress.status === 'commission_completed' || progress.status === 'commission_approved') {
    return commission.isGrandFinale ? 'extremelyHappy' : 'celebrating';
  }
  if (progress.status === 'revision_requested') {
    return latestFeedback?.expression ?? 'concerned';
  }
  if (progress.status === 'under_review') {
    return 'thinking';
  }
  if (progress.status === 'design_submitted') {
    return 'waiting';
  }
  if (workspaceHasDeliverable) {
    return 'impressed';
  }
  return commission.initialExpression;
}

export function resolveCustomerDialogue(
  commission: CommissionConfig,
  progress: CommissionProgressRecord,
  latestFeedback?: FeedbackRecord
): string {
  if (progress.status === 'commission_completed' || progress.status === 'commission_approved') {
    return latestFeedback?.message || commission.successDialogue;
  }
  if (progress.status === 'revision_requested' && latestFeedback?.message) {
    return latestFeedback.message;
  }
  if (progress.status === 'under_review') {
    const profile = getCustomerProfile(commission.customerId);
    return profile.awaitingReviewDialogues[1] ?? profile.awaitingReviewDialogues[0];
  }
  if (progress.status === 'design_submitted') {
    const profile = getCustomerProfile(commission.customerId);
    return profile.awaitingReviewDialogues[0];
  }
  return commission.customerDialogue;
}
