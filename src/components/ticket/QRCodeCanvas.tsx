import React, { useRef, useEffect } from 'react';
import QRious from 'qrious';

interface QRCodeCanvasProps {
  text: string;
  size?: number;
}

export const QRCodeCanvas: React.FC<QRCodeCanvasProps> = ({ text, size = 180 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && text) {
      new QRious({
        element: canvasRef.current,
        value: text,
        size: size,
        level: 'H',
      });
    }
  }, [text, size]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-2xl shadow-sm border border-border"
    />
  );
};
