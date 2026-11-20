import {
  createInitialFrameworkState,
  FRAMEWORK_SCHEMA_VERSION,
} from '../commissions/commissionService';
import type { FrameworkState } from '../types';
import {
  type FrameworkStorageEnvelope,
  validateFrameworkEnvelope,
} from './schema';

export const FRAMEWORK_STORAGE_KEY = 'himari.studio.framework.v1';
export const CORRUPTED_QUARANTINE_PREFIX = 'himari.studio.framework.corrupted.';

export interface LoadFrameworkResult {
  state: FrameworkState;
  corruptedRecovered: boolean;
  errorMessage?: string;
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
      corruptedRecovered: false,
    };
  }

  if (!raw) {
    return {
      state: createInitialFrameworkState(),
      corruptedRecovered: false,
    };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const check = validateFrameworkEnvelope(parsed);
    if (check.valid && check.state) {
      return {
        state: check.state,
        corruptedRecovered: false,
      };
    }

    // Quarantine malformed data instead of silently destroying it
    try {
      storage.setItem(`${CORRUPTED_QUARANTINE_PREFIX}${Date.now()}`, raw);
      storage.removeItem(FRAMEWORK_STORAGE_KEY);
    } catch {
      // Ignore quarantine failure if storage is full
    }
    return {
      state: createInitialFrameworkState(),
      corruptedRecovered: true,
      errorMessage:
        check.error ??
        'Saved studio data failed integrity validation and was backed up safely.',
    };
  } catch {
    try {
      storage.setItem(`${CORRUPTED_QUARANTINE_PREFIX}${Date.now()}`, raw);
      storage.removeItem(FRAMEWORK_STORAGE_KEY);
    } catch {
      // Ignore
    }
    return {
      state: createInitialFrameworkState(),
      corruptedRecovered: true,
      errorMessage:
        'Saved studio data could not be parsed and was backed up before starting cleanly.',
    };
  }
}

export function saveFrameworkState(
  state: FrameworkState,
  storage: Storage | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : undefined
): boolean {
  if (!storage) {
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
