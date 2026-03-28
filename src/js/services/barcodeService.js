import BarcodeFormat from '@zxing/library/esm/core/BarcodeFormat';

const GROUP_LOADERS = {
  qr: () => import('./barcodeReaders/qr.js'),
  oned: () => import('./barcodeReaders/oned.js'),
  pdf417: () => import('./barcodeReaders/pdf417.js'),
  datamatrix: () => import('./barcodeReaders/datamatrix.js'),
  aztec: () => import('./barcodeReaders/aztec.js'),
};

const DEFAULT_FORMATS_BY_GROUP = {
  qr: [BarcodeFormat.QR_CODE],
  oned: [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
  ],
  pdf417: [BarcodeFormat.PDF_417],
  datamatrix: [BarcodeFormat.DATA_MATRIX],
  aztec: [BarcodeFormat.AZTEC],
};

const COMMON_GROUPS = ['qr', 'oned'];
const EXTENDED_GROUPS = ['pdf417', 'datamatrix', 'aztec'];
const FORMAT_GROUPS = {
  QR_CODE: 'qr',
  CODE_128: 'oned',
  CODE_39: 'oned',
  CODE_93: 'oned',
  EAN_13: 'oned',
  EAN_8: 'oned',
  UPC_A: 'oned',
  UPC_E: 'oned',
  ITF: 'oned',
  CODABAR: 'oned',
  PDF_417: 'pdf417',
  DATA_MATRIX: 'datamatrix',
  AZTEC: 'aztec',
};

const FORMAT_NAME_MAP = Object.entries(BarcodeFormat).reduce((map, [name, value]) => {
  if (typeof value === 'number') {
    map[name] = value;
  }
  return map;
}, {});

const readerCache = new Map();
const moduleCache = new Map();

function normalizePreferredFormat(preferredFormat) {
  const normalized = String(preferredFormat || '').trim().toUpperCase();
  return normalized || null;
}

function getGroupsToTry(preferredFormat) {
  const preferredGroup = preferredFormat ? FORMAT_GROUPS[preferredFormat] : null;
  const ordered = [];

  if (preferredGroup) {
    ordered.push(preferredGroup);
  }

  for (const group of COMMON_GROUPS) {
    if (!ordered.includes(group)) ordered.push(group);
  }

  for (const group of EXTENDED_GROUPS) {
    if (!ordered.includes(group)) ordered.push(group);
  }

  return ordered;
}

function getFormatsToTry(group, preferredFormat) {
  const defaults = DEFAULT_FORMATS_BY_GROUP[group];
  const preferred = preferredFormat ? FORMAT_NAME_MAP[preferredFormat] : null;

  if (!preferred || !defaults.includes(preferred)) {
    return [defaults];
  }

  if (defaults.length === 1) {
    return [defaults];
  }

  return [[preferred], defaults];
}

async function loadGroupModule(group) {
  if (!moduleCache.has(group)) {
    moduleCache.set(group, GROUP_LOADERS[group]());
  }

  return moduleCache.get(group);
}

async function getReader(group, formats) {
  const key = `${group}:${formats.join(',')}`;
  if (!readerCache.has(key)) {
    const module = await loadGroupModule(group);
    readerCache.set(key, module.createReader(formats));
  }

  return readerCache.get(key);
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
  for (const group of getGroupsToTry(preferredFormat)) {
    for (const formats of getFormatsToTry(group, preferredFormat)) {
      try {
        const result = await (await getReader(group, formats)).decodeFromImageElement(source);
        return {
          content: result.getText(),
          format: BarcodeFormat[result.getBarcodeFormat()],
        };
      } catch {
        // Keep trying with the next group/format set.
      }
    }
  }

  return null;
}

export async function scanMultipleBarcodesFromImage(imageDataUrl, options = {}) {
  const results = [];
  const seen = new Set();
  const preferredFormat = normalizePreferredFormat(options.preferredFormat);
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
