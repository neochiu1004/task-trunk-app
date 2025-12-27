import React, { useState } from 'react';
import { X, Plus, Trash2, ImagePlus, Pencil, Tag, Calendar, LayoutDashboard, Image as ImageIcon, Maximize2, Eraser } from 'lucide-react';
import { Template } from '@/types/ticket';
import { compressImage, generateId } from '@/lib/helpers';
import { TagSelectInput } from '../ticket/TagSelectInput';

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
  const [manualData, setManualData] = useState({ name: '', serial: '', expiry: '' });
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [originalImage, setOriginalImage] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 'thumbnail');
        setImages([base64]);
      } catch (err) {
        alert('處理圖片時發生錯誤');
      }
    }
  };

  const handleOriginalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 'original');
        setOriginalImage(base64);
      } catch (err) {
        alert('處理圖片時發生錯誤');
      }
    }
  };

  const applyTemplate = (tpl: Template) => {
    setManualData((prev) => ({ ...prev, name: tpl.productName }));
    if (tpl.image) setImages([tpl.image]);
    if (tpl.tags && tpl.tags.length > 0) setManualTags(tpl.tags);
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
      completed: false,
      isDeleted: false,
      createdAt: Date.now(),
    };
    onAddBatch([newTicket]);
    setManualData({ name: '', serial: '', expiry: '' });
    setManualTags([]);
    setImages([]);
    setOriginalImage('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-foreground/60 z-50 flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card w-full sm:w-[420px] sm:rounded-3xl rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-black text-foreground">新增票券</h2>
          <button onClick={onClose} className="p-2 bg-muted rounded-full text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {templates && templates.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                <LayoutDashboard size={12} /> 快速套用範本
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className="shrink-0 flex items-center gap-2 bg-muted border border-border rounded-xl p-1 pr-2 cursor-pointer hover:bg-muted/80 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden">
                      {tpl.image ? (
                        <img src={tpl.image} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={12} className="text-primary/30" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground max-w-[80px] truncate">{tpl.label}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTemplate(tpl.id);
                      }}
                      className="text-primary/20 hover:text-ticket-warning p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="w-full aspect-square bg-muted border border-dashed border-border rounded-2xl flex items-center justify-center relative overflow-hidden group">
                {images.length > 0 ? (
                  <img src={images[0]} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground gap-1">
                    <ImageIcon size={24} />
                    <span className="text-[9px] font-bold">封面縮圖</span>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              <div className="text-[10px] font-bold text-center text-muted-foreground">列表顯示 (範本)</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="w-full aspect-square bg-muted border border-dashed border-border rounded-2xl flex items-center justify-center relative overflow-hidden group">
                {originalImage ? (
                  <img src={originalImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground gap-1">
                    <Maximize2 size={24} />
                    <span className="text-[9px] font-bold">核銷原圖</span>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleOriginalImageUpload}
                />
              </div>
              <div className="text-[10px] font-bold text-center text-muted-foreground">全螢幕 (不存範本)</div>
            </div>
          </div>

          <input
            className="w-full p-3.5 bg-muted rounded-xl outline-none font-bold"
            placeholder="票券名稱 (必填)"
            value={manualData.name}
            onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
          />
          <TagSelectInput
            allTags={allTags}
            selectedTags={manualTags}
            onTagsChange={setManualTags}
            extraSuggestions={specificViewKeywords}
          />
          <input
            className="w-full p-3.5 bg-muted rounded-xl outline-none font-mono text-sm"
            placeholder="序號/代碼"
            value={manualData.serial}
            onChange={(e) => setManualData({ ...manualData, serial: e.target.value })}
          />
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">兌換期限</label>
            <input
              type="date"
              className="w-full p-3.5 bg-muted rounded-xl outline-none text-sm font-bold text-foreground"
              value={manualData.expiry}
              onChange={(e) => setManualData({ ...manualData, expiry: e.target.value })}
            />
          </div>
          <button
            onClick={handleManualSubmit}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all"
          >
            確認新增
          </button>
        </div>
      </div>
    </div>
  );
};
