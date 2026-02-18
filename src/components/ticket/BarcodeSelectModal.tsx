import React from 'react';
import { motion } from 'framer-motion';
import { ScanResult } from '@/lib/barcodeScanner';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ScanLine } from 'lucide-react';

interface BarcodeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ScanResult[];
  onSelect: (result: ScanResult) => void;
}

export const BarcodeSelectModal: React.FC<BarcodeSelectModalProps> = ({
  isOpen,
  onClose,
  results,
  onSelect,
}) => {
  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="選擇條碼">
      <div className="space-y-2 pb-4">
        <p className="text-xs text-muted-foreground mb-3">
          偵測到 {results.length} 個條碼，請選擇要套用的條碼：
        </p>
        {results.map((result, index) => (
          <motion.button
            key={`${result.content}-${index}`}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              onSelect(result);
              onClose();
            }}
            className="w-full p-3.5 glass-card rounded-xl text-left flex items-center gap-3 hover:ring-2 hover:ring-primary/30 transition-all"
          >
            <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
              <ScanLine size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {result.format}
              </div>
              <div className="font-mono text-sm text-foreground truncate mt-0.5">
                {result.content}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </ResponsiveModal>
  );
};
