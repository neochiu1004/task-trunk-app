import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Loader2, Check, X, Maximize2 } from 'lucide-react';
import { compressImage } from '@/lib/helpers';

interface ImageUploadProps {
  value: string;
  onChange: (base64: string) => void;
  onClear?: () => void;
  type: 'thumbnail' | 'original';
  label?: string;
  sublabel?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onClear,
  type,
  label,
  sublabel,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadSuccess(false);

    try {
      const base64 = await compressImage(file, type);
      onChange(base64);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 1500);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('處理圖片時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const IconComponent = type === 'original' ? Maximize2 : ImageIcon;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="w-full aspect-square glass-card rounded-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10"
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-[10px] font-semibold text-muted-foreground mt-2">處理中...</span>
            </motion.div>
          ) : uploadSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-ticket-success/20 backdrop-blur-sm z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                <Check className="w-10 h-10 text-ticket-success" />
              </motion.div>
              <span className="text-[10px] font-semibold text-ticket-success mt-1">上傳成功</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {value ? (
          <>
            <motion.img
              src={value}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            {onClear && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-ticket-warning text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={14} />
              </motion.button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground gap-1">
            <IconComponent size={24} />
            <span className="text-[9px] font-semibold">{label || (type === 'original' ? '核銷原圖' : '封面縮圖')}</span>
          </div>
        )}

        <input
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer"
          accept="image/*"
          onChange={handleUpload}
          disabled={isLoading}
        />
      </div>
      {sublabel && (
        <div className="text-[10px] font-medium text-center text-muted-foreground">{sublabel}</div>
      )}
    </div>
  );
};