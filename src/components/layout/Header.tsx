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
  ImageIcon,
  X,
} from 'lucide-react';
import { compressImage } from '@/lib/helpers';
import { ViewType, SortType } from '@/types/ticket';
import vouchyLogo from '@/assets/vouchy-logo.png';

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
  onOpenTagManager: () => void;
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
  onOpenTagManager,
  headerBackgroundImage,
  headerBgSize = 100,
  headerBgPosY = 50,
  headerBgOpacity = 1,
  brandLogo,
  onBrandLogoChange,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const iconButtonClass = "w-9 h-9 flex items-center justify-center glass-button rounded-2xl text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm";

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
      className="px-4 pt-10 pb-4 sticky top-0 z-40 glass-header rounded-b-[24px] relative overflow-hidden"
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
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {/* Brand Logo */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => logoInputRef.current?.click()}
              className="w-10 h-10 rounded-2xl glass-button flex items-center justify-center overflow-hidden cursor-pointer shrink-0 shadow-md"
            >
              {brandLogo ? (
                <img src={brandLogo} alt="Brand" className="w-full h-full object-cover" />
              ) : (
                <img src={vouchyLogo} alt="Vouchy" className="w-full h-full object-cover" />
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
                className="text-xl font-bold bg-transparent outline-none border-b-2 border-primary w-40 tracking-tight"
                value={appTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              />
            ) : (
              <motion.h1
                whileTap={{ scale: 0.98 }}
                className="text-xl font-bold cursor-pointer flex items-center gap-2 tracking-tight"
                onClick={() => setIsEditingTitle(true)}
              >
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{appTitle}</span>
              </motion.h1>
            )}
          </div>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} onClick={onQuickBgChange} className={iconButtonClass}>
              <Palette size={15} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} onClick={onOpenSettings} className={iconButtonClass}>
              <Settings2 size={16} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} onClick={onOpenMenu} className={iconButtonClass}>
              <MoreVertical size={16} />
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋票券或標籤..."
            className="w-full py-3 pl-11 pr-10 glass-card rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40 focus:shadow-lg focus:shadow-primary/10 transition-all duration-200 placeholder:text-muted-foreground/50"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Tags Row */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2.5 -mx-4 px-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTag('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTag === 'all' 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                : 'glass-button text-muted-foreground hover:text-foreground'
            }`}
          >
            全部
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTag('special_expiring')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
              activeTag === 'special_expiring' 
                ? 'bg-ticket-warning text-primary-foreground shadow-lg shadow-ticket-warning/30' 
                : 'glass-button text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertCircle size={12} /> 快到期
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTag('special_has_original')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
              activeTag === 'special_has_original' 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                : 'glass-button text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon size={12} /> 有原圖
          </motion.button>
          {allTags.map((tag) => (
            <motion.button
              key={tag}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                activeTag === tag 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'glass-button text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tag size={11} /> {tag}
            </motion.button>
          ))}
          {allTags.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={onOpenTagManager}
              className="px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap glass-button text-muted-foreground hover:text-foreground flex items-center gap-1.5 border border-dashed border-muted-foreground/20"
            >
              ⚙️ 管理
            </motion.button>
          )}
        </div>

        {/* View Tabs & Controls */}
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto no-scrollbar">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 flex-shrink-0 ${
                isSelectionMode 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'glass-button text-muted-foreground hover:text-foreground'
              }`}
            >
              <BoxSelect size={12} /> {isSelectionMode ? `${selectedCount}` : '選'}
            </motion.button>
            
            <AnimatePresence>
              {isSelectionMode && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSelectAll}
                  className="px-3 py-2 glass-button rounded-xl text-xs font-semibold flex items-center gap-1.5 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <CheckSquare size={12} /> 全選
                </motion.button>
              )}
            </AnimatePresence>
            
            {/* View Tabs - Premium Pill Design */}
            <div className="flex glass-card p-1 rounded-2xl flex-shrink-0 shadow-md">
              {viewTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView(tab.id)}
                  className={`relative px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
                    view === tab.id 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {view === tab.id && (
                    <motion.div
                      layoutId="activeViewTab"
                      className="absolute inset-0 bg-card shadow-md rounded-xl"
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

          <div className="flex gap-2 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                const types: SortType[] = ['expiring', 'newest', 'oldest'];
                const nextIdx = (types.indexOf(sortType) + 1) % types.length;
                setSortType(types[nextIdx]);
              }}
              className="px-3 h-8 glass-card rounded-xl flex items-center justify-center text-foreground transition-all duration-200 gap-1.5 shadow-sm"
            >
              <ArrowUpDown size={12} className="text-primary" />
              <span className="text-xs font-semibold">
                {sortType === 'expiring' ? '期限' : sortType === 'newest' ? '新' : '舊'}
              </span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsCompact(!isCompact)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 ${
                isCompact 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'glass-card text-muted-foreground hover:text-foreground shadow-sm'
              }`}
            >
              {isCompact ? <Rows size={14} /> : <LayoutGrid size={14} />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};