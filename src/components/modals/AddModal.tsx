import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, LayoutDashboard, Image as ImageIcon, Maximize2, Search, Loader2 } from 'lucide-react';
import { Template } from '@/types/ticket';
import { generateId } from '@/lib/helpers';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ImageUpload } from '@/components/ui/image-upload';
import { TagSelectInput } from '../ticket/TagSelectInput';
import { scanBarcodeFromImage } from '@/lib/barcodeScanner';
import { useToast } from '@/hooks/use-toast';
import { WebImageSearch } from '@/components/ui/web-image-search';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTags: string[];
  specificViewKeywords: string[];
  templates: Template[];
  onDeleteTemplate: (id: string) => void;
  onAddBatch: (tickets: Array<{
    id: string;
    productName: string;
    serial: string;
    expiry: string;
    image: string;
    originalImage?: string;
    images: string[];
    tags: string[];
    barcodeFormat?: string;
    completed: boolean;
    completedAt?: number;
    isDeleted: boolean;
    deletedAt?: number;
    createdAt: number;
  }>) => void;
}

export const AddModal: React.FC<AddModalProps> = ({
  isOpen,
  onClose,
  allTags,
  specificViewKeywords,
  templates,
  onDeleteTemplate,
  onAddBatch,
}) => {
  const { toast } = useToast();
  const [manualData, setManualData] = useState({ name: '', serial: '', expiry: '' });
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [originalImage, setOriginalImage] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState<string | undefined>(undefined);
  const [isScanning, setIsScanning] = useState(false);
  const [showWebSearch, setShowWebSearch] = useState(false);

  const applyTemplate = (tpl: Template) => {
    setManualData((prev) => ({ ...prev, name: tpl.productName }));
    if (tpl.image) setImages([tpl.image]);
    if (tpl.tags && tpl.tags.length > 0) setManualTags(tpl.tags);
  };

  const handleOriginalImageChange = async (base64: string) => {
    setOriginalImage(base64);
    
    // Scan for barcode in the background
    if (base64) {
      setIsScanning(true);
      try {
        const result = await scanBarcodeFromImage(base64);
        if (result) {
          setManualData(prev => ({ ...prev, serial: result.content }));
          setBarcodeFormat(result.format);
          toast({
            title: "條碼偵測成功",
            description: `格式: ${result.format}，內容: ${result.content.substring(0, 20)}${result.content.length > 20 ? '...' : ''}`,
          });
        }
      } catch (error) {
        console.error('Barcode scan failed:', error);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleManualSubmit = () => {
    if (!manualData.name.trim()) {
      alert('請輸入票券名稱');
      return;
    }
    const newTicket = {
      id: generateId(),
      productName: manualData.name.trim(),
      serial: manualData.serial.trim(),
      expiry: manualData.expiry.replace(/-/g, '/'),
      image: images[0] || '',
      originalImage: originalImage,
      images: images,
      tags: manualTags,
      barcodeFormat: barcodeFormat,
      completed: false,
      isDeleted: false,
      createdAt: Date.now(),
    };
    onAddBatch([newTicket]);
    setManualData({ name: '', serial: '', expiry: '' });
    setManualTags([]);
    setImages([]);
    setOriginalImage('');
    setBarcodeFormat(undefined);
    onClose();
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.04, duration: 0.2 }
    }),
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="新增票券"
    >
      <div className="space-y-4">
        {/* Templates */}
        {templates && templates.length > 0 && (
          <motion.div
            custom={0}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="mb-2"
          >
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <LayoutDashboard size={12} /> 快速套用範本
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {templates.map((tpl) => (
                <motion.div
                  key={tpl.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => applyTemplate(tpl)}
                  className="shrink-0 flex items-center gap-2 glass-card rounded-xl p-1.5 pr-3 cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden">
                    {tpl.image ? (
                      <img src={tpl.image} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <ImageIcon size={12} className="text-primary/30" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-foreground max-w-[80px] truncate">{tpl.label}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTemplate(tpl.id);
                    }}
                    className="text-muted-foreground/50 hover:text-ticket-warning p-0.5"
                  >
                    <X size={12} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Image Uploads */}
        <motion.div
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">封面縮圖</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowWebSearch(true)}
                className="text-[10px] text-primary flex items-center gap-1 hover:underline"
              >
                <Search size={10} /> 網路搜尋
              </motion.button>
            </div>
            <ImageUpload
              value={images[0] || ''}
              onChange={(base64) => setImages([base64])}
              onClear={() => setImages([])}
              type="thumbnail"
            />
          </div>
          <div className="space-y-1 relative">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">核銷原圖</span>
              {isScanning && (
                <Loader2 size={10} className="animate-spin text-primary" />
              )}
            </div>
            <ImageUpload
              value={originalImage}
              onChange={handleOriginalImageChange}
              onClear={() => {
                setOriginalImage('');
                setBarcodeFormat(undefined);
              }}
              type="original"
            />
          </div>
        </motion.div>

        {/* Web Image Search Modal */}
        <WebImageSearch
          isOpen={showWebSearch}
          onClose={() => setShowWebSearch(false)}
          onSelectImage={(base64) => setImages([base64])}
        />

        {/* Name Input */}
        <motion.input
          custom={2}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="w-full p-3.5 glass-card rounded-xl outline-none font-medium focus:ring-2 focus:ring-primary/30 transition-all"
          placeholder="票券名稱 (必填)"
          value={manualData.name}
          onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
        />

        {/* Tags */}
        <motion.div
          custom={3}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <TagSelectInput
            allTags={allTags}
            selectedTags={manualTags}
            onTagsChange={setManualTags}
            extraSuggestions={specificViewKeywords}
          />
        </motion.div>

        {/* Serial Input */}
        <motion.input
          custom={4}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="w-full p-3.5 glass-card rounded-xl outline-none font-mono text-sm focus:ring-2 focus:ring-primary/30 transition-all"
          placeholder="序號/代碼"
          value={manualData.serial}
          onChange={(e) => setManualData({ ...manualData, serial: e.target.value })}
        />

        {/* Expiry Input */}
        <motion.div
          custom={5}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1"
        >
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">兌換期限</label>
          <input
            type="date"
            className="w-full p-3.5 glass-card rounded-xl outline-none text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/30 transition-all"
            value={manualData.expiry}
            onChange={(e) => setManualData({ ...manualData, expiry: e.target.value })}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.button
          custom={6}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          whileTap={{ scale: 0.98 }}
          onClick={handleManualSubmit}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-semibold shadow-lg transition-all"
        >
          確認新增
        </motion.button>
      </div>
    </ResponsiveModal>
  );
};