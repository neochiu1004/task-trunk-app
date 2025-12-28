import React, { useState, useRef } from 'react';
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
  Ticket,
} from 'lucide-react';
import { compressImage } from '@/lib/helpers';
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
  headerBgSize?: number;
  headerBgPosY?: number;
  headerBgOpacity?: number;
  brandLogo?: string;
  onBrandLogoChange: (logo: string) => void;
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
  headerBgSize = 100,
  headerBgPosY = 50,
  headerBgOpacity = 1,
  brandLogo,
  onBrandLogoChange,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const iconButtonClass = "w-8 h-8 flex items-center justify-center glass-button rounded-xl text-muted-foreground hover:text-foreground transition-all";

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 'thumbnail');
      onBrandLogoChange(base64);
    } catch (err) {
      console.error('Logo upload failed:', err);
    }
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="px-3 pt-8 pb-3 sticky top-0 z-40 glass-header rounded-b-[20px] relative overflow-hidden"
    >
      {/* 背景圖層：獨立控制背景圖的透明度 */}
      {headerBackgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${headerBackgroundImage})`,
            backgroundSize: `${headerBgSize}% auto`,
            backgroundPosition: `center ${headerBgPosY}%`,
            backgroundRepeat: 'no-repeat',
            opacity: headerBgOpacity,
          }}
        />
      )}
      
      {/* 內容層：保持完全不透明 */}
      <div className="relative z-10">
        {/* Title Row */}
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            {/* Brand Logo */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => logoInputRef.current?.click()}
              className="w-8 h-8 rounded-full glass-button flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
            >
              {brandLogo ? (
                <img src={brandLogo} alt="Brand" className="w-full h-full object-cover" />
              ) : (
                <Ticket size={16} className="text-primary" />
              )}
            </motion.div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            
            {isEditingTitle ? (
              <input
                autoFocus
                className="text-lg font-bold bg-transparent outline-none border-b-2 border-primary w-36 tracking-tight"
                value={appTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              />
            ) : (
              <motion.h1
                whileTap={{ scale: 0.98 }}
                className="text-lg font-bold cursor-pointer flex items-center gap-1.5 tracking-tight"
                onClick={() => setIsEditingTitle(true)}
              >
                <span>{appTitle}</span>
              </motion.h1>
            )}
          </div>
          <div className="flex gap-1.5">
            <motion.button whileTap={{ scale: 0.95 }} onClick={onQuickBgChange} className={iconButtonClass}>
              <Palette size={15} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onOpenSettings} className={iconButtonClass}>
              <Settings2 size={15} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onOpenMenu} className={iconButtonClass}>
              <MoreVertical size={15} />
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2.5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋票券或標籤..."
            className="w-full py-2.5 pl-9 pr-3 glass-card rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Tags Row */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 -mx-3 px-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTag('all')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all ${
              activeTag === 'all' 
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' 
                : 'glass-button text-muted-foreground hover:text-foreground'
            }`}
          >
            全部
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTag('special_expiring')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTag === 'special_expiring' 
                ? 'bg-ticket-warning text-primary-foreground shadow-md shadow-ticket-warning/25' 
                : 'glass-button text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertCircle size={10} /> 快到期
          </motion.button>
          {allTags.map((tag) => (
            <motion.button
              key={tag}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                activeTag === tag 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' 
                  : 'glass-button text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tag size={9} /> {tag}
            </motion.button>
          ))}
        </div>

        {/* View Tabs & Controls */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all flex-shrink-0 ${
                isSelectionMode 
                  ? 'bg-primary text-primary-foreground' 
                  : 'glass-button text-muted-foreground hover:text-foreground'
              }`}
            >
              <BoxSelect size={10} /> {isSelectionMode ? `${selectedCount}` : '選'}
            </motion.button>
            
            <AnimatePresence>
              {isSelectionMode && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSelectAll}
                  className="px-2 py-1.5 glass-button rounded-lg text-[10px] font-semibold flex items-center gap-1 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <CheckSquare size={10} /> 全選
                </motion.button>
              )}
            </AnimatePresence>
            
            {/* View Tabs - Compact Pill Design */}
            <div className="flex glass-card p-0.5 rounded-xl flex-shrink-0">
              {viewTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView(tab.id)}
                  className={`relative px-2 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold transition-colors ${
                    view === tab.id 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {view === tab.id && (
                    <motion.div
                      layoutId="activeViewTab"
                      className="absolute inset-0 bg-card shadow-sm rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    <tab.icon size={10} /> {tab.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const types: SortType[] = ['expiring', 'newest', 'oldest'];
                const nextIdx = (types.indexOf(sortType) + 1) % types.length;
                setSortType(types[nextIdx]);
              }}
              className="px-2 h-7 glass-card rounded-lg flex items-center justify-center text-foreground transition-all gap-1"
            >
              <ArrowUpDown size={11} className="text-primary" />
              <span className="text-[10px] font-semibold">
                {sortType === 'expiring' ? '期限' : sortType === 'newest' ? '新' : '舊'}
              </span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCompact(!isCompact)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                isCompact 
                  ? 'bg-primary text-primary-foreground' 
                  : 'glass-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {isCompact ? <Rows size={12} /> : <LayoutGrid size={12} />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};