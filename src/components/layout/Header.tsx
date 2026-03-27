import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, BoxSelect, CheckSquare, Clock, LayoutGrid, Menu, Moon, Palette, RefreshCcw, Rows, Settings2, Sun } from 'lucide-react';

import { HeaderActionButton } from '@/components/layout/header/HeaderActionButton';
import { HeaderSearchBar } from '@/components/layout/header/HeaderSearchBar';
import { HeaderTagFilters } from '@/components/layout/header/HeaderTagFilters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { compressImage } from '@/lib/helpers';
import type { SortType } from '@/types/ticket';
import vouchyLogo from '@/assets/vouchy-logo.png';

interface HeaderProps {
  appTitle: string;
  activeCount: number;
  completedCount: number;
  deletedCount: number;
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
}

const headerButtonTones = {
  accent: 'bg-gradient-to-br from-[hsl(var(--brand-strong))] to-[hsl(var(--primary))] hover:brightness-105',
  olive: 'bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--brand-olive))] hover:brightness-105',
  amber: 'bg-gradient-to-br from-[hsl(var(--brand-amber))] to-[hsl(var(--ticket-warning))] hover:brightness-105',
  cocoa: 'bg-gradient-to-br from-[hsl(var(--brand-cocoa))] to-[hsl(var(--brand-cocoa-deep))] hover:brightness-105',
};

