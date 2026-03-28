import type { ImportPayload } from '@/types/app';
import type { Ticket } from '@/types/ticket';

type ImportValidationResult =
  | { success: true; data: ImportPayload | Ticket[] }
  | { success: false; error: string };

export const validateImportData = (data: unknown): ImportValidationResult => {
  if (!data || typeof data !== 'object') {
    return { success: false, error: '資料格式非物件' };
  }

  if (Array.isArray(data)) {
    return { success: true, data: data as Ticket[] };
  }

  const normalized = data as ImportPayload;
  if (normalized.tasks != null && !Array.isArray(normalized.tasks)) {
    return { success: false, error: 'tasks 格式錯誤' };
  }
  if (normalized.templates != null && !Array.isArray(normalized.templates)) {
    return { success: false, error: 'templates 格式錯誤' };
  }
  if (normalized.bgHistory != null && !Array.isArray(normalized.bgHistory)) {
    return { success: false, error: 'bgHistory 格式錯誤' };
  }
  if (normalized.settings != null && typeof normalized.settings !== 'object') {
    return { success: false, error: 'settings 格式錯誤' };
  }

  return { success: true, data: normalized };
};

export const isValidHttpUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateRedeemUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url) return { valid: false, error: '網址為空' };
  if (!isValidUrl(url)) {
    return { valid: false, error: '無效的網址格式' };
  }
  return { valid: true };
};
