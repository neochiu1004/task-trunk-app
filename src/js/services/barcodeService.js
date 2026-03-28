import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

const DEFAULT_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.PDF_417,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.AZTEC,
  BarcodeFormat.CODABAR,
];

const FORMAT_NAME_MAP = Object.entries(BarcodeFormat).reduce((map, [name, value]) => {
  if (typeof value === 'number') {
    map[name] = value;
  }
  return map;
}, {});

const readerCache = new Map();

function createHints(formats = DEFAULT_FORMATS) {
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
  return hints;
}

function getReader(formats = DEFAULT_FORMATS) {
  const key = formats.join(',');
  if (!readerCache.has(key)) {
    readerCache.set(key, new BrowserMultiFormatReader(createHints(formats)));
  }
  return readerCache.get(key);
}

function getFormatsToTry(preferredFormat) {
  const normalized = String(preferredFormat || '').trim().toUpperCase();
  const preferred = FORMAT_NAME_MAP[normalized];
  if (!preferred) return [DEFAULT_FORMATS];
  return [[preferred], DEFAULT_FORMATS];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function cropRegion(img, x, y, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
  return canvas;
}

async function scanSingle(source, preferredFormat) {
  const formatsToTry = getFormatsToTry(preferredFormat);

  for (const formats of formatsToTry) {
    try {
      const result = await getReader(formats).decodeFromImageElement(source);
      return {
        content: result.getText(),
        format: BarcodeFormat[result.getBarcodeFormat()],
      };
    } catch {
      // Keep trying with the next format set.
    }
  }

  return null;
}

export async function scanMultipleBarcodesFromImage(imageDataUrl, options = {}) {
  const results = [];
  const seen = new Set();
  const preferredFormat = options.preferredFormat;
  const img = await loadImage(imageDataUrl);

  const addResult = (r) => {
    if (r && !seen.has(r.content)) {
      seen.add(r.content);
      results.push(r);
    }
  };

  addResult(await scanSingle(img, preferredFormat));

  try {
    const w = img.width;
    const h = img.height;

    const regions = [
      { x: 0, y: 0, w, h: Math.floor(h / 2) },
      { x: 0, y: Math.floor(h / 2), w, h: Math.floor(h / 2) },
      { x: 0, y: 0, w: Math.floor(w / 2), h },
      { x: Math.floor(w / 2), y: 0, w: Math.floor(w / 2), h },
      { x: 0, y: 0, w: Math.floor(w / 2), h: Math.floor(h / 2) },
      { x: Math.floor(w / 2), y: 0, w: Math.floor(w / 2), h: Math.floor(h / 2) },
      { x: 0, y: Math.floor(h / 2), w: Math.floor(w / 2), h: Math.floor(h / 2) },
      { x: Math.floor(w / 2), y: Math.floor(h / 2), w: Math.floor(w / 2), h: Math.floor(h / 2) },
    ];

    const regionResults = await Promise.all(
      regions.map((r) => scanSingle(cropRegion(img, r.x, r.y, r.w, r.h), preferredFormat))
    );
    regionResults.forEach(addResult);
  } catch (_error) {
    // Ignore secondary scan failures.
  }

  return results;
}