export const Header: React.FC<HeaderProps> = ({
  appTitle,
  activeCount,
  completedCount,
  deletedCount,
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
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [logoLongPress, setLogoLongPress] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayLogo = brandLogo || vouchyLogo;

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
    if (!logoLongPress) {
      logoInputRef.current?.click();
    }
    setLogoLongPress(false);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImage(file, 'thumbnail');
      onBrandLogoChange(base64);
    } catch (error) {
      console.error('Logo upload failed:', error);
    }

    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const viewMeta = {
    active: {
      eyebrow: 'Ready To Redeem',
      title: `${activeCount} 張待使用票券`,
      description: activeCount > 0 ? '把常用票券排前面，快到期與重複項目會先被拉出來。' : '現在可以開始建立你的第一批票券收藏。',
      tone: 'from-[hsl(var(--primary))] via-[hsl(var(--brand-strong))] to-[hsl(var(--brand-olive))]',
    },
    completed: {
      eyebrow: 'Redeemed Archive',
      title: `${completedCount} 張已使用票券`,
      description: completedCount > 0 ? '這裡保留已核銷紀錄，方便回頭對帳與查詢時間。' : '目前還沒有核銷紀錄，完成後的票券會出現在這裡。',
      tone: 'from-slate-700 via-slate-600 to-slate-500',
    },
    deleted: {
      eyebrow: 'Recycle Bin',
      title: `${deletedCount} 張回收票券`,
      description: deletedCount > 0 ? '回收桶保留刪除票券，必要時可以還原或永久清除。' : '回收桶目前是空的，已刪除的票券會暫存在這裡。',
      tone: 'from-rose-700 via-orange-600 to-amber-500',
    },
  } as const;
  const currentViewMeta = viewMeta[(currentView as keyof typeof viewMeta) || 'active'];

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 right-0 top-0 z-40 overflow-hidden rounded-b-[28px] px-4 pb-4 pt-8 glass-header"
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

      <div className="relative z-10 space-y-3">
        <div className="section-card px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.03 }}
                      onPointerDown={handleLogoPointerDown}
                      onPointerUp={handleLogoPointerUp}
                      onPointerLeave={() => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                      }}
                      style={{ width: headerButtonSize + 2, height: headerButtonSize + 2 }}
                      className="flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-background/95 to-background/75 shadow-md backdrop-blur-sm"
                    >
                      <img src={displayLogo} alt="Brand" className="h-full w-full object-cover" />
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

              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/75">
                  Ticket Wallet
                </div>
                {isEditingTitle ? (
                  <input
                    autoFocus
                    className="w-44 border-b-2 border-primary bg-transparent text-xl font-bold outline-none"
                    value={appTitle}
                    onChange={(event) => onTitleChange(event.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(event) => event.key === 'Enter' && setIsEditingTitle(false)}
                  />
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.h1
                          whileTap={{ scale: 0.98 }}
                          className="cursor-pointer truncate text-xl font-bold"
                          onClick={() => setIsEditingTitle(true)}
                        >
                          <span className="brand-gradient">{appTitle}</span>
                        </motion.h1>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        點擊編輯標題
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <HeaderActionButton icon={Palette} label="背景" onClick={onQuickBgChange} size={headerButtonSize} toneClassName={headerButtonTones.accent} />
              <HeaderActionButton
                icon={isDark ? Sun : Moon}
                label={isDark ? '淺色模式' : '深色模式'}
                onClick={onToggleTheme || (() => {})}
                size={headerButtonSize}
                toneClassName={headerButtonTones.olive}
              />
              <HeaderActionButton icon={Settings2} label="設定" onClick={onOpenSettings} size={headerButtonSize} toneClassName={headerButtonTones.olive} />
              <HeaderActionButton icon={Menu} label="選單" onClick={onOpenMenu} size={headerButtonSize} toneClassName={headerButtonTones.cocoa} />
            </div>
          </div>

          <div className="mt-3">
            <HeaderSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/45 bg-white/70 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className={`relative overflow-hidden bg-gradient-to-br ${currentViewMeta.tone} px-5 pb-5 pt-4 text-white`}>
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(255,255,255,0.38), transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.18), transparent 30%)' }} />
            <div className="relative">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                {currentViewMeta.eyebrow}
              </div>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[1.6rem] font-semibold leading-tight">{currentViewMeta.title}</h2>
                  <p className="mt-2 max-w-[18rem] text-sm leading-6 text-white/76">
                    {currentViewMeta.description}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/20 bg-white/12 px-3 py-2 text-right backdrop-blur-md">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/65">目前排序</div>
                  <div className="mt-1 text-sm font-semibold">
                    {currentView === 'completed' ? '核銷時間' : sortType === 'expiring' ? '依到期日' : sortType === 'newest' ? '最新建立' : '最早建立'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px bg-border/70">
            {[
              { label: '待使用', value: activeCount },
              { label: '已使用', value: completedCount },
              { label: '回收桶', value: deletedCount },
            ].map((item) => (
              <div key={item.label} className="bg-white/80 px-4 py-3 text-center backdrop-blur-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</div>
                <div className="mt-1 text-lg font-semibold text-foreground">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <HeaderTagFilters
          activeTags={activeTags}
          allTags={allTags}
          clearTags={clearTags}
          onOpenTagManager={onOpenTagManager}
          toggleTag={toggleTag}
        />

        <div className="section-card flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto no-scrollbar">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                isSelectionMode ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'glass-button text-muted-foreground hover:text-foreground'
              }`}
            >
              <BoxSelect size={12} /> {isSelectionMode ? `${selectedCount}` : '選取'}
            </motion.button>

            <AnimatePresence>
              {isSelectionMode && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSelectAll}
                  className="glass-button flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <CheckSquare size={12} /> 全選
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={onForceUpdate}
              className="flex h-8 items-center justify-center gap-1.5 rounded-xl px-3 text-white shadow-sm bg-gradient-to-br from-[hsl(var(--brand-amber))] to-[hsl(var(--ticket-warning))]"
            >
              <RefreshCcw size={12} />
              <span className="text-xs font-semibold">更新</span>
            </motion.button>

            {currentView === 'completed' ? (
              <div className="glass-card flex h-8 items-center justify-center gap-1.5 rounded-xl px-3 text-foreground opacity-75 shadow-sm">
                <Clock size={12} className="text-primary" />
                <span className="text-xs font-semibold">核銷時間</span>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  const types: SortType[] = ['expiring', 'newest', 'oldest'];
                  const nextIndex = (types.indexOf(sortType) + 1) % types.length;
                  setSortType(types[nextIndex]);
                }}
                className="glass-card flex h-8 items-center justify-center gap-1.5 rounded-xl px-3 text-foreground shadow-sm"
              >
                <ArrowUpDown size={12} className="text-primary" />
                <span className="text-xs font-semibold">
                  {sortType === 'expiring' ? '期限' : sortType === 'newest' ? '新' : '舊'}
                </span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsCompact(!isCompact)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                isCompact ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'glass-card text-muted-foreground shadow-sm hover:text-foreground'
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
