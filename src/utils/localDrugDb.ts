import { LOCAL_DRUG_FORMULARY, type FormularyDrugRecord } from '../data/localDrugFormulary';
import type { MedicationItem } from '../types/pharmacy';
import { toFormularyRecord } from './localDrugSearch';
import { getMedicationKey } from './pharmacyLogic';

const DB_NAME = 'daruyar_formulary_db';
const DB_VERSION = 2;
const STORE_NAME = 'medications';

export interface LocalDbInitResult {
  catalog: FormularyDrugRecord[];
  storageEngine: 'indexeddb' | 'memory';
}

function isIndexedDbSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openFormularyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('genericName', 'genericName', { unique: false });
        store.createIndex('persianName', 'persianName', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function readAllFromStore(db: IDBDatabase): Promise<FormularyDrugRecord[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as FormularyDrugRecord[]) ?? []);
    req.onerror = () => reject(req.error ?? new Error('Failed to read IndexedDB'));
  });
}

function writeRecordsToStore(db: IDBDatabase, records: FormularyDrugRecord[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const record of records) {
      store.put(record);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to write IndexedDB'));
  });
}

function mergeCatalogByKey(
  seed: FormularyDrugRecord[],
  stored: FormularyDrugRecord[]
): FormularyDrugRecord[] {
  const byKey = new Map<string, FormularyDrugRecord>();

  for (const item of seed) {
    byKey.set(getMedicationKey(item), item);
  }
  for (const item of stored) {
    // Legacy AI-generated cached records have no documented clinical approval.
    // Exclude them even if persisted on an older browser installation.
    if (item.cachedFromAi) continue;
    const key = getMedicationKey(item);
    if (!byKey.has(key)) {
      byKey.set(key, item);
    }
  }

  return Array.from(byKey.values());
}

export async function initLocalDrugDb(): Promise<LocalDbInitResult> {
  if (!isIndexedDbSupported()) {
    return {
      catalog: LOCAL_DRUG_FORMULARY,
      storageEngine: 'memory',
    };
  }

  try {
    const db = await openFormularyDatabase();
    const existing = await readAllFromStore(db);
    const existingById = new Map(existing.map((r) => [r.id, r]));
    const recordsToSync = LOCAL_DRUG_FORMULARY.filter((seedItem) => {
      const prev = existingById.get(seedItem.id);
      return !prev || prev.category !== seedItem.category;
    });

    // Migrate any AI-cached records that still hold the legacy 'neuro_resp' category
    const migratedCachedRecords: FormularyDrugRecord[] = [];
    for (const stored of existing) {
      if (stored.cachedFromAi && (stored.category as string) === 'neuro_resp') {
        migratedCachedRecords.push(toFormularyRecord(stored, true));
      }
    }

    const toWrite = [...recordsToSync, ...migratedCachedRecords];
    if (toWrite.length > 0) {
      await writeRecordsToStore(db, toWrite);
    }

    const updated = toWrite.length > 0 ? await readAllFromStore(db) : existing;
    db.close();

    return {
      catalog: mergeCatalogByKey(LOCAL_DRUG_FORMULARY, updated),
      storageEngine: 'indexeddb',
    };
  } catch {
    return {
      catalog: LOCAL_DRUG_FORMULARY,
      storageEngine: 'memory',
    };
  }
}

/**
 * @deprecated AI-generated monographs must not be promoted into the
 * clinical formulary without an audited human-review workflow.
 * Kept as a no-op for backward compatibility with older callers.
 */
export async function cacheMedicationsInLocalDb(
  _meds: MedicationItem[],
  currentCatalog: FormularyDrugRecord[]
): Promise<FormularyDrugRecord[]> {
  return currentCatalog;
}
