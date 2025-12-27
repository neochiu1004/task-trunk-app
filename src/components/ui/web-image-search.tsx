import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { ResponsiveModal } from './responsive-modal';
import { Input } from './input';
import { Button } from './button';

interface WebImageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (base64: string) => void;
}

export const WebImageSearch: React.FC<WebImageSearchProps> = ({
  isOpen,
  onClose,
  onSelectImage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('無法載入圖片');
      
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onSelectImage(base64);
        handleClose();
      };
      
      reader.onerror = () => {
        setError('圖片轉換失敗');
      };
      
      reader.readAsDataURL(blob);
    } catch (err) {
      // Try using a CORS proxy or direct image element
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = imageUrl;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        ctx.drawImage(img, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        onSelectImage(base64);
        handleClose();
      } catch (proxyErr) {
        setError('無法載入圖片，請確認網址正確或嘗試其他圖片');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setImageUrl('');
    setError('');
    setPreviewUrl('');
    onClose();
  };

  const handlePreview = () => {
    if (imageUrl.trim()) {
      setPreviewUrl(imageUrl.trim());
    }
  };

  const openGoogleSearch = () => {
    const query = encodeURIComponent(searchQuery || '票券 優惠券');
    window.open(`https://www.google.com/search?q=${query}&tbm=isch`, '_blank');
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="網路圖片搜尋"
      description="搜尋網路圖片或直接貼上圖片網址"
    >
      <div className="space-y-4">
        {/* Google Search Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            步驟 1: 搜尋圖片
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="輸入搜尋關鍵字..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && openGoogleSearch()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={openGoogleSearch}
              className="shrink-0 flex items-center gap-1"
            >
              <ExternalLink size={14} />
              Google搜尋
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            點擊搜尋後，右鍵複製圖片網址
          </p>
        </div>

        {/* URL Input Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            步驟 2: 貼上圖片網址
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              disabled={!imageUrl.trim()}
              className="shrink-0"
            >
              預覽
            </Button>
          </div>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-border overflow-hidden bg-muted/30"
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-48 object-contain"
                onError={() => setError('圖片預覽失敗')}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-destructive text-center"
          >
            {error}
          </motion.p>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleUrlSubmit}
          disabled={!imageUrl.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              載入中...
            </>
          ) : (
            <>
              <ImageIcon size={16} className="mr-2" />
              使用此圖片
            </>
          )}
        </Button>
      </div>
    </ResponsiveModal>
  );
};
