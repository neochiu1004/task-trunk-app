import { Ticket, Settings } from '../types/ticket';

export const validateTicket = (ticket: Partial<Ticket>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!ticket.productName) errors.push('缺少品名');
  if (!ticket.serialNumber) errors.push('缺少序號');
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSettings = (settings: Partial<Settings>): boolean => {
  if (!settings) return false;
  return true;
};

export const validateImportData = (data: any): { success: boolean; data?: any; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { success: false, error: '資料格式非物件' };
  }
  // 保持原始資料夾與票券結構驗證
  if (!data.tasks && !data.settings) {
    return { success: false, error: '缺少必要的資料結構 (tasks/settings)' };
  }
  return { success: true, data };
};

export const isValidGasUrl = (url: string): boolean => {
  if (!url) return false;
  // CR-修正：增加對 /exec 結尾的官方網址支援
  const gasRegex = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec(\?.*)?$/;
  const legacyGasRegex = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+$/;
  return gasRegex.test(url) || legacyGasRegex.test(url);
};

export const validateBackupData = (data: any): boolean => {
  return !!(data && typeof data === 'object');
};
