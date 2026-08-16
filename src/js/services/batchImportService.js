import QRious from 'qrious';
import { generateId, normalizeDateInput } from '../utils.js';
import batchTemplateImage from '../../assets/batch-ticket-template.png';

const BATCH_TAG = '批量生成';
export const BATCH_IMAGE_VERSION = 4;
const BASE_WIDTH = 944;
const BASE_HEIGHT = 2048;

export function validateBatchRows(data) {
  if (!Array.isArray(data)) return { success: false, error: '批量資料必須是 JSON 陣列' };
  const errors = [];
  const rows = data.map((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`第 ${index + 1} 筆不是物件`);
      return null;
    }
    const ticketNumber = typeof item.ticketNumber === 'string' ? item.ticketNumber.trim() : '';
    const productName = typeof item.productName === 'string' ? item.productName.trim() : '';
    const expiryDate = item.expiryDate == null ? '' : String(item.expiryDate).trim();
    const buyer = typeof item.buyer === 'string' ? item.buyer.trim() : '';
    if (!ticketNumber) errors.push(`第 ${index + 1} 筆缺少 ticketNumber`);
    if (!productName) errors.push(`第 ${index + 1} 筆缺少 productName`);
    return { ticketNumber, productName, expiryDate, buyer };
  }).filter(Boolean);

  if (errors.length) {
    return { success: false, error: errors.slice(0, 8).join('；') + (errors.length > 8 ? '；其餘錯誤略' : '') };
  }
  return { success: true, data: rows };
}

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('無法載入版型圖片'));
  image.src = src;
});

const fitFontSize = (ctx, text, maxWidth, initial) => {
  let size = initial;
  while (size > 16) {
    ctx.font = `700 ${size}px Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
};

export async function renderBatchTicketImage(source = batchTemplateImage, name, serial, expiry) {
  const image = await loadImage(source);
  const scaleX = image.width / BASE_WIDTH;
  const scaleY = image.height / BASE_HEIGHT;
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('瀏覽器不支援圖片產生');
  ctx.drawImage(image, 0, 0);
  ctx.save();
  // 以固定版型的 944x2048 座標系定位，但保留上傳圖片完整尺寸與比例。
  ctx.scale(scaleX, scaleY);

  ctx.fillStyle = '#fff';
  ctx.fillRect(120, 805, 704, 105);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#222';
  ctx.font = `700 ${fitFontSize(ctx, name, 680, 38)}px Arial, sans-serif`;
  ctx.fillText(name, 472, 855, 680);

  ctx.fillStyle = '#fff';
  ctx.fillRect(300, 910, 344, 275);
  const qrCanvas = document.createElement('canvas');
  new QRious({ element: qrCanvas, value: serial, size: 245, level: 'H' });
  ctx.drawImage(qrCanvas, 349, 920, 245, 245);

  ctx.fillStyle = '#fff';
  ctx.fillRect(180, 1190, 584, 82);
  ctx.fillStyle = '#333';
  ctx.font = '700 28px Arial, sans-serif';
  ctx.fillText(`序號：${serial}`, 472, 1232, 570);

  ctx.fillStyle = '#fff';
  // 期限所在列位於商品描述列下方，避免覆蓋後文字落在上一列。
  ctx.fillRect(190, 1400, 560, 150);
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.font = '700 34px Arial, sans-serif';
  const expiryText = normalizeDateInput(expiry || '').replace(/\//g, '.') || '無期限';
  ctx.fillText(expiryText, 225, 1490, 500);
  ctx.restore();
  return canvas.toDataURL('image/webp', 0.92);
}

export async function buildBatchTickets(rows, existingTickets = []) {
  const existingSerials = new Set(existingTickets.filter((ticket) => !ticket.isDeleted && ticket.serial).map((ticket) => ticket.serial));
  const seen = new Set();
  let duplicates = 0;
  const tickets = [];
  for (const row of rows) {
    if (existingSerials.has(row.ticketNumber) || seen.has(row.ticketNumber)) duplicates += 1;
    seen.add(row.ticketNumber);
    const image = await renderBatchTicketImage(batchTemplateImage, row.productName, row.ticketNumber, row.expiryDate);
    tickets.push({
      id: generateId(),
      productName: row.productName,
      serial: row.ticketNumber,
      expiry: normalizeDateInput(row.expiryDate || ''),
      image,
      originalImage: batchTemplateImage,
      images: [image],
      batchImageVersion: BATCH_IMAGE_VERSION,
      tags: [BATCH_TAG, ...(row.buyer ? [row.buyer] : [])],
      barcodeFormat: 'QR_CODE',
      completed: false,
      isDeleted: false,
      createdAt: Date.now(),
    });
  }
  return { tickets, duplicates };
}

export async function refreshBatchTicketImages(tasks) {
  let changed = false;
  const refreshedTasks = await Promise.all(tasks.map(async (ticket) => {
    if (ticket.isDeleted || !(ticket.tags || []).includes(BATCH_TAG) || !ticket.serial || ticket.batchImageVersion === BATCH_IMAGE_VERSION) {
      return ticket;
    }
    try {
      const image = await renderBatchTicketImage(undefined, ticket.productName || '', ticket.serial, ticket.expiry || '');
      changed = true;
      return { ...ticket, image, images: [image], batchImageVersion: BATCH_IMAGE_VERSION };
    } catch (_error) {
      return ticket;
    }
  }));
  return { tasks: refreshedTasks, changed };
}
