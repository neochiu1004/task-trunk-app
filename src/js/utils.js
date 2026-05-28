export const DB_KEYS = {
  TASKS: 'wallet_tasks_v3',
  SETTINGS: 'wallet_settings_v3',
  BG_HISTORY: 'wallet_bg_history_v3',
  TEMPLATES: 'wallet_templates_v3',
  EXPIRY_NOTIFIED: 'wallet_expiry_notified_v3',
  LAST_BACKUP: 'lastBackupTime',
};

export const defaultViewConfig = {
  backgroundImage: '',
  backgroundImages: [],
  showBackground: true,
  cardOpacity: 0.95,
  bgOpacity: 1,
  cardBgColor: '#ffffff',
  cardBorderColor: '#e2e8f0',
  cardHeight: 0,
  gridImageHeight: 84,
  thumbnailScale: 100,
  gridColumns: 2,
  showThumbnail: true,
  ultraCompactCard: false,
};

export const defaultSettings = {
  tgToken: '',
  tgChatId: '',
  notifyDays: 7,
  appTitle: '輕鬆票券',
  swipeGesturesEnabled: true,
  swipeTriggerDistance: 72,
  specificViewKeywords: ['MOMO', '85度C'],
  viewConfigs: {
    active: { ...defaultViewConfig },
    completed: { ...defaultViewConfig },
    deleted: { ...defaultViewConfig },
  },
  redeemUrlPresets: [],
  defaultTemplateId: '',
  quickTags: [],
  localBackupFileName: 'ticket_backup',
};

export const BARCODE_FORMATS = [
  { value: '', label: '自動 / 未指定' },
  { value: 'CODE_128', label: 'CODE_128' },
  { value: 'CODE_39', label: 'CODE_39' },
  { value: 'CODE_93', label: 'CODE_93' },
  { value: 'EAN_13', label: 'EAN_13' },
  { value: 'EAN_8', label: 'EAN_8' },
  { value: 'UPC_A', label: 'UPC_A' },
  { value: 'UPC_E', label: 'UPC_E' },
  { value: 'ITF', label: 'ITF' },
  { value: 'PDF_417', label: 'PDF_417' },
  { value: 'DATA_MATRIX', label: 'DATA_MATRIX' },
  { value: 'AZTEC', label: 'AZTEC' },
  { value: 'CODABAR', label: 'CODABAR' },
  { value: 'QR_CODE', label: 'QR_CODE' },
];

