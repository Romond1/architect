import { FRAMEWORK_SCHEMA_VERSION } from '../commissions/commissionService';
import type { FrameworkState } from '../types';

export interface FrameworkStorageEnvelope {
  schemaVersion: number;
  savedAt: string;
  state: FrameworkState;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateFrameworkState(raw: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!isPlainObject(raw)) {
    return { valid: false, error: 'State payload must be an object.' };
  }
  if (typeof raw.schemaVersion !== 'number') {
    return { valid: false, error: 'Missing numeric schemaVersion.' };
  }
  if (raw.schemaVersion > FRAMEWORK_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `Unsupported future schema version (${raw.schemaVersion}).`,
    };
  }
  if (!isPlainObject(raw.preferences)) {
    return { valid: false, error: 'Missing studio preferences.' };
  }
  if (typeof raw.activeCommissionId !== 'string' || !raw.activeCommissionId) {
    return { valid: false, error: 'Missing activeCommissionId.' };
  }
  if (!Array.isArray(raw.commissions) || raw.commissions.length === 0) {
    return { valid: false, error: 'Missing commissions list.' };
  }
  if (!isPlainObject(raw.commissionProgress)) {
    return { valid: false, error: 'Missing commissionProgress map.' };
  }
  if (!isPlainObject(raw.submissions)) {
    return { valid: false, error: 'Missing submissions map.' };
  }
  if (!isPlainObject(raw.feedbackHistory)) {
    return { valid: false, error: 'Missing feedbackHistory map.' };
  }
  if (
    !isPlainObject(raw.wallet) ||
    typeof raw.wallet.balance !== 'number' ||
    raw.wallet.balance < 0 ||
    !Array.isArray(raw.wallet.transactions)
  ) {
    return { valid: false, error: 'Invalid wallet structure.' };
  }
  if (
    !isPlainObject(raw.inventory) ||
    !Array.isArray(raw.inventory.ownedItemIds) ||
    !isPlainObject(raw.inventory.equippedSlots)
  ) {
    return { valid: false, error: 'Invalid cosmetic inventory structure.' };
  }
  if (!isPlainObject(raw.earnedAchievements)) {
    return { valid: false, error: 'Missing earnedAchievements map.' };
  }
  if (!Array.isArray(raw.portfolio)) {
    return { valid: false, error: 'Missing portfolio list.' };
  }

  return { valid: true };
}

export function validateFrameworkEnvelope(raw: unknown): {
  valid: boolean;
  state?: FrameworkState;
  error?: string;
} {
  if (!isPlainObject(raw)) {
    return { valid: false, error: 'Storage envelope must be an object.' };
  }
  if (typeof raw.schemaVersion !== 'number' || !('state' in raw)) {
    return { valid: false, error: 'Malformed framework storage envelope.' };
  }
  const stateCheck = validateFrameworkState(raw.state);
  if (!stateCheck.valid) {
    return { valid: false, error: stateCheck.error };
  }
  return {
    valid: true,
    state: raw.state as FrameworkState,
  };
}
