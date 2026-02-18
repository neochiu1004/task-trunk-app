import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType, Result } from '@zxing/library';

export interface ScanResult {
  content: string;
  format: string;
}

// Map ZXing format to bwip-js bcid
const formatToBcid: Record<string, string> = {
  'AZTEC': 'azteccode',
  'CODABAR': 'rationalizedCodabar',
  'CODE_39': 'code39',
  'CODE_93': 'code93',
  'CODE_128': 'code128',
  'DATA_MATRIX': 'datamatrix',
  'EAN_8': 'ean8',
  'EAN_13': 'ean13',
  'ITF': 'interleaved2of5',
  'MAXICODE': 'maxicode',
  'PDF_417': 'pdf417',
  'QR_CODE': 'qrcode',
  'RSS_14': 'databaromni',
  'RSS_EXPANDED': 'databarexpanded',
  'UPC_A': 'upca',
  'UPC_E': 'upce',
  'UPC_EAN_EXTENSION': 'ean13',
};

export const getBcidFromFormat = (format: string | undefined): string => {
  if (!format) return 'code128';
  return formatToBcid[format] || 'code128';
};

const createHints = () => {
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
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
};

// Crop a region of the image to a new canvas and return as data URL
const cropRegion = (
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
  return canvas.toDataURL('image/png');
};

// Scan a single image element, returns result or null
const scanSingle = async (dataUrl: string): Promise<ScanResult | null> => {
  try {
    const codeReader = new BrowserMultiFormatReader(createHints());
    const img = await loadImage(dataUrl);
    const result: Result = await codeReader.decodeFromImageElement(img);
    return {
      content: result.getText(),
      format: BarcodeFormat[result.getBarcodeFormat()],
    };
  } catch {
    return null;
  }
};

/**
 * Scan for multiple barcodes by dividing the image into overlapping regions.
 * Returns all unique barcodes found.
 */
export const scanMultipleBarcodesFromImage = async (imageDataUrl: string): Promise<ScanResult[]> => {
  const results: ScanResult[] = [];
  const seen = new Set<string>();

  const addResult = (r: ScanResult | null) => {
    if (r && !seen.has(r.content)) {
      seen.add(r.content);
      results.push(r);
    }
  };

  // First scan full image
  addResult(await scanSingle(imageDataUrl));

  // Then scan regions (halves and quadrants) to find more barcodes
  try {
    const img = await loadImage(imageDataUrl);
    const w = img.width;
    const h = img.height;

    // Define regions: top half, bottom half, left half, right half, 4 quadrants
    const regions = [
      { x: 0, y: 0, w, h: Math.floor(h / 2) },           // top half
      { x: 0, y: Math.floor(h / 2), w, h: Math.floor(h / 2) }, // bottom half
      { x: 0, y: 0, w: Math.floor(w / 2), h },           // left half
      { x: Math.floor(w / 2), y: 0, w: Math.floor(w / 2), h }, // right half
      { x: 0, y: 0, w: Math.floor(w / 2), h: Math.floor(h / 2) },                         // top-left
      { x: Math.floor(w / 2), y: 0, w: Math.floor(w / 2), h: Math.floor(h / 2) },         // top-right
      { x: 0, y: Math.floor(h / 2), w: Math.floor(w / 2), h: Math.floor(h / 2) },         // bottom-left
      { x: Math.floor(w / 2), y: Math.floor(h / 2), w: Math.floor(w / 2), h: Math.floor(h / 2) }, // bottom-right
    ];

    // Scan regions in parallel
    const regionPromises = regions.map(r => {
      const cropped = cropRegion(img, r.x, r.y, r.w, r.h);
      return scanSingle(cropped);
    });

    const regionResults = await Promise.all(regionPromises);
    regionResults.forEach(addResult);
  } catch (error) {
    console.log('Region scanning failed:', error);
  }

  return results;
};

// Keep backward compatibility - returns first result only
export const scanBarcodeFromImage = async (imageDataUrl: string): Promise<ScanResult | null> => {
  const results = await scanMultipleBarcodesFromImage(imageDataUrl);
  return results.length > 0 ? results[0] : null;
};
