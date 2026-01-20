import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Link, GripVertical } from 'lucide-react';
import { Template, RedeemUrlPreset } from '@/types/ticket';

interface DraggableTemplateListProps {
  templates: Template[];
  redeemUrlPresets?: RedeemUrlPreset[];
  onApplyTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string) => void;
  onReorderTemplates: (fromIndex: number, toIndex: number) => void;
}

export const DraggableTemplateList: React.FC<DraggableTemplateListProps> = ({
  templates,
  redeemUrlPresets,
  onApplyTemplate,
  onDeleteTemplate,
  onReorderTemplates,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
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

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    // Only activate drag mode if touching the grip area
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle')) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
      setTouchedIndex(index);
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
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
              className={`template-item shrink-0 flex flex-col glass-card rounded-xl p-1.5 cursor-pointer transition-all min-w-[90px] ${
                isDragging ? 'opacity-50 scale-95' : ''
              } ${isTouched ? 'scale-105 shadow-lg' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => onApplyTemplate(tpl)}
            >
              <div className="flex items-center gap-1.5">
                {/* Drag Handle */}
                <div 
                  className="drag-handle shrink-0 text-muted-foreground/40 hover:text-primary cursor-grab active:cursor-grabbing touch-none"
                  onClick={(e) => e.stopPropagation()}
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
                
                <span className="text-xs font-semibold text-foreground max-w-[50px] truncate flex-1">
                  {tpl.label}
                </span>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTemplate(tpl.id);
                  }}
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
