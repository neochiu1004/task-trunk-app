export const compressImage = (
  fileOrUrl: File | string,
  type: 'thumbnail' | 'original' = 'thumbnail'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';

    let objectUrl: string | null = null;

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
      ctx?.drawImage(img, 0, 0, width, height);

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
};

export const checkIsExpiringSoon = (expiryStr: string | undefined, thresholdDays: number = 7): boolean => {
  if (!expiryStr) return false;
  const normalizedDate = expiryStr.replace(/[.\-]/g, '/');
  const expiryDate = new Date(normalizedDate);
  if (isNaN(expiryDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= thresholdDays && diffDays >= -1;
};

export const formatTime = (timestamp: number | undefined): string => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
};

export const formatDateTime = (timestamp: number | undefined): string => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  const datePart = `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
  const timePart = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return `${datePart} ${timePart}`;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
};

export const sendTelegramMessage = async (
  token: string,
  chatId: string,
  text: string
): Promise<{ success: boolean; error?: string }> => {
  if (!token || !chatId) return { success: false, error: 'Missing token or chat_id' };
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}&parse_mode=Markdown`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.description };
    }
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

export const generateId = (): string => {
  return `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
