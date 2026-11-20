import { cloneSerializable } from '../utils/serializable';
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
  const requireStorage = (): Storage => {
    if (!storage)
      throw new Error(
        'Workspace storage is unavailable. Export your work before closing this page.'
      );
    return storage;
  };
  const fullKey = (key: string) =>
    `${WORKSPACE_STORAGE_PREFIX}${sanitizeKey(key)}`;
  const listKeys = (): string[] => {
    const target = requireStorage(),
      keys: string[] = [];
    for (let i = 0; i < target.length; i++) {
      const key = target.key(i);
      if (key?.startsWith(WORKSPACE_STORAGE_PREFIX))
        keys.push(key.slice(WORKSPACE_STORAGE_PREFIX.length));
    }
    return keys.sort();
  };
  return {
    load<T>(key: string): T | null {
      const raw = requireStorage().getItem(fullKey(key));
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        throw new Error(
          `The saved workspace record "${key}" is unreadable. It was left untouched; export a backup before recovering it.`
        );
      }
    },
    save<T>(key: string, value: T): void {
      const raw = JSON.stringify(cloneSerializable(value));
      try {
        requireStorage().setItem(fullKey(key), raw);
      } catch {
        throw new Error(
          'Workspace could not be saved. Browser storage is full or unavailable; export your work before closing this page.'
        );
      }
    },
    remove(key: string): void {
      requireStorage().removeItem(fullKey(key));
    },
    listKeys,
    clear(): void {
      const target = requireStorage();
      for (const key of listKeys()) target.removeItem(fullKey(key));
    },
    exportAll(): Record<string, unknown> {
      const out: Record<string, unknown> = {};
      for (const key of listKeys()) {
        const raw = requireStorage().getItem(fullKey(key));
        if (raw !== null) {
          try {
            Object.defineProperty(out, key, {
              value: JSON.parse(raw),
              enumerable: true,
            });
          } catch {
            Object.defineProperty(out, key, { value: raw, enumerable: true });
          }
        }
      }
      return out;
    },
    importAll(records: Record<string, unknown>): void {
      const target = requireStorage();
      const entries = Object.entries(cloneSerializable(records)).map(
        ([key, value]) => [fullKey(key), JSON.stringify(value)] as const
      );
      if (new Set(entries.map(([key]) => key)).size !== entries.length)
        throw new Error('Workspace backup contains conflicting record names.');
      const previous = entries.map(
        ([key]) => [key, target.getItem(key)] as const
      );
      try {
        for (const [key, value] of entries) target.setItem(key, value);
      } catch {
        for (const [key, value] of previous) {
          if (value === null) target.removeItem(key);
          else if (target.getItem(key) !== value) target.setItem(key, value);
        }
        throw new Error(
          'Workspace backup could not be saved. Existing records were retained.'
        );
      }
    },
  };
}
export function replaceWorkspaceData(
  api: WorkspaceStorageApi,
  records: Record<string, unknown>
): void {
  cloneSerializable(records);
  const previous = api.exportAll();
  try {
    api.clear();
    api.importAll(records);
  } catch (error) {
    api.clear();
    api.importAll(previous);
    throw error;
  }
}
