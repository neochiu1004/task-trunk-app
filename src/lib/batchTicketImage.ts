import QRious from 'qrious';

const BASE_WIDTH = 944;

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('無法載入版型圖片'));
  image.src = src;
});

const fitFontSize = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, initial: number) => {
  let size = initial;
  while (size > 16) {
    ctx.font = `700 ${size}px Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
};

const formatExpiry = (value: string | null): string => {
  if (!value) return '';
  return value.replace(/-/g, '.').replace(/\//g, '.');
};

/** Produces an image for the supplied 944px-wide voucher screenshot layout. */
export const renderBatchTicketImage = async (source: string, name: string, serial: string, expiry: string | null) => {
  const image = await loadImage(source);
  const scale = image.width / BASE_WIDTH;
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('瀏覽器不支援圖片產生');
  ctx.drawImage(image, 0, 0);
  ctx.save();
  ctx.scale(scale, scale);

  ctx.fillStyle = '#fff';
  ctx.fillRect(120, 805, 704, 105);
  const nameSize = fitFontSize(ctx, name, 680, 38);
  ctx.font = `700 ${nameSize}px Arial, sans-serif`;
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 472, 855, 680);

  ctx.fillStyle = '#fff';
  ctx.fillRect(300, 910, 344, 275);
  const qrCanvas = document.createElement('canvas');
  new QRious({ element: qrCanvas, value: serial, size: 245, level: 'H' });
  ctx.drawImage(qrCanvas, 349, 920, 245, 245);

  ctx.fillStyle = '#fff';
  ctx.fillRect(180, 1190, 584, 82);
  ctx.font = `700 28px Arial, sans-serif`;
  ctx.fillStyle = '#333';
  ctx.fillText(`序號：${serial}`, 472, 1232, 570);

  ctx.fillStyle = '#fff';
  ctx.fillRect(190, 1380, 560, 115);
  ctx.font = '700 34px Arial, sans-serif';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.fillText(formatExpiry(expiry), 225, 1440, 500);
  ctx.restore();
  return canvas.toDataURL('image/webp', 0.92);
};
