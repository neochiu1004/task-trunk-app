import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Link, Plus, X } from 'lucide-react';
import { RedeemUrlPreset } from '@/types/ticket';

interface RedeemUrlPresetSelectProps {
  presets: RedeemUrlPreset[];
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export const RedeemUrlPresetSelect: React.FC<RedeemUrlPresetSelectProps> = ({
  presets,
  value,
  onChange,
  placeholder = '留空則不跳轉 (可用於行動支付連結)',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (url: string) => {
    onChange(url);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-1">
        <Link size={10} /> 核銷後跳轉網址
      </label>
      
      <div className="relative">
        <input
          type="text"
          className="w-full p-3.5 pr-10 glass-card rounded-xl outline-none text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/30 transition-all"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onTouchStart={(e) => e.stopPropagation()}
          onFocus={(e) => {
            const target = e.target;
            target.style.touchAction = 'manipulation';
            requestAnimationFrame(() => {
              setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }, 350);
            });
          }}
        />
        
        {presets && presets.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors"
            type="button"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} />
            </motion.div>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && presets && presets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto z-50">
              {presets.map((preset) => (
                <motion.button
                  key={preset.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(preset.url)}
                  className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center gap-2 border-b border-border/50 last:border-b-0"
                  type="button"
                >
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Link size={12} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{preset.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate font-mono">{preset.url}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange('')}
          className="text-[10px] text-ticket-warning flex items-center gap-1 pl-1 hover:underline"
          type="button"
        >
          <X size={10} /> 清除網址
        </motion.button>
      )}
    </div>
  );
};
