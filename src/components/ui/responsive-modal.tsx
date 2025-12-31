import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  showCloseButton = true,
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer 
        open={isOpen} 
        onOpenChange={(open) => !open && onClose()} 
        dismissible={false}
        modal={true}
      >
        <DrawerContent 
          className="max-h-[85vh] rounded-t-[28px] border-border bg-card flex flex-col"
          style={{ 
            paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DrawerHeader className="text-left pb-2 flex-none">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-xl font-bold text-foreground">{title}</DrawerTitle>
                {description && (
                  <DrawerDescription className="text-sm text-muted-foreground mt-0.5">
                    {description}
                  </DrawerDescription>
                )}
              </div>
              {showCloseButton && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 glass-button rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </motion.button>
              )}
            </div>
          </DrawerHeader>
          <div 
            className="px-4 pb-6 overflow-y-auto no-scrollbar flex-1"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl border-border bg-card p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};