export function generateId() {
  return `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeDateInput(value) {
  if (!value) return '';
  return value.replace(/[.\-]/g, '/');
}

export function checkIsExpiringSoon(expiryStr, thresholdDays = 7) {
  if (!expiryStr) return false;
  const normalizedDate = normalizeDateInput(expiryStr);
  const expiryDate = new Date(normalizedDate);
  if (Number.isNaN(expiryDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= thresholdDays && diffDays >= -1;
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  const date = formatDate(timestamp);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
}

export function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function parseTags(tagInput) {
  if (!tagInput) return [];
  return [...new Set(
    tagInput
      .split(/[#,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
  )];
}

export function tagsToText(tags) {
  return (tags || []).join(', ');
}

export function isValidUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function validateImportData(data) {
  if (!data || typeof data !== 'object') {
    return { success: false, error: '資料格式非物件' };
  }

  const normalized = Array.isArray(data) ? { tasks: data } : { ...data };

  if (!Array.isArray(normalized.tasks) && Array.isArray(normalized[DB_KEYS.TASKS])) {
    normalized.tasks = normalized[DB_KEYS.TASKS];
  }
  if (!normalized.settings && normalized[DB_KEYS.SETTINGS] && typeof normalized[DB_KEYS.SETTINGS] === 'object') {
    normalized.settings = normalized[DB_KEYS.SETTINGS];
  }
  if (!Array.isArray(normalized.templates) && Array.isArray(normalized[DB_KEYS.TEMPLATES])) {
    normalized.templates = normalized[DB_KEYS.TEMPLATES];
  }
  if (!Array.isArray(normalized.bgHistory) && Array.isArray(normalized[DB_KEYS.BG_HISTORY])) {
    normalized.bgHistory = normalized[DB_KEYS.BG_HISTORY];
  }
  if (!normalized.expiryNotified && normalized[DB_KEYS.EXPIRY_NOTIFIED] && typeof normalized[DB_KEYS.EXPIRY_NOTIFIED] === 'object') {
    normalized.expiryNotified = normalized[DB_KEYS.EXPIRY_NOTIFIED];
  }

  if (!Array.isArray(normalized.tasks)) {
    return { success: false, error: '找不到可匯入的票券陣列 (tasks)' };
  }
  if (normalized.tasks.some((item) => !item || typeof item !== 'object')) {
    return { success: false, error: 'tasks 內容必須是物件陣列' };
  }
  if (normalized.settings != null && typeof normalized.settings !== 'object') {
    return { success: false, error: 'settings 格式錯誤' };
  }
  if (normalized.templates != null && !Array.isArray(normalized.templates)) {
    return { success: false, error: 'templates 格式錯誤' };
  }
  if (normalized.bgHistory != null && !Array.isArray(normalized.bgHistory)) {
    return { success: false, error: 'bgHistory 格式錯誤' };
  }
  if (normalized.expiryNotified != null && typeof normalized.expiryNotified !== 'object') {
    return { success: false, error: 'expiryNotified 格式錯誤' };
  }

  return { success: true, data: normalized };
}

export function normalizeTicket(ticket) {
  const now = Date.now();
  const normalized = {
    id: ticket.id || generateId(),
    productName: ticket.productName || '',
    serial: ticket.serial || '',
    expiry: ticket.expiry || '',
    image: ticket.image || '',
    originalImage: ticket.originalImage || '',
    images: Array.isArray(ticket.images) ? ticket.images : [],
    tags: Array.isArray(ticket.tags) ? ticket.tags.filter(Boolean) : [],
    note: ticket.note || '',
    barcodeFormat: ticket.barcodeFormat || '',
    completed: !!ticket.completed,
    completedAt: ticket.completedAt || undefined,
    isDeleted: !!ticket.isDeleted,
    deletedAt: ticket.deletedAt || undefined,
    createdAt: ticket.createdAt || now,
    redeemUrl: ticket.redeemUrl || '',
    pinned: !!ticket.pinned,
  };
  if (normalized.completed && !normalized.completedAt) {
    normalized.completedAt = now;
  }
  if (normalized.isDeleted && !normalized.deletedAt) {
    normalized.deletedAt = now;
  }
  return normalized;
}

export async function compressImage(fileOrUrl, type = 'thumbnail') {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    let objectUrl = null;

    img.onload = () => {
      if (img.width * img.height > 16000000) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error('Image resolution too high'));
        return;
      }

      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (type === 'thumbnail') {
        const max = 800;
        if (width > max || height > max) {
          const ratio = width / height;
          if (width > height) {
            width = max;
            height = max / ratio;
          } else {
            height = max;
            width = max * ratio;
          }
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      if (objectUrl) URL.revokeObjectURL(objectUrl);
      const quality = type === 'original' ? 0.92 : 0.7;
      resolve(canvas.toDataURL('image/webp', quality));
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      objectUrl = URL.createObjectURL(fileOrUrl);
      img.src = objectUrl;
    }
  });
}

let lastToastTimer = null;
export function showToast(message, variant = 'info', durationMs = 2200) {
  const toast = document.getElementById('toast');
  const textNode = document.getElementById('toast-message');
  if (!toast || !textNode) return;

  textNode.textContent = message;
  toast.classList.remove('toast-hide', 'opacity-0', 'bg-red-600', 'bg-emerald-700', 'bg-wabi-primary');
  if (variant === 'error') {
    toast.classList.add('bg-red-600');
  } else if (variant === 'success') {
    toast.classList.add('bg-emerald-700');
  } else {
    toast.classList.add('bg-wabi-primary');
  }
  toast.classList.add('toast-show');

  if (lastToastTimer) clearTimeout(lastToastTimer);
  const showDuration = Number.isFinite(Number(durationMs)) ? Math.max(300, Number(durationMs)) : 2200;
  lastToastTimer = setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => toast.classList.add('opacity-0'), 280);
  }, showDuration);
}

let lastTelegramMessageTime = 0;
const TELEGRAM_MIN_INTERVAL_MS = 1000;

export async function sendTelegramMessage(token, chatId, text) {
  if (!token || !chatId) return { success: false, error: 'Missing token or chat_id' };

  const now = Date.now();
  if (now - lastTelegramMessageTime < TELEGRAM_MIN_INTERVAL_MS) {
    return { success: false, error: 'Rate limited - please wait' };
  }
  lastTelegramMessageTime = now;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${encodeURIComponent(chatId)}&text=${encodeURIComponent(text)}&parse_mode=Markdown`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.ok) return { success: true };
    return { success: false, error: data.description || 'Telegram API error' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getOrCreateClientInstallId() {
  try {
    const storageKey = 'wallet_client_install_id_v1';
    const existing = window.localStorage?.getItem(storageKey);
    if (existing) return existing;
    const nextId = `client-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage?.setItem(storageKey, nextId);
    return nextId;
  } catch (_error) {
    return `client-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function getClientSourceLabel() {
  if (typeof window === 'undefined') return 'unknown-source';

  const ua = navigator.userAgent || '';
  const platform = /iPhone|iPad|iPod/i.test(ua)
    ? 'iPhone'
    : /Android/i.test(ua)
      ? 'Android'
      : /Macintosh|Mac OS X/i.test(ua)
        ? 'Mac'
        : /Windows/i.test(ua)
          ? 'Windows'
          : 'Browser';
  const browser = /CriOS|Chrome/i.test(ua)
    ? 'Chrome'
    : /FxiOS|Firefox/i.test(ua)
      ? 'Firefox'
      : /Safari/i.test(ua) && !/Chrome|CriOS|Chromium/i.test(ua)
        ? 'Safari'
        : 'Web';
  const displayMode = window.matchMedia?.('(display-mode: standalone)')?.matches ? 'App' : 'Web';
  const installId = getOrCreateClientInstallId();
  return `${platform}/${browser}/${displayMode}/${installId}`;
}

export async function forceRefreshToLatest() {
  if (typeof window === 'undefined') return;

  if (!navigator.onLine) {
    throw new Error('目前離線，請連上網路後再試一次。');
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(async (registration) => {
        try {
          await registration.update();
        } catch (_error) {
          return;
        }
      })
    );
    await Promise.all(
      registrations.map(async (registration) => {
        try {
          await registration.unregister();
        } catch (_error) {
          return;
        }
      })
    );
  }

  if ('caches' in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('refresh', Date.now().toString());
  window.location.replace(nextUrl.toString());
}
