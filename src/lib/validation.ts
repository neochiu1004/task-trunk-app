import { Ticket } from '../types/ticket';

export const validateImportData = (data: any): { success: boolean; data?: any; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { success: false, error: '資料格式非物件' };
  }
  return { success: true, data };
};

export const isValidGasUrl = (url: string): boolean => {
  if (!url) return false;
  // Match official Google Apps Script URLs, allowing /exec at the end
  const gasRegex = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec(\?.*)?$/;
  const legacyGasRegex = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+$/;
  return gasRegex.test(url) || legacyGasRegex.test(url);
};
