import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

function createHints() {
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
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
  ]);
  return hints;
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
  return canvas.toDataURL('image/png');
}

async function scanSingle(dataUrl) {
  try {
    const codeReader = new BrowserMultiFormatReader(createHints());
    const img = await loadImage(dataUrl);
    const result = await codeReader.decodeFromImageElement(img);
    return {
      content: result.getText(),
      format: BarcodeFormat[result.getBarcodeFormat()],
    };
  } catch {
    return null;
  }
}

export async function scanMultipleBarcodesFromImage(imageDataUrl) {
  const results = [];
  const seen = new Set();

  const addResult = (r) => {
    if (r && !seen.has(r.content)) {
      seen.add(r.content);
      results.push(r);
    }
  };

  addResult(await scanSingle(imageDataUrl));

  try {
    const img = await loadImage(imageDataUrl);
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

    const regionResults = await Promise.all(regions.map((r) => scanSingle(cropRegion(img, r.x, r.y, r.w, r.h))));
    regionResults.forEach(addResult);
  } catch (_error) {
    // Ignore secondary scan failures.
  }

  return results;
}
