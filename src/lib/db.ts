class DBHelper {
  private dbName = "PocketVaultDB";
  private storeName = "kv_store";
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.initPromise) return this.initPromise;
    if (this.db) return Promise.resolve(this.db);

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.db.onclose = () => {
          this.db = null;
          this.initPromise = null;
        };
        resolve(this.db);
      };

      request.onerror = (event) => {
        this.initPromise = null;
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  private async ensureConnection() {
    if (!this.db) return this.init();
    return this.db;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureConnection();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.put(value, key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      request.onerror = () => reject(request.error);
    });
  }

  async getItem<T>(key: string): Promise<T | undefined> {
    const db = await this.ensureConnection();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.ensureConnection();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.delete(key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbHelper = new DBHelper();
