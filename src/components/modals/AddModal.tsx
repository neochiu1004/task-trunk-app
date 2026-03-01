import React, { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Plus, LayoutDashboard, Image as ImageIcon, Maximize2, Search, Loader2, ScanLine, RotateCcw, Link } from 'lucide-react';
import { Template, RedeemUrlPreset } from '@/types/ticket';
import { generateId } from '@/lib/helpers';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ImageUpload } from '@/components/ui/image-upload';
import { TagSelectInput } from '../ticket/TagSelectInput';
import { RedeemUrlPresetSelect } from '../ticket/RedeemUrlPresetSelect';
import { DraggableTemplateList } from '../ticket/DraggableTemplateList';
import { scanMultipleBarcodesFromImage, ScanResult } from '@/lib/barcodeScanner';
import { useToast } from '@/hooks/use-toast';
import { WebImageSearch } from '@/components/ui/web-image-search';
import { BarcodeSelectModal } from '../ticket/BarcodeSelectModal';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTags: string[];
  specificViewKeywords: string[];
  templates: Template[];
  onDeleteTemplate: (id: string) => void;
  onReorderTemplate: (fromIndex: number, toIndex: number) => void;
  onRenameTemplate: (id: string, newLabel: string) => void;
  onEditTemplate?: (id: string, updates: Partial<Omit<Template, 'id'>>) => void;
  redeemUrlPresets?: RedeemUrlPreset[];
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
    redeemUrl?: string;
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
  onReorderTemplate,
  onRenameTemplate,
  onEditTemplate,
  redeemUrlPresets,
  onAddBatch,
}) => {
  const { toast } = useToast();
  const [manualData, setManualData] = useState({ name: '', serial: '', expiry: '', redeemUrl: '' });
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [originalImage, setOriginalImage] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState<string | undefined>(undefined);
  const [isScanning, setIsScanning] = useState(false);
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [isScanningSerial, setIsScanningSerial] = useState(false);
  const [hasAppliedTemplate, setHasAppliedTemplate] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Multi-barcode selection state
  const [pendingBarcodes, setPendingBarcodes] = useState<ScanResult[]>([]);
  const [showBarcodeSelect, setShowBarcodeSelect] = useState(false);

  const applyBarcode = (result: ScanResult) => {
    setManualData(prev => ({ ...prev, serial: result.content }));
    setBarcodeFormat(result.format);
    toast({
      title: "條碼已套用",
      description: `格式: ${result.format}，內容: ${result.content.substring(0, 20)}${result.content.length > 20 ? '...' : ''}`,
    });
  };

  const handleScanResults = (results: ScanResult[]) => {
    if (results.length === 0) return;
    if (results.length === 1) {
      applyBarcode(results[0]);
    } else {
      setPendingBarcodes(results);
      setShowBarcodeSelect(true);
    }
  };

  const applyTemplate = (tpl: Template) => {
    const resolvedUrl = tpl.redeemUrlPresetId 
      ? redeemUrlPresets?.find(p => p.id === tpl.redeemUrlPresetId)?.url 
      : undefined;
    
    setManualData((prev) => ({ 
      ...prev, 
      name: tpl.productName,
      serial: tpl.serial || prev.serial,
      expiry: tpl.expiry || prev.expiry,
      redeemUrl: resolvedUrl || prev.redeemUrl
    }));
    if (tpl.image) setImages([tpl.image]);
    if (tpl.tags && tpl.tags.length > 0) setManualTags(tpl.tags);
    setHasAppliedTemplate(true);
  };

  const clearTemplateData = () => {
    setManualData({ name: '', serial: '', expiry: '', redeemUrl: '' });
    setManualTags([]);
    setImages([]);
    setOriginalImage('');
    setBarcodeFormat(undefined);
    setHasAppliedTemplate(false);
    toast({
      title: "已清除",
      description: "所有範本資料已清除",
    });
  };

  const handleOriginalImageChange = async (base64: string) => {
    setOriginalImage(base64);
    
    if (base64) {
      setIsScanning(true);
      try {
        const results = await scanMultipleBarcodesFromImage(base64);
        if (results.length > 0) {
          handleScanResults(results);
        }
      } catch (error) {
        console.error('Barcode scan failed:', error);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleStandaloneScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanningSerial(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          const results = await scanMultipleBarcodesFromImage(base64);
          if (results.length > 0) {
            handleScanResults(results);
          } else {
            toast({
              title: "未偵測到條碼",
              description: "請確保圖片中有清晰的條碼或QR碼",
              variant: "destructive",
            });
          }
        }
        setIsScanningSerial(false);
      };
      reader.onerror = () => {
        setIsScanningSerial(false);
        toast({
          title: "讀取失敗",
          description: "無法讀取選擇的圖片",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Standalone scan failed:', error);
      setIsScanningSerial(false);
    }
    
    if (scanInputRef.current) {
      scanInputRef.current.value = '';
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
      redeemUrl: manualData.redeemUrl.trim() || undefined,
      completed: false,
      isDeleted: false,
      createdAt: Date.now(),
    };
    onAddBatch([newTicket]);
    setManualData({ name: '', serial: '', expiry: '', redeemUrl: '' });
    setManualTags([]);
    setImages([]);
    setOriginalImage('');
    setBarcodeFormat(undefined);
    onClose();
  };

  return (
    <>
      <ResponsiveModal
        isOpen={isOpen}
        onClose={onClose}
        title="新增票券"
      >
        <div className="space-y-4 pb-8">
          {/* Templates */}
          {templates && templates.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard size={12} /> 快速套用範本
                </span>
                {hasAppliedTemplate && (
                  <button
                    onClick={clearTemplateData}
                    className="flex items-center gap-1 text-ticket-warning hover:text-ticket-warning/80 transition-colors"
                  >
                    <RotateCcw size={10} /> 清除資料
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                <DraggableTemplateList
                  templates={templates}
                  redeemUrlPresets={redeemUrlPresets}
                  allTags={allTags}
                  onApplyTemplate={applyTemplate}
                  onDeleteTemplate={onDeleteTemplate}
                  onReorderTemplates={onReorderTemplate}
                  onRenameTemplate={onRenameTemplate}
                  onEditTemplate={onEditTemplate}
                />
              </div>
            </div>
          )}

          {/* Image Uploads */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">封面縮圖</span>
                <button
                  onClick={() => setShowWebSearch(true)}
                  className="text-[10px] text-primary flex items-center gap-1 hover:underline"
                >
                  <Search size={10} /> 網路搜尋
                </button>
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
          </div>

          {/* Web Image Search Modal */}
          <WebImageSearch
            isOpen={showWebSearch}
            onClose={() => setShowWebSearch(false)}
            onSelectImage={(base64) => setImages([base64])}
          />

          {/* Name Input */}
          <div className="relative">
            <input
              className="w-full p-3.5 pr-10 glass-card rounded-xl outline-none font-medium text-base focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="票券名稱 (必填)"
              value={manualData.name}
              onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
            />
            {manualData.name && (
              <button
                type="button"
                onClick={() => setManualData({ ...manualData, name: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 text-foreground shadow-sm border border-border/50 transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Tags */}
          <div>
            <TagSelectInput
              allTags={allTags}
              selectedTags={manualTags}
              onTagsChange={setManualTags}
              extraSuggestions={specificViewKeywords}
            />
          </div>

          {/* Serial Input with Scan Button */}
          <div className="w-full max-w-full overflow-x-hidden">
            <div className="flex items-center gap-2 w-full max-w-full">
              <div className="relative flex-1 min-w-0">
                <input
                  className="w-full p-3.5 pr-10 glass-card rounded-xl outline-none font-mono text-base focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="序號/代碼"
                  value={manualData.serial}
                  onChange={(e) => setManualData({ ...manualData, serial: e.target.value })}
                />
                {manualData.serial && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualData({ ...manualData, serial: '' });
                      setBarcodeFormat(undefined);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 text-foreground shadow-sm border border-border/50 transition-colors"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <input
                ref={scanInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleStandaloneScan}
              />
              <button
                onClick={() => scanInputRef.current?.click()}
                disabled={isScanningSerial}
                className="shrink-0 p-3.5 glass-card rounded-xl text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                title="掃描條碼圖片"
              >
                {isScanningSerial ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ScanLine size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Expiry Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">兌換期限</label>
            <input
              type="date"
              className="w-full p-3.5 glass-card rounded-xl outline-none text-base font-medium text-foreground focus:ring-2 focus:ring-primary/30 transition-all"
              value={manualData.expiry}
              onChange={(e) => setManualData({ ...manualData, expiry: e.target.value })}
            />
          </div>

          {/* Redeem URL */}
          <div>
            <RedeemUrlPresetSelect
              presets={redeemUrlPresets || []}
              value={manualData.redeemUrl}
              onChange={(url) => setManualData({ ...manualData, redeemUrl: url })}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleManualSubmit}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-semibold shadow-lg transition-all active:scale-[0.98]"
          >
            確認新增
          </button>
        </div>
      </ResponsiveModal>

      {/* Barcode Selection Modal */}
      <BarcodeSelectModal
        isOpen={showBarcodeSelect}
        onClose={() => setShowBarcodeSelect(false)}
        results={pendingBarcodes}
        onSelect={applyBarcode}
      />
    </>
  );
};
