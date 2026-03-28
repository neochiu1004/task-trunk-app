import React, { useRef, useEffect } from 'react';
// @ts-ignore
import bwipjs from 'bwip-js';
import { getBcidFromFormat } from '@/lib/barcodeScanner';

interface BarcodeCanvasProps {
  text: string;
  format?: string;
}

export const BarcodeCanvas: React.FC<BarcodeCanvasProps> = ({ text, format }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && text) {
      try {
        const bcid = getBcidFromFormat(format);
        // Some formats like qrcode are handled by QRCodeCanvas, fallback to code128
        const safeBcid = ['qrcode', 'datamatrix', 'azteccode', 'pdf417', 'maxicode'].includes(bcid) 
          ? 'code128' 
          : bcid;
        
        bwipjs.toCanvas(canvasRef.current, {
          bcid: safeBcid,
          text: text,
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: 'center',
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
        // Fallback to code128 if the format fails
        try {
          bwipjs.toCanvas(canvasRef.current, {
            bcid: 'code128',
            text: text,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: 'center',
          });
        } catch (fallbackError) {
          console.error('Fallback barcode generation also failed:', fallbackError);
        }
      }
    }
  }, [text, format]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full h-auto rounded-lg shadow-sm border border-border bg-white p-1"
    />
  );
};
