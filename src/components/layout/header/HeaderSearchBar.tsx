import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";

interface HeaderSearchBarProps {
  onChange: (value: string) => void;
  value: string;
}

export const HeaderSearchBar = ({ onChange, value }: HeaderSearchBarProps) => (
  <div className="relative">
    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="搜尋票券、標籤或序號..."
      className="w-full rounded-[1.35rem] border border-white/50 bg-card/85 py-3 pl-11 pr-10 text-sm font-medium outline-none transition-all duration-200 placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
    />
    <AnimatePresence>
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-muted text-foreground shadow-sm transition-colors hover:bg-primary/20"
        >
          <X size={14} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  </div>
);
