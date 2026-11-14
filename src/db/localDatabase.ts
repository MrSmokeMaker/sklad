// src/db/localDatabase.ts: Автономная локальная база данных браузера (IndexedDB + localStorage)
// Не требует серверов, облака или платных подписок

const DB_NAME = 'sklad_mordovia_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_KEY = 'root_state';

export class LocalDatabase {
  private dbPromise: Promise<IDBDatabase | null>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result as IDBDatabase;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = (event: any) => {
          resolve(event.target.result as IDBDatabase);
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Сохранение состояния в IndexedDB с параллельным дублированием в localStorage
   */
  public async saveState(data: any): Promise<void> {
    // 1. Быстрое сохранение в localStorage
    try {
      localStorage.setItem('sklad_state_v1', JSON.stringify(data));
    } catch {
      // Игнорируем переполнение localStorage при больших фото
    }

    // 2. Надёжное сохранение в IndexedDB (без лимитов размера)
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, STATE_KEY);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        resolve();
      }
    });
  }

  /**
   * Загрузка состояния: сначала из IndexedDB, при отсутствии — из localStorage
   */
  public async loadState(): Promise<any | null> {
    const db = await this.dbPromise;
    if (db) {
      const fromIDB = await new Promise<any>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(STATE_KEY);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });

      if (fromIDB) return fromIDB;
    }

    // Fallback: localStorage
    try {
      const fromLS = localStorage.getItem('sklad_state_v1');
      if (fromLS) {
        return JSON.parse(fromLS);
      }
    } catch {
      // Игнорируем
    }

    return null;
  }

  /**
   * Экспорт всей базы данных в JSON-строку для бэкапа
   */
  public async exportBackupJson(): Promise<string> {
    const state = await this.loadState();
    return JSON.stringify(state, null, 2);
  }

  /**
   * Восстановление базы данных из JSON-строки
   */
  public async importBackupJson(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        await this.saveState(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const localDB = new LocalDatabase();
