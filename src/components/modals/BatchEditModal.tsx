import React, { useState } from 'react';
import {
  X,
  Tag,
  Pencil,
  Calendar,
  ImagePlus,
  LayoutDashboard,
  Eraser,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { Template } from '@/types/ticket';
import { compressImage } from '@/lib/helpers';
import { TagSelectInput } from '../ticket/TagSelectInput';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onBatchEdit: (payload: {
    tagsToAdd: string[];
    clearTags: boolean;
    name: string;
    expiry: string;
    image: string;
  }) => void;
  allTags: string[];
  templates: Template[];
  onDeleteTemplate: (id: string) => void;
}

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onBatchEdit,
  allTags,
  templates,
  onDeleteTemplate,
}) => {
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [clearTags, setClearTags] = useState(false);
  const [newName, setNewName] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newImage, setNewImage] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onBatchEdit({
      tagsToAdd,
      clearTags,
      name: newName,
      expiry: newExpiry,
      image: newImage,
    });
    onClose();
  };

  const applyTemplate = (tpl: Template) => {
    setNewName(tpl.productName);
    if (tpl.image) setNewImage(tpl.image);
    if (tpl.tags && tpl.tags.length > 0) {
      setTagsToAdd(tpl.tags);
      setClearTags(true);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-foreground/60 z-50 flex items-end sm:items-center justify-center animate-fade-in overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full sm:w-[420px] sm:rounded-3xl rounded-t-[32px] p-6 shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-black text-foreground">批量編輯</h2>
            <p className="text-xs font-bold text-muted-foreground">已選取 {selectedCount} 張票券</p>
          </div>
          <button onClick={onClose} className="p-2 bg-muted rounded-full text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
          {templates && templates.length > 0 && (
            <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10">
              <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                <LayoutDashboard size={12} /> 套用範本 (自動清除舊標籤)
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className="shrink-0 flex items-center gap-2 bg-card border border-primary/20 rounded-xl p-1 pr-2 cursor-pointer hover:bg-primary/10 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden">
                      {tpl.image ? (
                        <img src={tpl.image} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={12} className="text-primary/30" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-primary max-w-[80px] truncate">{tpl.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-muted p-3 rounded-2xl">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <Pencil size={12} /> 修改名稱
            </label>
            <input
              className="w-full p-2 bg-card border border-border rounded-xl outline-none text-sm font-bold"
              placeholder="留空則保持不變"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div className="bg-muted p-3 rounded-2xl">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <Calendar size={12} /> 修改期限
            </label>
            <input
              type="date"
              className="w-full p-2 bg-card border border-border rounded-xl outline-none text-sm font-bold"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
            />
          </div>

          <div className="bg-muted p-3 rounded-2xl">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <ImagePlus size={12} /> 修改縮圖
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-card border border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                {newImage ? (
                  <img src={newImage} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={16} className="text-muted-foreground" />
                )}
              </div>
              <label className="flex-1 px-4 py-2 bg-card border border-border text-muted-foreground text-xs font-bold rounded-xl cursor-pointer text-center hover:bg-muted transition-colors">
                更換圖片
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const b64 = await compressImage(file, 'thumbnail');
                      setNewImage(b64);
                    }
                  }}
                />
              </label>
              {newImage && (
                <button onClick={() => setNewImage('')} className="text-ticket-warning p-2">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Tag size={12} /> 標籤編輯
              </label>
              <button
                onClick={() => setClearTags(!clearTags)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                  clearTags ? 'bg-ticket-warning text-white' : 'bg-muted/80 text-muted-foreground'
                }`}
              >
                <Eraser size={12} /> {clearTags ? '清除原標籤' : '保留原標籤'}
              </button>
            </div>
            <TagSelectInput allTags={allTags} selectedTags={tagsToAdd} onTagsChange={setTagsToAdd} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-muted font-bold rounded-2xl text-muted-foreground"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3.5 bg-primary font-bold rounded-2xl text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
          >
            確認儲存
          </button>
        </div>
      </div>
    </div>
  );
};
