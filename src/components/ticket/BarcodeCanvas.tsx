import React, { useRef, useEffect } from 'react';
// @ts-ignore
import bwipjs from 'bwip-js';

interface BarcodeCanvasProps {
  text: string;
}

export const BarcodeCanvas: React.FC<BarcodeCanvasProps> = ({ text }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && text) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: text,
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: 'center',
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [text]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full h-auto rounded-lg shadow-sm border border-border bg-white p-1"
    />
  );
};
