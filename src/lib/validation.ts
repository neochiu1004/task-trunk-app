import type { BatchTicketInput, ImportPayload } from '@/types/app';
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

export type BatchTicketValidation =
  | { success: true; data: BatchTicketInput[] }
  | { success: false; error: string };

export const validateBatchTicketData = (data: unknown): BatchTicketValidation => {
  if (!Array.isArray(data)) return { success: false, error: '批量票券資料必須是 JSON 陣列' };
  const errors: string[] = [];
  const normalized = data.map((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`第 ${index + 1} 筆不是物件`);
      return null;
    }
    const row = item as Record<string, unknown>;
    const ticketNumber = typeof row.ticketNumber === 'string' ? row.ticketNumber.trim() : '';
    const productName = typeof row.productName === 'string' ? row.productName.trim() : '';
    const expiryDate = row.expiryDate == null ? null : String(row.expiryDate).trim() || null;
    const buyer = typeof row.buyer === 'string' ? row.buyer.trim() : '';
    if (!ticketNumber) errors.push(`第 ${index + 1} 筆缺少 ticketNumber`);
    if (!productName) errors.push(`第 ${index + 1} 筆缺少 productName`);
    return { ticketNumber, productName, expiryDate, buyer: buyer || undefined };
  }).filter((item): item is BatchTicketInput => item !== null);

  return errors.length > 0
    ? { success: false, error: errors.slice(0, 8).join('；') + (errors.length > 8 ? '；其餘錯誤略' : '') }
    : { success: true, data: normalized };
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
