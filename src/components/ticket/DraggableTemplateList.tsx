import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Link, GripVertical, Pencil, Check, Tag, Hash, Calendar, ExternalLink } from 'lucide-react';
import { Template, RedeemUrlPreset } from '@/types/ticket';

interface DraggableTemplateListProps {
  templates: Template[];
  redeemUrlPresets?: RedeemUrlPreset[];
  onApplyTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string) => void;
  onReorderTemplates: (fromIndex: number, toIndex: number) => void;
  onRenameTemplate: (id: string, newLabel: string) => void;
}

export const DraggableTemplateList: React.FC<DraggableTemplateListProps> = ({
  templates,
  redeemUrlPresets,
  onApplyTemplate,
  onDeleteTemplate,
  onReorderTemplates,
  onRenameTemplate,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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

  // Close preview on outside click
  useEffect(() => {
    if (!previewId) return;
    const handleClickOutside = () => setPreviewId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [previewId]);

  // Long press handlers
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    cancelLongPress();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex) {
      onReorderTemplates(fromIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Touch handling for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchedIndex, setTouchedIndex] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent, index: number, tplId: string) => {
    // Only activate drag mode if touching the grip area
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle')) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
      setTouchedIndex(index);
      e.preventDefault();
    } else if (!target.closest('button') && !target.closest('input')) {
      // Start long press for preview (not on buttons/inputs)
      startLongPress(tplId);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    cancelLongPress();
    if (touchedIndex === null || touchStartX === null) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = touch.clientY - touchStartY!;
    
    // If horizontal movement is significant, it's a scroll
    if (deltaX > 20) {
      setTouchedIndex(null);
      return;
    }
    
    // Find which template we're over
    const elements = document.querySelectorAll('.template-item');
    elements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        if (idx !== touchedIndex) {
          setDragOverIndex(idx);
        }
      }
    });
  };

  const handleTouchEnd = () => {
    cancelLongPress();
    if (touchedIndex !== null && dragOverIndex !== null && touchedIndex !== dragOverIndex) {
      onReorderTemplates(touchedIndex, dragOverIndex);
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchedIndex(null);
    setDragOverIndex(null);
  };

  const renderDropIndicator = (position: 'before' | 'after', index: number) => {
    const showBefore = position === 'before' && dragOverIndex === index && draggedIndex !== null && draggedIndex > index;
    const showAfter = position === 'after' && dragOverIndex === index && draggedIndex !== null && draggedIndex < index;
    
    if (!showBefore && !showAfter) return null;
    
    return (
      <div className="w-0.5 bg-primary rounded-full animate-pulse self-stretch min-h-[40px] shrink-0" />
    );
  };

  const renderPreviewPopover = (tpl: Template) => {
    if (previewId !== tpl.id) return null;
    
    const presetLabel = tpl.redeemUrlPresetId
      ? redeemUrlPresets?.find((p) => p.id === tpl.redeemUrlPresetId)?.label
      : undefined;
    const presetUrl = tpl.redeemUrlPresetId
      ? redeemUrlPresets?.find((p) => p.id === tpl.redeemUrlPresetId)?.url
      : undefined;

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
              {tpl.image ? (
                <img src={tpl.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <ImageIcon size={16} className="text-primary/30" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{tpl.label}</p>
              {tpl.productName !== tpl.label && (
                <p className="text-[10px] text-muted-foreground truncate">產品: {tpl.productName}</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5 pt-1 border-t border-border/30">
            {tpl.tags && tpl.tags.length > 0 && (
              <div className="flex items-start gap-1.5">
                <Tag size={10} className="text-primary/60 mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {tpl.tags.map((tag) => (
                    <span key={tag} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            
            {tpl.serial && (
              <div className="flex items-center gap-1.5">
                <Hash size={10} className="text-primary/60 shrink-0" />
                <span className="text-[10px] text-muted-foreground font-mono truncate">{tpl.serial}</span>
              </div>
            )}
            
            {tpl.expiry && (
              <div className="flex items-center gap-1.5">
                <Calendar size={10} className="text-primary/60 shrink-0" />
                <span className="text-[10px] text-muted-foreground">{tpl.expiry}</span>
              </div>
            )}
            
            {(presetLabel || presetUrl) && (
              <div className="flex items-center gap-1.5">
                <ExternalLink size={10} className="text-primary/60 shrink-0" />
                <span className="text-[10px] text-primary/70 truncate">{presetLabel || presetUrl}</span>
              </div>
            )}

            {!tpl.tags?.length && !tpl.serial && !tpl.expiry && !presetLabel && (
              <p className="text-[10px] text-muted-foreground/60 italic">無額外資料</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 items-center">
      {templates.map((tpl, index) => {
        const presetLabel = tpl.redeemUrlPresetId
          ? redeemUrlPresets?.find((p) => p.id === tpl.redeemUrlPresetId)?.label
          : undefined;

        const isDragging = draggedIndex === index;
        const isTouched = touchedIndex === index;

        return (
          <React.Fragment key={tpl.id}>
            {renderDropIndicator('before', index)}
            <div
              className={`template-item shrink-0 flex flex-col glass-card rounded-xl p-1.5 cursor-pointer transition-all min-w-[90px] relative ${
                isDragging ? 'opacity-50 scale-95' : ''
              } ${isTouched ? 'scale-105 shadow-lg' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index, tpl.id)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => startLongPress(tpl.id)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
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
                {/* Drag Handle */}
                <div 
                  className="drag-handle shrink-0 text-muted-foreground/40 hover:text-primary cursor-grab active:cursor-grabbing touch-none"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => { e.stopPropagation(); cancelLongPress(); }}
                >
                  <GripVertical size={12} />
                </div>
                
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
            {renderDropIndicator('after', index)}
          </React.Fragment>
        );
      })}
    </div>
  );
};
