import React, { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';

interface TagSelectInputProps {
  allTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  extraSuggestions?: string[];
}

export const TagSelectInput: React.FC<TagSelectInputProps> = ({
  allTags,
  selectedTags,
  onTagsChange,
  extraSuggestions = [],
}) => {
  const [inputVal, setInputVal] = useState('');

  const availableSuggestions = useMemo(() => {
    return [...new Set([...allTags, ...(extraSuggestions || [])])];
  }, [allTags, extraSuggestions]);

  const handleAdd = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
    setInputVal('');
  };

  const handleRemove = (tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => handleRemove(tag, e)}
              className="hover:text-primary/80 p-0.5 rounded-full hover:bg-primary/20"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 relative">
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="新增標籤..."
          className="flex-1 p-3 bg-muted rounded-xl text-sm border-none focus:ring-2 focus:ring-primary outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputVal.trim()) handleAdd(inputVal.trim());
          }}
        />
        <button
          onClick={() => inputVal.trim() && handleAdd(inputVal.trim())}
          className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
        </button>
        {inputVal && (
          <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl z-20 max-h-32 overflow-y-auto">
            {availableSuggestions
              .filter((t) => t.includes(inputVal) && !selectedTags.includes(t))
              .map((t) => (
                <button
                  key={t}
                  onClick={() => handleAdd(t)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-muted font-medium text-foreground"
                >
                  {t}
                </button>
              ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {availableSuggestions
          .filter((t) => !selectedTags.includes(t))
          .slice(0, 8)
          .map((t) => (
            <button
              key={t}
              onClick={() => handleAdd(t)}
              className="text-xs font-bold bg-muted text-muted-foreground px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-muted/80 transition-colors"
            >
              + {t}
            </button>
          ))}
      </div>
    </div>
  );
};
