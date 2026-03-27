import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HeaderActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  size: number;
  toneClassName: string;
}

export const HeaderActionButton = ({
  icon: Icon,
  label,
  onClick,
  size,
  toneClassName,
}: HeaderActionButtonProps) => {
  const iconSize = Math.round(size * 0.38);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.04 }}
            onClick={onClick}
            style={{ width: size, height: size }}
            className={cn(
              "flex items-center justify-center rounded-2xl border border-white/20 text-white shadow-md transition-all duration-200",
              toneClassName,
            )}
          >
            <Icon size={iconSize} />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
