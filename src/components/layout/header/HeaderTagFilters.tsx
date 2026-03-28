import type { ElementType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Copy, ImageIcon, Pin, Settings2, Tag } from "lucide-react";

import { cn } from "@/lib/utils";

const specialTagConfig = [
  { id: "special_expiring", label: "快到期", icon: AlertCircle, activeClassName: "bg-ticket-warning text-primary-foreground shadow-lg shadow-ticket-warning/30" },
  { id: "special_duplicate", label: "重複", icon: Copy, activeClassName: "bg-orange-500 text-primary-foreground shadow-lg shadow-orange-500/30" },
  { id: "special_has_original", label: "有原圖", icon: ImageIcon, activeClassName: "bg-primary text-primary-foreground shadow-lg shadow-primary/30" },
  { id: "special_pinned", label: "優先", icon: Pin, activeClassName: "bg-amber-500 text-primary-foreground shadow-lg shadow-amber-500/30" },
] as const;

interface HeaderTagFiltersProps {
  activeTags: string[];
  allTags: string[];
  clearTags: () => void;
  onOpenTagManager: () => void;
  toggleTag: (tag: string) => void;
}

const chipClassName =
  "flex items-center gap-1.5 whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-semibold transition-all duration-200";

const TagChip = ({
  active,
  icon: Icon,
  label,
  onClick,
  activeClassName,
}: {
  active: boolean;
  activeClassName?: string;
  icon: ElementType;
  label: string;
  onClick: () => void;
}) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    whileHover={{ scale: 1.02 }}
    animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
    transition={{ duration: 0.25, type: "spring", stiffness: 400 }}
    onClick={onClick}
    className={cn(chipClassName, active ? activeClassName : "glass-button text-muted-foreground hover:text-foreground")}
  >
    <AnimatePresence mode="wait">
      {active ? (
        <motion.span
          key="check"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <Check size={12} strokeWidth={3} />
        </motion.span>
      ) : (
        <motion.span key="icon" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
          <Icon size={12} />
        </motion.span>
      )}
    </AnimatePresence>
    {label}
  </motion.button>
);

export const HeaderTagFilters = ({
  activeTags,
  allTags,
  clearTags,
  onOpenTagManager,
  toggleTag,
}: HeaderTagFiltersProps) => (
  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2.5 -mx-4 px-4">
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={clearTags}
      className={cn(chipClassName, activeTags.length === 0 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "glass-button text-muted-foreground hover:text-foreground")}
    >
      全部
    </motion.button>

    <AnimatePresence>
      {activeTags.length > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0, width: 0 }}
          animate={{ scale: 1, opacity: 1, width: "auto" }}
          exit={{ scale: 0, opacity: 0, width: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearTags}
          className="overflow-hidden rounded-2xl bg-destructive/15 px-3 py-2 text-xs font-bold whitespace-nowrap text-destructive"
        >
          清除 ({activeTags.length})
        </motion.button>
      )}
    </AnimatePresence>

    {specialTagConfig.map((tag) => (
      <TagChip
        key={tag.id}
        active={activeTags.includes(tag.id)}
        activeClassName={tag.activeClassName}
        icon={tag.icon}
        label={tag.label}
        onClick={() => toggleTag(tag.id)}
      />
    ))}

    {allTags.map((tag) => (
      <TagChip
        key={tag}
        active={activeTags.includes(tag)}
        activeClassName="bg-primary text-primary-foreground shadow-lg shadow-primary/30"
        icon={Tag}
        label={tag}
        onClick={() => toggleTag(tag)}
      />
    ))}

    {allTags.length > 0 && (
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        onClick={onOpenTagManager}
        className="glass-button flex items-center gap-1.5 whitespace-nowrap rounded-2xl border border-dashed border-muted-foreground/20 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <Settings2 size={12} />
        管理
      </motion.button>
    )}
  </div>
);
