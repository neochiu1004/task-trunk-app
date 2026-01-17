import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Pencil,
  Calendar,
  ImagePlus,
  LayoutDashboard,
  Image as ImageIcon,
  Eraser,
  Trash2,
  Check,
} from 'lucide-react';
import { Template, RedeemUrlPreset } from '@/types/ticket';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ImageUpload } from '@/components/ui/image-upload';
import { TagSelectInput } from '../ticket/TagSelectInput';
import { RedeemUrlPresetSelect } from '../ticket/RedeemUrlPresetSelect';

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
    redeemUrl: string;
    clearRedeemUrl: boolean;
  }) => void;
  allTags: string[];
  templates: Template[];
  onDeleteTemplate: (id: string) => void;
  redeemUrlPresets?: RedeemUrlPreset[];
}

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onBatchEdit,
  allTags,
  templates,
  onDeleteTemplate,
  redeemUrlPresets,
}) => {
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [clearTags, setClearTags] = useState(false);
  const [newName, setNewName] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newRedeemUrl, setNewRedeemUrl] = useState('');
  const [clearRedeemUrl, setClearRedeemUrl] = useState(false);

  const handleConfirm = () => {
    onBatchEdit({
      tagsToAdd,
      clearTags,
      name: newName,
      expiry: newExpiry,
      image: newImage,
      redeemUrl: newRedeemUrl,
      clearRedeemUrl,
    });
    // Reset state
    setTagsToAdd([]);
    setClearTags(false);
    setNewName('');
    setNewExpiry('');
    setNewImage('');
    setNewRedeemUrl('');
    setClearRedeemUrl(false);
    onClose();
  };

  const applyTemplate = (tpl: Template) => {
    setNewName(tpl.productName);
    if (tpl.image) setNewImage(tpl.image);
    if (tpl.tags && tpl.tags.length > 0) {
      setTagsToAdd(tpl.tags);
      setClearTags(true);
    }
    // Resolve preset ID to actual URL
    if (tpl.redeemUrlPresetId) {
      const resolvedUrl = redeemUrlPresets?.find(p => p.id === tpl.redeemUrlPresetId)?.url;
      if (resolvedUrl) setNewRedeemUrl(resolvedUrl);
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.2 }
    }),
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="批量編輯"
      description={`已選取 ${selectedCount} 張票券`}
    >
      <div className="space-y-4">
        {/* Templates */}
        <AnimatePresence>
          {templates && templates.length > 0 && (
            <motion.div
              custom={0}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="bg-primary/5 p-3 rounded-2xl border border-primary/10"
            >
              <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LayoutDashboard size={12} /> 套用範本 (自動清除舊標籤)
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {templates.map((tpl) => (
                  <motion.div
                    key={tpl.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => applyTemplate(tpl)}
                    className="shrink-0 flex items-center gap-2 glass-card rounded-xl p-1.5 pr-3 cursor-pointer hover:bg-primary/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden">
                      {tpl.image ? (
                        <img src={tpl.image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <ImageIcon size={12} className="text-primary/30" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-primary max-w-[80px] truncate">{tpl.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name */}
        <motion.div
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="glass-card p-3 rounded-2xl"
        >
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Pencil size={12} /> 修改名稱
          </label>
          <input
            className="w-full p-3 bg-background border border-border rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-primary/30 transition-all"
            placeholder="留空則保持不變"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </motion.div>

        {/* Expiry */}
        <motion.div
          custom={2}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="glass-card p-3 rounded-2xl"
        >
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar size={12} /> 修改期限
          </label>
          <input
            type="date"
            className="w-full p-3 bg-background border border-border rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-primary/30 transition-all"
            value={newExpiry}
            onChange={(e) => setNewExpiry(e.target.value)}
          />
        </motion.div>

        {/* Image */}
        <motion.div
          custom={3}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="glass-card p-3 rounded-2xl"
        >
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ImagePlus size={12} /> 修改縮圖
          </label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14">
              <ImageUpload
                value={newImage}
                onChange={setNewImage}
                onClear={() => setNewImage('')}
                type="thumbnail"
                className="h-full"
              />
            </div>
            {newImage && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setNewImage('')}
                className="p-2 text-ticket-warning glass-button rounded-xl"
              >
                <Trash2 size={16} />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Tags */}
        <motion.div
          custom={4}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="glass-card p-4 rounded-2xl space-y-3"
        >
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={12} /> 標籤編輯
            </label>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setClearTags(!clearTags)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                clearTags 
                  ? 'bg-ticket-warning text-primary-foreground' 
                  : 'glass-button text-muted-foreground'
              }`}
            >
              <AnimatePresence mode="wait">
                {clearTags ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check size={12} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="eraser"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Eraser size={12} />
                  </motion.div>
                )}
              </AnimatePresence>
              {clearTags ? '清除原標籤' : '保留原標籤'}
            </motion.button>
          </div>
          <TagSelectInput allTags={allTags} selectedTags={tagsToAdd} onTagsChange={setTagsToAdd} />
        </motion.div>

        {/* Redeem URL */}
        <motion.div
          custom={5}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="glass-card p-3 rounded-2xl space-y-2"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">核銷後跳轉網址</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setClearRedeemUrl(!clearRedeemUrl)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                clearRedeemUrl 
                  ? 'bg-ticket-warning text-primary-foreground' 
                  : 'glass-button text-muted-foreground'
              }`}
            >
              <AnimatePresence mode="wait">
                {clearRedeemUrl ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check size={12} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="eraser"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Eraser size={12} />
                  </motion.div>
                )}
              </AnimatePresence>
              {clearRedeemUrl ? '清除網址' : '保留網址'}
            </motion.button>
          </div>
          
          {!clearRedeemUrl && (
            <RedeemUrlPresetSelect
              presets={redeemUrlPresets || []}
              value={newRedeemUrl}
              onChange={setNewRedeemUrl}
              placeholder="留空則保持不變 (可用於行動支付連結)"
            />
          )}
          
          {clearRedeemUrl && (
            <p className="text-xs text-muted-foreground italic">將清除所有選取票券的網址</p>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          custom={6}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="flex gap-3 pt-2"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="flex-1 py-3.5 glass-card font-semibold rounded-2xl text-muted-foreground"
          >
            取消
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            className="flex-1 py-3.5 bg-primary font-semibold rounded-2xl text-primary-foreground shadow-lg"
          >
            確認儲存
          </motion.button>
        </motion.div>
      </div>
    </ResponsiveModal>
  );
};