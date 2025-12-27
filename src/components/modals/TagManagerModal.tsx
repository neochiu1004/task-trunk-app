import React from 'react';
import { Trash2 } from 'lucide-react';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
  onDeleteTag: (tag: string) => void;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  tags,
  onDeleteTag,
}) => {
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-sm rounded-3xl p-6 max-h-[60vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-black mb-4 text-foreground">管理標籤</h2>
        {tags.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 font-bold">目前沒有標籤</p>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex justify-between items-center bg-muted p-3 rounded-xl border border-border"
              >
                <span className="font-bold text-foreground text-sm">#{tag}</span>
                <button
                  onClick={() => onDeleteTag(tag)}
                  className="text-ticket-warning hover:text-ticket-warning/80 p-2 bg-card rounded-lg shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-muted text-muted-foreground rounded-2xl font-bold hover:bg-muted/80 transition-colors"
        >
          關閉
        </button>
      </div>
    </div>
  );
};
