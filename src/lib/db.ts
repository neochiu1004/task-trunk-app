import { DB_KEYS } from './constants';

export interface DataHealthStatus {
  isHealthy: boolean;
  totalKeys: number;
  totalSize: number;
  lastBackup?: number;
  issues: string[];
  recommendations: string[];
}

class DBHelper {
  private dbName = 'WalletFreshDB';
  private storeName = 'kv_store';
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    // Return existing promise if already initializing
    if (this.initPromise) return this.initPromise;
    
    // Return existing db if already initialized
    if (this.db) return Promise.resolve(this.db);
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      
      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        
        // Handle database close events
        this.db.onclose = () => {
          this.db = null;
          this.initPromise = null;
        };
        
        this.db.onerror = (event) => {
          console.error('Database error:', event);
        };
        
        resolve(this.db);
      };
      
      request.onerror = (e) => {
        this.initPromise = null;
        reject((e.target as IDBOpenDBRequest).error);
      };
    });
    
    return this.initPromise;
  }

  private async ensureConnection(): Promise<IDBDatabase> {
    if (!this.db) {
      return await this.init();
    }
    return this.db;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureConnection();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const request = store.put(value, key);
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        request.onerror = () => reject(request.error);
      } catch (error) {
        // If transaction fails, try reinitializing
        this.db = null;
        this.initPromise = null;
        reject(error);
      }
    });
  }

  async getItem<T>(key: string): Promise<T | undefined> {
    const db = await this.ensureConnection();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        this.db = null;
        this.initPromise = null;
        reject(error);
      }
    });
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.ensureConnection();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const request = store.delete(key);
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        request.onerror = () => reject(request.error);
      } catch (error) {
        this.db = null;
        this.initPromise = null;
        reject(error);
      }
    });
  }

  async getAllKeys(): Promise<string[]> {
    const db = await this.ensureConnection();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const request = store.getAllKeys();
        
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { usage: 0, quota: 0 };
  }

  async checkDataHealth(): Promise<DataHealthStatus> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let isHealthy = true;

    try {
      const db = await this.ensureConnection();
      const keys = await this.getAllKeys();
      const storage = await this.getStorageEstimate();

      // Check for required keys
      const requiredKeys = [DB_KEYS.TASKS, DB_KEYS.SETTINGS];
      for (const key of requiredKeys) {
        if (!keys.includes(key)) {
          issues.push(`缺少關鍵資料: ${key}`);
          isHealthy = false;
        }
      }

      // Check tasks data integrity
      const tasks = await this.getItem<any[]>(DB_KEYS.TASKS);
      if (tasks) {
        if (!Array.isArray(tasks)) {
          issues.push('票券資料格式異常');
          isHealthy = false;
        } else {
          const invalidTasks = tasks.filter(t => !t.id || !t.productName);
          if (invalidTasks.length > 0) {
            issues.push(`${invalidTasks.length} 張票券資料不完整`);
          }
        }
      }

      // Check settings data integrity
      const settings = await this.getItem<any>(DB_KEYS.SETTINGS);
      if (settings && typeof settings !== 'object') {
        issues.push('設定資料格式異常');
        isHealthy = false;
      }

      // Check storage usage
      if (storage.quota > 0) {
        const usagePercent = (storage.usage / storage.quota) * 100;
        if (usagePercent > 80) {
          issues.push(`儲存空間使用率高 (${usagePercent.toFixed(1)}%)`);
          recommendations.push('建議清理未使用的圖片或匯出備份');
        }
      }

      // Check last backup
      const lastBackup = await this.getItem<number>('lastBackupTime');
      const now = Date.now();
      if (!lastBackup) {
        recommendations.push('尚未進行任何備份，建議立即備份');
      } else if (now - lastBackup > 7 * 24 * 60 * 60 * 1000) {
        recommendations.push('距離上次備份已超過 7 天，建議進行備份');
      }

      // Check for persistent storage
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          recommendations.push('建議啟用持久化儲存以防止資料遺失');
        }
      }

      return {
        isHealthy: isHealthy && issues.length === 0,
        totalKeys: keys.length,
        totalSize: storage.usage,
        lastBackup,
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        isHealthy: false,
        totalKeys: 0,
        totalSize: 0,
        issues: ['無法存取資料庫'],
        recommendations: ['嘗試重新整理頁面或清除瀏覽器快取'],
      };
    }
  }

  async requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
      const granted = await navigator.storage.persist();
      return granted;
    }
    return false;
  }

  async recordBackup(): Promise<void> {
    await this.setItem('lastBackupTime', Date.now());
  }

  async exportAllData(): Promise<object> {
    const data: Record<string, any> = {};
    const keys = await this.getAllKeys();
    
    for (const key of keys) {
      data[key] = await this.getItem(key);
    }
    
    return data;
  }

  async importAllData(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.setItem(key, value);
    }
  }
}

export const dbHelper = new DBHelper();