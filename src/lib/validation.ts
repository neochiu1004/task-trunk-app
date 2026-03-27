import type { ImportPayload } from "@/types/app";
import type { Ticket } from "@/types/ticket";

type ImportValidationResult =
  | { success: true; data: ImportPayload | Ticket[] }
  | { success: false; error: string };

export const validateImportData = (data: unknown): ImportValidationResult => {
  if (Array.isArray(data)) {
    return { success: true, data: data as Ticket[] };
  }

  if (!data || typeof data !== "object") {
    return { success: false, error: "資料格式非物件" };
  }

  return { success: true, data: data as ImportPayload };
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
