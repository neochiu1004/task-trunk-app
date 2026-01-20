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
          className="max-h-[90vh] rounded-t-[32px] border-border bg-card flex flex-col shadow-premium"
          style={{ 
            paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DrawerHeader className="text-left pb-3 flex-none px-5 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-2xl font-bold text-foreground tracking-tight">{title}</DrawerTitle>
                {description && (
                  <DrawerDescription className="text-sm text-muted-foreground mt-1">
                    {description}
                  </DrawerDescription>
                )}
              </div>
              {showCloseButton && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={onClose}
                  className="p-2.5 glass-button rounded-2xl text-muted-foreground hover:text-foreground shadow-sm"
                >
                  <X size={20} />
                </motion.button>
              )}
            </div>
          </DrawerHeader>
          <div 
            className="px-5 pb-8 overflow-y-auto no-scrollbar flex-1"
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
      <DialogContent className="sm:max-w-[460px] rounded-3xl border-border bg-card p-0 gap-0 shadow-premium">
        <DialogHeader className="p-6 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="px-6 pb-8 max-h-[70vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};