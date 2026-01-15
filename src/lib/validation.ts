export const validateImportData = (data: any): { success: boolean; data?: any; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { success: false, error: '資料格式非物件' };
  }
  return { success: true, data };
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
