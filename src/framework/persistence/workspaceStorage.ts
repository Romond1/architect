export const WORKSPACE_STORAGE_PREFIX = 'himari.studio.workspace.v1.';

export interface WorkspaceStorageApi {
  load<T>(key: string): T | null;
  save<T>(key: string, value: T): void;
  remove(key: string): void;
  listKeys(): string[];
  clear(): void;
  exportAll(): Record<string, unknown>;
  importAll(records: Record<string, unknown>): void;
}

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function createWorkspaceStorageApi(
  storage: Storage | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : undefined
): WorkspaceStorageApi {
  const memoryFallback = new Map<string, string>();

  const getRaw = (fullKey: string): string | null => {
    if (storage) {
      try {
        return storage.getItem(fullKey);
      } catch {
        return memoryFallback.get(fullKey) ?? null;
      }
    }
    return memoryFallback.get(fullKey) ?? null;
  };

  const setRaw = (fullKey: string, value: string): void => {
    memoryFallback.set(fullKey, value);
    if (storage) {
      try {
        storage.setItem(fullKey, value);
      } catch {
        // Fallback already populated
      }
    }
  };

  const removeRaw = (fullKey: string): void => {
    memoryFallback.delete(fullKey);
    if (storage) {
      try {
        storage.removeItem(fullKey);
      } catch {
        // Ignore
      }
    }
  };

  const listKeys = (): string[] => {
    const keys = new Set<string>();
    for (const fullKey of memoryFallback.keys()) {
      if (fullKey.startsWith(WORKSPACE_STORAGE_PREFIX)) {
        keys.add(fullKey.slice(WORKSPACE_STORAGE_PREFIX.length));
      }
    }
    if (storage) {
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key && key.startsWith(WORKSPACE_STORAGE_PREFIX)) {
          keys.add(key.slice(WORKSPACE_STORAGE_PREFIX.length));
        }
      }
    }
    return Array.from(keys).sort();
  };

  return {
    load<T>(key: string): T | null {
      const raw = getRaw(`${WORKSPACE_STORAGE_PREFIX}${sanitizeKey(key)}`);
      if (!raw) {
        return null;
      }
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },

    save<T>(key: string, value: T): void {
      setRaw(`${WORKSPACE_STORAGE_PREFIX}${sanitizeKey(key)}`, JSON.stringify(value));
    },

    remove(key: string): void {
      removeRaw(`${WORKSPACE_STORAGE_PREFIX}${sanitizeKey(key)}`);
    },

    listKeys,

    clear(): void {
      for (const key of listKeys()) {
        removeRaw(`${WORKSPACE_STORAGE_PREFIX}${key}`);
      }
    },

    exportAll(): Record<string, unknown> {
      const out: Record<string, unknown> = {};
      for (const key of listKeys()) {
        const raw = getRaw(`${WORKSPACE_STORAGE_PREFIX}${key}`);
        if (raw !== null) {
          try {
            out[key] = JSON.parse(raw);
          } catch {
            out[key] = raw;
          }
        }
      }
      return out;
    },

    importAll(records: Record<string, unknown>): void {
      for (const [key, value] of Object.entries(records)) {
        setRaw(
          `${WORKSPACE_STORAGE_PREFIX}${sanitizeKey(key)}`,
          JSON.stringify(value)
        );
      }
    },
  };
}
