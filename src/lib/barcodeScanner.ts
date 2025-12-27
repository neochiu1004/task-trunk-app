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

export const scanBarcodeFromImage = async (imageDataUrl: string): Promise<ScanResult | null> => {
  try {
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

    const codeReader = new BrowserMultiFormatReader(hints);
    
    // Create image element
    const img = new Image();
    img.src = imageDataUrl;
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });

    // Decode from image element using decodeFromImageElement
    const result: Result = await codeReader.decodeFromImageElement(img);
    
    const formatName = BarcodeFormat[result.getBarcodeFormat()];
    
    return {
      content: result.getText(),
      format: formatName,
    };
  } catch (error) {
    console.log('No barcode detected:', error);
    return null;
  }
};
