const DB_NAME = 'himari-architecture-studio-artifacts-v1';
const STORE_NAME = 'artifacts';
const LOCAL_FALLBACK_PREFIX = 'himari.studio.artifact.v1.';

const memoryArtifacts = new Map<string, string>();

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openArtifactDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function safeLocalSet(id: string, dataUrl: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${LOCAL_FALLBACK_PREFIX}${id}`, dataUrl);
    }
  } catch {
    // Ignore storage quota errors in fallback
  }
}

function safeLocalGet(id: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(`${LOCAL_FALLBACK_PREFIX}${id}`);
    }
  } catch {
    // Ignore
  }
  return null;
}

export async function saveArtifact(id: string, dataUrl: string): Promise<void> {
  memoryArtifacts.set(id, dataUrl);
  if (!hasIndexedDb()) {
    safeLocalSet(id, dataUrl);
    return;
  }
  try {
    const db = await openArtifactDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(dataUrl, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    safeLocalSet(id, dataUrl);
  }
}

export async function getArtifact(id: string): Promise<string | null> {
  if (!id) {
    return null;
  }
  const cached = memoryArtifacts.get(id);
  if (cached) {
    return cached;
  }
  if (!hasIndexedDb()) {
    const fallback = safeLocalGet(id);
    if (fallback) {
      memoryArtifacts.set(id, fallback);
    }
    return fallback;
  }
  try {
    const db = await openArtifactDb();
    const result = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () =>
        resolve(typeof req.result === 'string' ? req.result : null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (result) {
      memoryArtifacts.set(id, result);
      return result;
    }
  } catch {
    // Fall through to local fallback
  }
  const local = safeLocalGet(id);
  if (local) {
    memoryArtifacts.set(id, local);
  }
  return local;
}

export async function getArtifactsMap(
  ids: string[]
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const entries = await Promise.all(
    unique.map(async (id) => {
      const dataUrl = await getArtifact(id);
      return [id, dataUrl] as const;
    })
  );
  const map: Record<string, string> = {};
  for (const [id, dataUrl] of entries) {
    if (dataUrl) {
      map[id] = dataUrl;
    }
  }
  return map;
}

export async function getAllArtifacts(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const [k, v] of memoryArtifacts.entries()) {
    map[k] = v;
  }
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_FALLBACK_PREFIX)) {
        const val = localStorage.getItem(key);
        if (val) {
          map[key.slice(LOCAL_FALLBACK_PREFIX.length)] = val;
        }
      }
    }
  }
  if (!hasIndexedDb()) {
    return map;
  }
  try {
    const db = await openArtifactDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          if (typeof cursor.key === 'string' && typeof cursor.value === 'string') {
            map[cursor.key] = cursor.value;
            memoryArtifacts.set(cursor.key, cursor.value);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
    db.close();
  } catch {
    // Return best-effort map
  }
  return map;
}

export async function clearAllArtifacts(): Promise<void> {
  memoryArtifacts.clear();
  if (typeof localStorage !== 'undefined') {
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_FALLBACK_PREFIX)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => localStorage.removeItem(key));
  }
  if (!hasIndexedDb()) {
    return;
  }
  try {
    const db = await openArtifactDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore cleanup errors
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read file as data URL.'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('File read failed.'));
    reader.readAsDataURL(file);
  });
}

export async function processImageFileToDataUrl(
  file: File,
  maxDimension = 1800
): Promise<string> {
  const rawUrl = await readFileAsDataUrl(file);
  // Preserve small/medium files verbatim and avoid Image decode hangs in headless DOM
  if (
    file.size <= 400_000 ||
    typeof Image === 'undefined' ||
    typeof document === 'undefined' ||
    file.type === 'image/svg+xml'
  ) {
    return rawUrl;
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    const fallbackTimer = setTimeout(() => finish(rawUrl), 1500);
    const img = new Image();
    img.onload = () => {
      clearTimeout(fallbackTimer);
      if (img.width <= maxDimension && img.height <= maxDimension) {
        finish(rawUrl);
        return;
      }
      const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        finish(rawUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      finish(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      clearTimeout(fallbackTimer);
      finish(rawUrl);
    };
    img.src = rawUrl;
  });
}
