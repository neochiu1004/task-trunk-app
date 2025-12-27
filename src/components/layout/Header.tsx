import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2,
  MoreVertical,
  Search,
  Tag,
  AlertCircle,
  ArrowUpDown,
  Rows,
  LayoutGrid,
  ListTodo,
  CheckCircle2,
  Trash,
  CheckSquare,
  BoxSelect,
  Palette,
} from 'lucide-react';
import { ViewType, SortType } from '@/types/ticket';

interface HeaderProps {
  appTitle: string;
  onTitleChange: (title: string) => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
  sortType: SortType;
  setSortType: (type: SortType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  selectedCount: number;
  onSelectAll: () => void;
  isCompact: boolean;
  setIsCompact: (compact: boolean) => void;
  view: ViewType;
  setView: (view: ViewType) => void;
  activeTag: string;
  setActiveTag: (tag: string) => void;
  allTags: string[];
  onQuickBgChange: () => void;
  headerBackgroundImage?: string;
}

const viewTabs = [
  { id: 'active' as const, label: '待使用', icon: ListTodo },
  { id: 'completed' as const, label: '已使用', icon: CheckCircle2 },
  { id: 'deleted' as const, label: '回收桶', icon: Trash },
];

export const Header: React.FC<HeaderProps> = ({
  appTitle,
  onTitleChange,
  onOpenMenu,
  onOpenSettings,
  sortType,
  setSortType,
  searchQuery,
  setSearchQuery,
  isSelectionMode,
  setIsSelectionMode,
  selectedCount,
  onSelectAll,
  isCompact,
  setIsCompact,
  view,
  setView,
  activeTag,
  setActiveTag,
  allTags,
  onQuickBgChange,
  headerBackgroundImage,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const iconButtonClass = "w-10 h-10 flex items-center justify-center glass-button rounded-2xl text-muted-foreground hover:text-foreground transition-all";

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="px-4 pt-10 pb-4 sticky top-0 z-40 glass-header rounded-b-[28px]"
      style={
        headerBackgroundImage
          ? { backgroundImage: `url(${headerBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}
      }
    >
      <div className={headerBackgroundImage ? 'glass -mx-4 -mt-10 px-4 pt-10 pb-4 rounded-b-[28px]' : ''}>
        {/* Title Row */}
        <div className="flex justify-between items-center mb-4">
          {isEditingTitle ? (
            <input
              autoFocus
              className="text-2xl font-bold bg-transparent outline-none border-b-2 border-primary w-44 tracking-tight"
              value={appTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            />
          ) : (
            <motion.h1
              whileTap={{ scale: 0.98 }}
              className="text-2xl font-bold cursor-pointer flex items-center gap-2.5 tracking-tight"
              onClick={() => setIsEditingTitle(true)}
            >
              <span className="text-2xl">🎫</span>
              <span>{appTitle}</span>
            </motion.h1>
          )}
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={onQuickBgChange} className={iconButtonClass}>
              <Palette size={18} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onOpenSettings} className={iconButtonClass}>
              <Settings2 size={18} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onOpenMenu} className={iconButtonClass}>
              <MoreVertical size={18} />
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋票券或標籤..."
            className="w-full py-3.5 pl-12 pr-4 glass-card rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Tags Row */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTag('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTag === 'all' 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                : 'glass-button text-muted-foreground hover:text-foreground'
            }`}
          >
            全部
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTag('special_expiring')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTag === 'special_expiring' 
                ? 'bg-ticket-warning text-primary-foreground shadow-lg shadow-ticket-warning/25' 
                : 'glass-button text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertCircle size={12} /> 快到期
          </motion.button>
          {allTags.map((tag) => (
            <motion.button
              key={tag}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTag === tag 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                  : 'glass-button text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tag size={10} /> {tag}
            </motion.button>
          ))}
        </div>

        {/* View Tabs & Controls */}
        <div className="flex justify-between items-center mt-1">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                isSelectionMode 
                  ? 'bg-primary text-primary-foreground' 
                  : 'glass-button text-muted-foreground hover:text-foreground'
              }`}
            >
              <BoxSelect size={12} /> {isSelectionMode ? `已選 ${selectedCount}` : '多選'}
            </motion.button>
            
            <AnimatePresence>
              {isSelectionMode && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSelectAll}
                  className="px-3 py-2 glass-button rounded-xl text-[11px] font-semibold flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <CheckSquare size={12} /> 全選
                </motion.button>
              )}
            </AnimatePresence>
            
            {/* View Tabs - Premium Pill Design */}
            <div className="flex glass-card p-1 rounded-2xl">
              {viewTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView(tab.id)}
                  className={`relative px-3 py-2 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${
                    view === tab.id 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {view === tab.id && (
                    <motion.div
                      layoutId="activeViewTab"
                      className="absolute inset-0 bg-card shadow-sm rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <tab.icon size={12} /> {tab.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const types: SortType[] = ['expiring', 'newest', 'oldest'];
                const nextIdx = (types.indexOf(sortType) + 1) % types.length;
                setSortType(types[nextIdx]);
              }}
              className="px-3 h-10 glass-card rounded-2xl flex items-center justify-center text-foreground transition-all gap-1.5"
            >
              <ArrowUpDown size={14} className="text-primary" />
              <span className="text-[11px] font-semibold">
                {sortType === 'expiring' ? '快到期' : sortType === 'newest' ? '最新' : '最舊'}
              </span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCompact(!isCompact)}
              className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${
                isCompact 
                  ? 'bg-primary text-primary-foreground' 
                  : 'glass-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {isCompact ? <Rows size={16} /> : <LayoutGrid size={16} />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};