import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ModalShellProps extends PropsWithChildren {
  className?: string;
  contentClassName?: string;
  footer?: ReactNode;
  header?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export const ModalShell = ({
  children,
  className,
  contentClassName,
  footer,
  header,
  isOpen,
  onClose,
}: ModalShellProps) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-6 backdrop-blur-md animate-fade-in", className)}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-sm overflow-hidden rounded-[2rem] border border-border/60 bg-card/95 shadow-glass-lg backdrop-blur-xl",
          contentClassName,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {header && <div className="border-b border-border/60 px-6 py-5">{header}</div>}
        <div className="max-h-[72vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-border/60 bg-background/35 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};
