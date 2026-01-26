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
  CheckSquare,
  BoxSelect,
  Palette,
  ImageIcon,
  X,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { compressImage } from '@/lib/helpers';
import { SortType } from '@/types/ticket';
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
  headerButtonSize?: number;
}

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
  headerButtonSize = 44,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 計算圖示大小 (按鈕大小的 40%)
  const iconSize = Math.round(headerButtonSize * 0.4);

  // 按鈕顏色配置
  const buttonConfigs = [
    { icon: Palette, onClick: onQuickBgChange, bgClass: 'bg-gradient-to-br from-pink-500 to-purple-600', hoverClass: 'hover:from-pink-400 hover:to-purple-500', tooltip: '背景' },
    { icon: Settings2, onClick: onOpenSettings, bgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', hoverClass: 'hover:from-blue-400 hover:to-cyan-500', tooltip: '設定' },
    { icon: MoreVertical, onClick: onOpenMenu, bgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', hoverClass: 'hover:from-emerald-400 hover:to-teal-500', tooltip: '選單' },
  ];

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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => logoInputRef.current?.click()}
                    style={{ width: headerButtonSize, height: headerButtonSize }}
                    className="rounded-2xl bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm flex items-center justify-center overflow-hidden cursor-pointer shrink-0 shadow-lg border-2 border-border/40 ring-1 ring-white/10"
                  >
                    {brandLogo ? (
                      <img src={brandLogo} alt="Brand" className="w-full h-full object-cover" />
                    ) : (
                      <img src={vouchyLogo} alt="Vouchy" className="w-full h-full object-cover" />
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  點擊更換 Logo
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.h1
                      whileTap={{ scale: 0.98 }}
                      className="text-xl font-bold cursor-pointer flex items-center gap-2 tracking-tight"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{appTitle}</span>
                    </motion.h1>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    點擊編輯標題
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              {buttonConfigs.map((config, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.08 }}
                      onClick={config.onClick}
                      style={{ width: headerButtonSize, height: headerButtonSize }}
                      className={`flex items-center justify-center rounded-2xl text-white shadow-lg ${config.bgClass} ${config.hoverClass} active:scale-95 transition-all duration-200`}
                    >
                      <config.icon size={iconSize} />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {config.tooltip}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 text-foreground shadow-sm border border-border/50 transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
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