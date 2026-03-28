import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpDown,
  BoxSelect,
  Check,
  CheckSquare,
  ChevronDown,
  Clock,
  Copy,
  ImageIcon,
  LayoutGrid,
  Moon,
  MoreVertical,
  Palette,
  RefreshCcw,
  Rows,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Tag,
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
  activeTags: string[];
  toggleTag: (tag: string) => void;
  clearTags: () => void;
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
  isDark?: boolean;
  onToggleTheme?: () => void;
  currentView?: string;
  onForceUpdate?: () => void;
  onHeightChange?: (height: number) => void;
}

const specialTagConfigs = [
  { key: 'special_expiring', label: '快到期', icon: AlertCircle, activeClass: 'bg-ticket-warning text-primary-foreground shadow-lg shadow-ticket-warning/30' },
  { key: 'special_duplicate', label: '重複', icon: Copy, activeClass: 'bg-orange-500 text-primary-foreground shadow-lg shadow-orange-500/30' },
  { key: 'special_has_original', label: '有原圖', icon: ImageIcon, activeClass: 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' },
  { key: 'special_pinned', label: '優先', icon: Sparkles, activeClass: 'bg-amber-500 text-primary-foreground shadow-lg shadow-amber-500/30' },
] as const;

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
  activeTags,
  toggleTag,
  clearTags,
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
  isDark = false,
  onToggleTheme,
  currentView,
  onForceUpdate,
  onHeightChange,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [logoLongPress, setLogoLongPress] = useState(false);
  const [isTagPanelOpen, setIsTagPanelOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const iconSize = Math.max(14, Math.round(headerButtonSize * 0.34));
  const buttonSize = Math.max(36, headerButtonSize - 8);
  const displayLogo = brandLogo || vouchyLogo;
  const canUseSelection = currentView === 'active';

  useEffect(() => {
    const node = headerRef.current;
    if (!node || !onHeightChange) return;

    const syncHeight = () => onHeightChange(node.offsetHeight);
    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    window.addEventListener('resize', syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncHeight);
    };
  }, [onHeightChange, isTagPanelOpen, activeTags.length, searchQuery, isSelectionMode]);

  const handleLogoPointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      if (brandLogo) {
        onBrandLogoChange('');
        setLogoLongPress(true);
      }
    }, 600);
  };

  const handleLogoPointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!logoLongPress) logoInputRef.current?.click();
    setLogoLongPress(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImage(file, 'thumbnail');
      onBrandLogoChange(base64);
    } catch (err) {
      console.error('Logo upload failed:', err);
    }

    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const cycleSortType = () => {
    const types: SortType[] = ['expiring', 'newest', 'oldest'];
    const nextIdx = (types.indexOf(sortType) + 1) % types.length;
    setSortType(types[nextIdx]);
  };

  const topButtons = [
    { icon: Palette, onClick: onQuickBgChange, bgClass: 'bg-gradient-to-br from-[#486773] to-[#334A52]', hoverClass: 'hover:from-[#557985] hover:to-[#3D5963]', tooltip: '背景' },
    { icon: isDark ? Sun : Moon, onClick: onToggleTheme || (() => {}), bgClass: isDark ? 'bg-gradient-to-br from-[#c18f3e] to-[#996f31]' : 'bg-gradient-to-br from-[#5e7f72] to-[#4a6a5e]', hoverClass: isDark ? 'hover:from-[#cf9a45] hover:to-[#a17736]' : 'hover:from-[#6a8e7f] hover:to-[#557769]', tooltip: isDark ? '淺色模式' : '深色模式' },
    { icon: Settings2, onClick: onOpenSettings, bgClass: 'bg-gradient-to-br from-[#6A9C89] to-[#4f8070]', hoverClass: 'hover:from-[#76ab97] hover:to-[#5b8e7d]', tooltip: '設定' },
    { icon: MoreVertical, onClick: onOpenMenu, bgClass: 'bg-gradient-to-br from-[#9e7862] to-[#7d5f4f]', hoverClass: 'hover:from-[#ad846c] hover:to-[#8a6a58]', tooltip: '選單' },
  ];

  return (
    <motion.div
      ref={headerRef}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-40 px-4 pt-8 pb-3 glass-header rounded-b-[22px] overflow-hidden"
    >
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

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onPointerDown={handleLogoPointerDown}
                    onPointerUp={handleLogoPointerUp}
                    onPointerLeave={() => {
                      if (longPressTimer.current) clearTimeout(longPressTimer.current);
                    }}
                    style={{ width: buttonSize, height: buttonSize }}
                    className="rounded-2xl bg-gradient-to-br from-background/95 to-background/75 backdrop-blur-sm flex items-center justify-center overflow-hidden cursor-pointer shrink-0 shadow-md border border-border/70"
                  >
                    <img src={displayLogo} alt="Brand" className="w-full h-full object-cover" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {brandLogo ? '點擊更換 / 長按移除' : '點擊更換 Logo'}
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
                className="text-lg font-bold bg-transparent outline-none border-b-2 border-primary w-40"
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
                      className="text-lg font-bold cursor-pointer truncate"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      <span className="truncate bg-gradient-to-r from-[#334A52] to-[#5e7f72] bg-clip-text text-transparent">
                        {appTitle}
                      </span>
                    </motion.h1>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    點擊編輯標題
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex gap-1.5 shrink-0">
            <TooltipProvider>
              {topButtons.map((config, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.08 }}
                      onClick={config.onClick}
                      style={{ width: buttonSize, height: buttonSize }}
                      className={`flex items-center justify-center rounded-2xl text-white shadow-md ${config.bgClass} ${config.hoverClass} active:scale-95 transition-all duration-200`}
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

        <div className="flex items-center gap-2 mb-2">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋票券、標籤或序號"
              className="w-full h-11 pl-10 pr-10 glass-card rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 placeholder:text-muted-foreground/70"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 text-foreground shadow-sm border border-border/50 transition-colors"
                >
                  <X size={14} strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {onForceUpdate && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={onForceUpdate}
              className="h-11 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-white bg-gradient-to-br from-[#d98c3f] to-[#b96c2d] shadow-sm shrink-0"
            >
              <RefreshCcw size={13} />
              <span className="text-xs font-semibold">更新</span>
            </motion.button>
          )}

          {currentView === 'completed' ? (
            <div className="h-11 px-3 glass-card rounded-2xl flex items-center justify-center text-foreground gap-1.5 shadow-sm opacity-70 shrink-0">
              <Clock size={13} className="text-primary" />
              <span className="text-xs font-semibold">核銷</span>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={cycleSortType}
              className="h-11 px-3 glass-card rounded-2xl flex items-center justify-center text-foreground transition-all duration-200 gap-1.5 shadow-sm shrink-0"
            >
              <ArrowUpDown size={13} className="text-primary" />
              <span className="text-xs font-semibold">
                {sortType === 'expiring' ? '期限' : sortType === 'newest' ? '新' : '舊'}
              </span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setIsCompact(!isCompact)}
            className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 shrink-0 ${
              isCompact
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'glass-card text-muted-foreground hover:text-foreground shadow-sm'
            }`}
          >
            {isCompact ? <Rows size={15} /> : <LayoutGrid size={15} />}
          </motion.button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsTagPanelOpen((prev) => !prev)}
              className={`h-9 px-3 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                isTagPanelOpen || activeTags.length > 0
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'glass-card text-muted-foreground hover:text-foreground shadow-sm'
              }`}
            >
              <SlidersHorizontal size={13} />
              篩選
              {(activeTags.length > 0 || allTags.length > 0) && (
                <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] leading-none">
                  {activeTags.length > 0 ? activeTags.length : allTags.length}
                </span>
              )}
              <ChevronDown size={13} className={`transition-transform ${isTagPanelOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {activeTags.length > 0 ? (
              <>
                {activeTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="h-9 px-3 rounded-2xl bg-primary/10 text-primary text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0"
                  >
                    <Check size={12} />
                    {tag}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearTags}
                  className="h-9 px-3 rounded-2xl bg-destructive/10 text-destructive text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  清除
                </button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                直接搜尋，或點篩選挑標籤
              </span>
            )}
          </div>

          <AnimatePresence initial={false}>
            {isTagPanelOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                className="overflow-hidden"
              >
                <div className="glass-card rounded-2xl px-3 py-3 border border-border/50">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={clearTags}
                      className={`px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                        activeTags.length === 0
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                          : 'glass-button text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      全部
                    </motion.button>

                    {specialTagConfigs.map((specialTag) => {
                      const isActive = activeTags.includes(specialTag.key);
                      return (
                        <motion.button
                          key={specialTag.key}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.02 }}
                          animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                          transition={{ duration: 0.25, type: 'spring', stiffness: 400 }}
                          onClick={() => toggleTag(specialTag.key)}
                          className={`px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                            isActive ? specialTag.activeClass : 'glass-button text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isActive ? <Check size={12} strokeWidth={3} /> : <specialTag.icon size={12} />}
                          {specialTag.label}
                        </motion.button>
                      );
                    })}

                    {allTags.map((tag) => {
                      const isActive = activeTags.includes(tag);
                      return (
                        <motion.button
                          key={tag}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.02 }}
                          animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                          transition={{ duration: 0.25, type: 'spring', stiffness: 400 }}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                              : 'glass-button text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isActive ? <Check size={11} strokeWidth={3} /> : <Tag size={11} />}
                          {tag}
                        </motion.button>
                      );
                    })}

                    {allTags.length > 0 && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={onOpenTagManager}
                        className="px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap glass-button text-muted-foreground hover:text-foreground flex items-center gap-1.5 border border-dashed border-muted-foreground/20 shrink-0"
                      >
                        管理
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {canUseSelection && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 shrink-0 ${
                isSelectionMode
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'glass-button text-muted-foreground hover:text-foreground'
              }`}
            >
              <BoxSelect size={12} />
              {isSelectionMode ? `已選 ${selectedCount}` : '批次'}
            </motion.button>

            <AnimatePresence initial={false}>
              {isSelectionMode && (
                <motion.button
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSelectAll}
                  className="px-3 py-2 glass-button rounded-xl text-xs font-semibold flex items-center gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <CheckSquare size={12} />
                  全選
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};
