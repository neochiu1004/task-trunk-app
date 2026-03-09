import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Link, Pencil, Check, Hash } from 'lucide-react';
import { Template, RedeemUrlPreset } from '@/types/ticket';
import { TemplatePreviewPopover } from './TemplatePreviewPopover';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface DraggableTemplateListProps {
  templates: Template[];
  redeemUrlPresets?: RedeemUrlPreset[];
  allTags?: string[];
  onApplyTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string) => void;
  onReorderTemplates: (fromIndex: number, toIndex: number) => void;
  onRenameTemplate: (id: string, newLabel: string) => void;
  onEditTemplate?: (id: string, updates: Partial<Omit<Template, 'id'>>) => void;
}

export const DraggableTemplateList: React.FC<DraggableTemplateListProps> = ({
  templates,
  redeemUrlPresets,
  allTags,
  onApplyTemplate,
  onDeleteTemplate,
  onReorderTemplates,
  onRenameTemplate,
  onEditTemplate,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (!previewId) return;
    const handleClickOutside = () => setPreviewId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [previewId]);

  const startLongPress = useCallback((tplId: string) => {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setPreviewId(tplId);
    }, 500);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleMoveToPosition = (fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex) {
      onReorderTemplates(fromIndex, toIndex);
    }
  };

  const renderPreviewPopover = (tpl: Template) => {
    if (previewId !== tpl.id) return null;
    return (
      <TemplatePreviewPopover
        template={tpl}
        redeemUrlPresets={redeemUrlPresets}
        allTags={allTags}
        onEdit={(id, updates) => {
          if (onEditTemplate) onEditTemplate(id, updates);
        }}
        onClose={() => setPreviewId(null)}
      />
    );
  };

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 items-center">
      {templates.map((tpl, index) => {
        const presetLabel = tpl.redeemUrlPresetId
          ? redeemUrlPresets?.find((p) => p.id === tpl.redeemUrlPresetId)?.label
          : undefined;

        return (
          <div
            key={tpl.id}
            className="template-item shrink-0 flex flex-col glass-card rounded-xl p-1.5 cursor-pointer transition-all min-w-[90px] relative"
            onMouseDown={() => startLongPress(tpl.id)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={() => {
              if (editingId !== tpl.id) startLongPress(tpl.id);
            }}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            onClick={() => {
              if (longPressTriggeredRef.current) {
                longPressTriggeredRef.current = false;
                return;
              }
              if (editingId !== tpl.id && !previewId) onApplyTemplate(tpl);
            }}
          >
            <AnimatePresence>
              {renderPreviewPopover(tpl)}
            </AnimatePresence>

            <div className="flex items-center gap-1.5">
              {/* Position Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => { e.stopPropagation(); cancelLongPress(); }}
                    className="shrink-0 w-5 h-5 rounded bg-muted/60 border border-border text-[10px] font-bold text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center justify-center transition-colors"
                  >
                    {index + 1}
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[120px]">
                  {templates.map((_, toIdx) => (
                    <DropdownMenuItem
                      key={toIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveToPosition(index, toIdx);
                      }}
                      className={`text-xs gap-2 ${toIdx === index ? 'bg-primary/10 font-bold text-primary' : ''}`}
                    >
                      <Hash size={10} />
                      位置 {toIdx + 1}
                      {toIdx === index && <span className="ml-auto text-[10px] text-muted-foreground">目前</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                {tpl.image ? (
                  <img src={tpl.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <ImageIcon size={10} className="text-primary/30" />
                )}
              </div>

              {editingId === tpl.id ? (
                <input
                  ref={editInputRef}
                  className="text-xs font-semibold text-foreground max-w-[60px] bg-background/80 border border-primary/30 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary/50"
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => { e.stopPropagation(); cancelLongPress(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (editingLabel.trim()) {
                        onRenameTemplate(tpl.id, editingLabel.trim());
                      }
                      setEditingId(null);
                    } else if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                  onBlur={() => {
                    if (editingLabel.trim() && editingLabel.trim() !== tpl.label) {
                      onRenameTemplate(tpl.id, editingLabel.trim());
                    }
                    setEditingId(null);
                  }}
                />
              ) : (
                <span className="text-xs font-semibold text-foreground max-w-[50px] truncate flex-1">
                  {tpl.label}
                </span>
              )}

              {editingId === tpl.id ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editingLabel.trim()) {
                      onRenameTemplate(tpl.id, editingLabel.trim());
                    }
                    setEditingId(null);
                  }}
                  onMouseDown={(e) => { e.stopPropagation(); cancelLongPress(); }}
                  className="shrink-0 text-primary p-0.5"
                >
                  <Check size={12} />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(tpl.id);
                    setEditingLabel(tpl.label);
                  }}
                  onMouseDown={(e) => { e.stopPropagation(); cancelLongPress(); }}
                  className="shrink-0 text-muted-foreground/40 hover:text-primary p-0.5"
                >
                  <Pencil size={10} />
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTemplate(tpl.id);
                }}
                onMouseDown={(e) => { e.stopPropagation(); cancelLongPress(); }}
                className="shrink-0 text-muted-foreground/50 hover:text-ticket-warning p-0.5"
              >
                <X size={12} />
              </motion.button>
            </div>

            {presetLabel && (
              <div className="flex items-center gap-1 mt-1 pl-5">
                <Link size={8} className="text-primary/50" />
                <span className="text-[9px] text-primary/70 truncate">{presetLabel}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
