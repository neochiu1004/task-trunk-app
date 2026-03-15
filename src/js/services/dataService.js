import { DB_KEYS, defaultSettings, normalizeTicket } from '../utils.js';

export class DataService {
  constructor() {
    this.dbName = 'WalletFreshDB';
    this.storeName = 'kv_store';
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(request.error);
    });
    await this.migrateFromLegacyLocalStorage();
    return this.db;
  }

  convertLegacyDataFormat(oldData) {
    const records = [];
    if (!oldData || typeof oldData !== 'object') return records;

    for (const year of Object.keys(oldData)) {
      const months = oldData[year];
      if (!months || typeof months !== 'object') continue;
      for (const month of Object.keys(months)) {
        const days = months[month];
        if (!days || typeof days !== 'object') continue;
        for (const day of Object.keys(days)) {
          const dayData = days[day] || {};

          if (dayData.OutType && typeof dayData.OutType === 'object') {
            for (const category of Object.keys(dayData.OutType)) {
              const categoryData = dayData.OutType[category];
              if (!Array.isArray(categoryData?.money)) continue;
              for (let i = 1; i < categoryData.money.length; i += 1) {
                records.push(normalizeTicket({
                  productName: `[支出] ${category}`,
                  serial: '',
                  expiry: '',
                  note: categoryData.description?.[i] || '',
                  tags: [category],
                  completed: false,
                  isDeleted: false,
                  createdAt: new Date(`${year}-${month}-${day}`).getTime() + i,
                }));
              }
            }
          }

          if (dayData.InType && typeof dayData.InType === 'object') {
            for (const category of Object.keys(dayData.InType)) {
              const categoryData = dayData.InType[category];
              if (!Array.isArray(categoryData?.money)) continue;
              for (let i = 1; i < categoryData.money.length; i += 1) {
                records.push(normalizeTicket({
                  productName: `[收入] ${category}`,
                  serial: '',
                  expiry: '',
                  note: categoryData.description?.[i] || '',
                  tags: [category],
                  completed: false,
                  isDeleted: false,
                  createdAt: new Date(`${year}-${month}-${day}`).getTime() + i,
                }));
              }
            }
          }
        }
      }
    }

    return records;
  }

  async migrateFromLegacyLocalStorage() {
    const existingTasks = await this.getItem(DB_KEYS.TASKS);
    if (Array.isArray(existingTasks) && existingTasks.length > 0) return;

    const oldPayload = localStorage.getItem('AllTheData');
    if (!oldPayload) return;

    try {
      const parsed = JSON.parse(oldPayload);
      const migratedTasks = this.convertLegacyDataFormat(parsed);
      if (migratedTasks.length > 0) {
        await this.setItem(DB_KEYS.TASKS, migratedTasks);
        localStorage.setItem('AllTheData_backup', oldPayload);
        localStorage.removeItem('AllTheData');
      }
    } catch (_error) {
      // Ignore malformed legacy payloads and keep current storage untouched.
    }
  }

  async getItem(key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async setItem(key, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async removeItem(key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllKeys() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async loadState() {
    const [tasks, settings, templates, bgHistory, expiryNotified] = await Promise.all([
      this.getItem(DB_KEYS.TASKS),
      this.getItem(DB_KEYS.SETTINGS),
      this.getItem(DB_KEYS.TEMPLATES),
      this.getItem(DB_KEYS.BG_HISTORY),
      this.getItem(DB_KEYS.EXPIRY_NOTIFIED),
    ]);

    const normalizedTasks = Array.isArray(tasks) ? tasks.map(normalizeTicket) : [];
    const mergedSettings = {
      ...defaultSettings,
      ...(settings || {}),
      viewConfigs: {
        ...defaultSettings.viewConfigs,
        ...(settings?.viewConfigs || {}),
      },
    };

    return {
      tasks: normalizedTasks,
      settings: mergedSettings,
      templates: Array.isArray(templates) ? templates : [],
      bgHistory: Array.isArray(bgHistory) ? bgHistory : [],
      expiryNotified: expiryNotified && typeof expiryNotified === 'object' ? expiryNotified : {},
    };
  }

  async saveState(partialState) {
    const jobs = [];
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(partialState, key);

    if (hasOwn('tasks')) {
      jobs.push(this.setItem(DB_KEYS.TASKS, (partialState.tasks || []).map(normalizeTicket)));
    }
    if (hasOwn('settings')) {
      jobs.push(this.setItem(DB_KEYS.SETTINGS, partialState.settings || defaultSettings));
    }
    if (hasOwn('templates')) {
      jobs.push(this.setItem(DB_KEYS.TEMPLATES, partialState.templates || []));
    }
    if (hasOwn('bgHistory')) {
      jobs.push(this.setItem(DB_KEYS.BG_HISTORY, partialState.bgHistory || []));
    }
    if (hasOwn('expiryNotified')) {
      jobs.push(this.setItem(DB_KEYS.EXPIRY_NOTIFIED, partialState.expiryNotified || {}));
    }
    await Promise.all(jobs);
  }

  async exportAllData() {
    const [tasks, settings, templates, bgHistory, expiryNotified] = await Promise.all([
      this.getItem(DB_KEYS.TASKS),
      this.getItem(DB_KEYS.SETTINGS),
      this.getItem(DB_KEYS.TEMPLATES),
      this.getItem(DB_KEYS.BG_HISTORY),
      this.getItem(DB_KEYS.EXPIRY_NOTIFIED),
    ]);

    return {
      version: 3,
      timestamp: Date.now(),
      tasks: Array.isArray(tasks) ? tasks : [],
      settings: settings || defaultSettings,
      templates: Array.isArray(templates) ? templates : [],
      bgHistory: Array.isArray(bgHistory) ? bgHistory : [],
      expiryNotified: expiryNotified || {},
    };
  }

  async importData(rawData, mode = 'append', restoreSettings = true) {
    const current = await this.loadState();

    const incomingTasks = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData.tasks)
        ? rawData.tasks
        : [];

    const normalizedIncoming = incomingTasks.map(normalizeTicket);
    let nextTasks;
    if (mode === 'overwrite') {
      nextTasks = normalizedIncoming;
    } else {
      const buildSignature = (ticket) => JSON.stringify({
        productName: (ticket.productName || '').trim(),
        serial: (ticket.serial || '').trim(),
        expiry: (ticket.expiry || '').trim(),
        note: (ticket.note || '').trim(),
        redeemUrl: (ticket.redeemUrl || '').trim(),
        barcodeFormat: ticket.barcodeFormat || '',
        tags: Array.isArray(ticket.tags) ? [...ticket.tags].sort() : [],
        completed: !!ticket.completed,
        completedAt: ticket.completedAt || 0,
        isDeleted: !!ticket.isDeleted,
        deletedAt: ticket.deletedAt || 0,
        pinned: !!ticket.pinned,
        createdAt: ticket.createdAt || 0,
      });

      const map = new Map(current.tasks.map((t) => [t.id, t]));
      const signatureSet = new Set(current.tasks.map((ticket) => buildSignature(ticket)));

      for (const item of normalizedIncoming) {
        if (map.has(item.id)) {
          map.set(item.id, item);
          signatureSet.add(buildSignature(item));
          continue;
        }

        const signature = buildSignature(item);
        if (signatureSet.has(signature)) {
          continue;
        }

        map.set(item.id, item);
        signatureSet.add(signature);
      }
      nextTasks = [...map.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    const nextState = {
      tasks: nextTasks,
      templates: Array.isArray(rawData.templates)
        ? rawData.templates
        : current.templates,
      bgHistory: Array.isArray(rawData.bgHistory)
        ? rawData.bgHistory
        : current.bgHistory,
      expiryNotified: rawData.expiryNotified && typeof rawData.expiryNotified === 'object'
        ? rawData.expiryNotified
        : current.expiryNotified,
    };

    if (restoreSettings && rawData.settings && typeof rawData.settings === 'object') {
      nextState.settings = {
        ...current.settings,
        ...rawData.settings,
        viewConfigs: {
          ...current.settings.viewConfigs,
          ...(rawData.settings.viewConfigs || {}),
        },
      };
    } else {
      nextState.settings = current.settings;
    }

    await this.saveState(nextState);
    return nextState;
  }

  async checkDataHealth() {
    const issues = [];
    const recommendations = [];
    const keys = await this.getAllKeys();
    const [tasks, settings, lastBackup] = await Promise.all([
      this.getItem(DB_KEYS.TASKS),
      this.getItem(DB_KEYS.SETTINGS),
      this.getItem(DB_KEYS.LAST_BACKUP),
    ]);

    if (!keys.includes(DB_KEYS.TASKS)) {
      issues.push('缺少票券資料索引');
    }

    if (!keys.includes(DB_KEYS.SETTINGS)) {
      recommendations.push('建議初始化設定資料');
    }

    if (settings != null && typeof settings !== 'object') {
      issues.push('設定資料格式異常');
    }

    if (tasks && !Array.isArray(tasks)) {
      issues.push('票券資料格式異常');
    }

    if (Array.isArray(tasks)) {
      const invalid = tasks.filter((t) => !t.id || !t.productName);
      if (invalid.length > 0) {
        issues.push(`${invalid.length} 張票券資料不完整`);
      }

      const idMap = new Map();
      for (const ticket of tasks) {
        if (!ticket?.id) continue;
        idMap.set(ticket.id, (idMap.get(ticket.id) || 0) + 1);
      }
      const duplicateIds = [...idMap.values()].filter((count) => count > 1).length;
      if (duplicateIds > 0) {
        issues.push(`偵測到 ${duplicateIds} 組重複票券 ID`);
      }

      const serialMap = new Map();
      tasks.forEach((ticket) => {
        if (ticket?.isDeleted || !ticket?.serial) return;
        serialMap.set(ticket.serial, (serialMap.get(ticket.serial) || 0) + 1);
      });
      const duplicateSerialGroups = [...serialMap.values()].filter((count) => count > 1).length;
      if (duplicateSerialGroups > 0) {
        recommendations.push(`有 ${duplicateSerialGroups} 組序號重複，建議人工確認`);
      }
    }

    const storage = await navigator.storage?.estimate?.();
    const totalSize = storage?.usage || 0;
    const storageQuota = storage?.quota || 0;
    if (storageQuota > 0) {
      const usagePercent = (totalSize / storageQuota) * 100;
      if (usagePercent > 80) {
        recommendations.push(`儲存空間使用率偏高 (${usagePercent.toFixed(1)}%)，建議先匯出備份`);
      }
    }

    const now = Date.now();
    if (!lastBackup) {
      recommendations.push('尚未建立本機備份，建議先匯出 JSON');
    } else if (now - Number(lastBackup) > 7 * 24 * 60 * 60 * 1000) {
      recommendations.push('距離上次備份已超過 7 天，建議重新備份');
    }

    let isPersisted;
    if (navigator.storage?.persisted) {
      isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        recommendations.push('建議啟用持久化儲存，降低瀏覽器清理導致資料遺失風險');
      }
    }

    return {
      isHealthy: issues.length === 0,
      totalKeys: keys.length,
      totalSize,
      storageQuota,
      lastBackup: lastBackup || undefined,
      isPersisted,
      issues,
      recommendations,
    };
  }

  async requestPersistentStorage() {
    if (!navigator.storage?.persist) return false;
    return navigator.storage.persist();
  }

  async recordBackup() {
    await this.setItem(DB_KEYS.LAST_BACKUP, Date.now());
  }
}
