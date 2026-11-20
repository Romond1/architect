import {
  createInitialFrameworkState,
  FRAMEWORK_SCHEMA_VERSION,
} from '../commissions/commissionService';
import type { FrameworkState } from '../types';
import {
  type FrameworkStorageEnvelope,
  validateFrameworkEnvelope,
  validateFrameworkState,
} from './schema';

export const FRAMEWORK_STORAGE_KEY = 'himari.studio.framework.v1';
export const CORRUPTED_QUARANTINE_PREFIX = 'himari.studio.framework.corrupted.';

export interface LoadFrameworkResult {
  state: FrameworkState;
  corruptedRecovered: boolean;
  errorMessage?: string;
  writeBlocked?: boolean;
}

export function loadFrameworkState(
  storage: Storage | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : undefined
): LoadFrameworkResult {
  if (!storage) {
    return {
      state: createInitialFrameworkState(),
      corruptedRecovered: false,
    };
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(FRAMEWORK_STORAGE_KEY);
  } catch {
    return {
      state: createInitialFrameworkState(),
      corruptedRecovered: true,
      writeBlocked: true,
      errorMessage:
        'Saved progress could not be read from browser storage. It was left untouched; import a backup or explicitly reset before saving new progress.',
    };
  }

  if (!raw) {
    return {
      state: createInitialFrameworkState(),
      corruptedRecovered: false,
    };
  }

  let problem = 'Saved studio data could not be parsed.';
  try {
    const check = validateFrameworkEnvelope(JSON.parse(raw));
    if (check.valid && check.state)
      return { state: check.state, corruptedRecovered: false };
    problem = check.error ?? 'Saved studio data failed validation.';
  } catch {
    /* Preserve the original bytes below. */
  }
  let preserved = false;
  try {
    storage.setItem(`${CORRUPTED_QUARANTINE_PREFIX}${Date.now()}`, raw);
    preserved = true;
  } catch {
    /* Never overwrite the only remaining copy when storage is full. */
  }
  return {
    state: createInitialFrameworkState(),
    corruptedRecovered: true,
    writeBlocked: !preserved,
    errorMessage: preserved
      ? `${problem} The original save was preserved in recovery storage.`
      : `${problem} Recovery storage is full. The original save is untouched; automatic saves are blocked until you import a backup or explicitly reset.`,
  };
}

export function saveFrameworkState(
  state: FrameworkState,
  storage: Storage | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : undefined
): boolean {
  if (!storage || !validateFrameworkState(state).valid) {
    return false;
  }
  const envelope: FrameworkStorageEnvelope = {
    schemaVersion: FRAMEWORK_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };
  try {
    storage.setItem(FRAMEWORK_STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function clearFrameworkState(
  storage: Storage | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : undefined
): void {
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(FRAMEWORK_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
