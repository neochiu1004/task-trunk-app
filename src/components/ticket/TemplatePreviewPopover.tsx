import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon,
  Tag,
  Hash,
  Calendar,
  ExternalLink,
  Pencil,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { Template, RedeemUrlPreset } from '@/types/ticket';

interface TemplatePreviewPopoverProps {
  template: Template;
  redeemUrlPresets?: RedeemUrlPreset[];
  allTags?: string[];
  onEdit: (id: string, updates: Partial<Omit<Template, 'id'>>) => void;
  onClose: () => void;
}

export const TemplatePreviewPopover: React.FC<TemplatePreviewPopoverProps> = ({
  template,
  redeemUrlPresets,
  allTags = [],
  onEdit,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    label: template.label,
    productName: template.productName,
    image: template.image || '',
    tags: template.tags || [],
    serial: template.serial || '',
    expiry: template.expiry || '',
    redeemUrlPresetId: template.redeemUrlPresetId || '',
  });
  const [tagInput, setTagInput] = useState('');

  const presetLabel = template.redeemUrlPresetId
    ? redeemUrlPresets?.find((p) => p.id === template.redeemUrlPresetId)?.label
    : undefined;
  const presetUrl = template.redeemUrlPresetId
    ? redeemUrlPresets?.find((p) => p.id === template.redeemUrlPresetId)?.url
    : undefined;

  const availableTags = useMemo(
    () => [...new Set([...allTags])].filter((t) => !editData.tags.includes(t)),
    [allTags, editData.tags]
  );

  const handleSave = () => {
    onEdit(template.id, {
      label: editData.label.trim() || template.label,
      productName: editData.productName.trim() || template.productName,
      image: editData.image || undefined,
      tags: editData.tags.length > 0 ? editData.tags : undefined,
      serial: editData.serial.trim() || undefined,
      expiry: editData.expiry.trim() || undefined,
      redeemUrlPresetId: editData.redeemUrlPresetId || undefined,
    });
    setIsEditing(false);
    onClose();
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !editData.tags.includes(tag.trim())) {
      setEditData((prev) => ({ ...prev, tags: [...prev.tags, tag.trim()] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setEditData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 glass-card rounded-xl p-3 shadow-lg border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card border-r border-b border-border/50" />

        <div className="space-y-2.5 relative">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              編輯範本
            </span>
            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              >
                <X size={12} />
              </motion.button>
            </div>
          </div>

          {/* Image */}
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
              {editData.image ? (
                <img src={editData.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <ImageIcon size={16} className="text-primary/30" />
              )}
            </div>
            <div className="flex-1 flex gap-1">
              <label className="flex-1 py-1.5 text-[9px] font-semibold text-center text-primary bg-primary/10 rounded-lg hover:bg-primary/20 cursor-pointer">
                更換圖片
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const result = ev.target?.result as string;
                      if (result) setEditData((prev) => ({ ...prev, image: result }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {editData.image && (
                <button
                  onClick={() => setEditData((prev) => ({ ...prev, image: '' }))}
                  className="py-1.5 px-2 text-[9px] font-semibold text-muted-foreground bg-muted rounded-lg hover:bg-muted/80"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>

          {/* Label */}
          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-muted-foreground uppercase">顯示名稱</label>
            <input
              className="w-full px-2.5 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-lg outline-none focus:ring-1 focus:ring-primary/30"
              value={editData.label}
              onChange={(e) => setEditData((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="範本名稱"
            />
          </div>

          {/* Product Name */}
          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-muted-foreground uppercase">產品名稱</label>
            <input
              className="w-full px-2.5 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-lg outline-none focus:ring-1 focus:ring-primary/30"
              value={editData.productName}
              onChange={(e) => setEditData((prev) => ({ ...prev, productName: e.target.value }))}
              placeholder="產品名稱"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-muted-foreground uppercase">標籤</label>
            <div className="flex flex-wrap gap-1 mb-1">
              {editData.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-primary/70">
                    <X size={8} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                className="flex-1 px-2 py-1 text-[10px] bg-muted/50 border border-border/50 rounded-lg outline-none focus:ring-1 focus:ring-primary/30"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="新增標籤..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
              />
              <button
                onClick={() => addTag(tagInput)}
                disabled={!tagInput.trim()}
                className="p-1 text-primary disabled:text-muted-foreground/30"
              >
                <Plus size={12} />
              </button>
            </div>
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {availableTags.slice(0, 5).map((t) => (
                  <button
                    key={t}
                    onClick={() => addTag(t)}
                    className="text-[8px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full hover:bg-muted/80"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Serial */}
          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-muted-foreground uppercase">序號</label>
            <input
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-muted/50 border border-border/50 rounded-lg outline-none focus:ring-1 focus:ring-primary/30"
              value={editData.serial}
              onChange={(e) => setEditData((prev) => ({ ...prev, serial: e.target.value }))}
              placeholder="序號/代碼"
            />
          </div>

          {/* Expiry */}
          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-muted-foreground uppercase">到期日</label>
            <input
              type="date"
              className="w-full px-2.5 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-lg outline-none focus:ring-1 focus:ring-primary/30"
              value={editData.expiry ? editData.expiry.replace(/\//g, '-') : ''}
              onChange={(e) => setEditData((prev) => ({ ...prev, expiry: e.target.value.replace(/-/g, '/') }))}
            />
          </div>

          {/* Redeem URL Preset */}
          {redeemUrlPresets && redeemUrlPresets.length > 0 && (
            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-muted-foreground uppercase">核銷跳轉</label>
              <select
                className="w-full px-2.5 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-lg outline-none focus:ring-1 focus:ring-primary/30"
                value={editData.redeemUrlPresetId}
                onChange={(e) => setEditData((prev) => ({ ...prev, redeemUrlPresetId: e.target.value }))}
              >
                <option value="">無</option>
                {redeemUrlPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Save / Cancel buttons */}
          <div className="flex gap-2 pt-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(false)}
              className="flex-1 py-1.5 text-[10px] font-semibold text-muted-foreground bg-muted rounded-lg hover:bg-muted/80"
            >
              取消
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="flex-1 py-1.5 text-[10px] font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 flex items-center justify-center gap-1"
            >
              <Check size={10} /> 儲存
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // View mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 glass-card rounded-xl p-3 shadow-lg border border-border/50"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Arrow */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card border-r border-b border-border/50" />

      <div className="space-y-2 relative">
        {/* Header with image and name */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
            {template.image ? (
              <img src={template.image} className="w-full h-full object-cover" alt="" />
            ) : (
              <ImageIcon size={16} className="text-primary/30" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{template.label}</p>
            {template.productName !== template.label && (
              <p className="text-[10px] text-muted-foreground truncate">產品: {template.productName}</p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 pt-1 border-t border-border/30">
          {template.tags && template.tags.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Tag size={10} className="text-primary/60 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <span key={tag} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {template.serial && (
            <div className="flex items-center gap-1.5">
              <Hash size={10} className="text-primary/60 shrink-0" />
              <span className="text-[10px] text-muted-foreground font-mono truncate">{template.serial}</span>
            </div>
          )}

          {template.expiry && (
            <div className="flex items-center gap-1.5">
              <Calendar size={10} className="text-primary/60 shrink-0" />
              <span className="text-[10px] text-muted-foreground">{template.expiry}</span>
            </div>
          )}

          {(presetLabel || presetUrl) && (
            <div className="flex items-center gap-1.5">
              <ExternalLink size={10} className="text-primary/60 shrink-0" />
              <span className="text-[10px] text-primary/70 truncate">{presetLabel || presetUrl}</span>
            </div>
          )}

          {!template.tags?.length && !template.serial && !template.expiry && !presetLabel && (
            <p className="text-[10px] text-muted-foreground/60 italic">無額外資料</p>
          )}
        </div>

        {/* Edit button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="w-full mt-1 py-1.5 text-[10px] font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 flex items-center justify-center gap-1 transition-colors"
        >
          <Pencil size={10} /> 編輯範本
        </motion.button>
      </div>
    </motion.div>
  );
};
