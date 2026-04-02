import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Ticket, Template, Settings, ViewType, SortType } from '@/types/ticket';
import type { BatchEditPayload, ImportPayload } from '@/types/app';
import { dbHelper } from '@/lib/db';
import { defaultSettings, defaultViewConfig, DB_KEYS } from '@/lib/constants';
import { formatDateTime, sendTelegramMessage } from '@/lib/helpers';
import { forceRefreshToLatest } from '@/lib/pwa';
import { validateImportData } from '@/lib/validation';
import { useDebouncedDbValue } from '@/hooks/use-debounced-db-value';
import { useTicketFilters } from '@/hooks/use-ticket-filters';
import { useTicketSelection } from '@/hooks/use-ticket-selection';
import { useWalletBootstrap } from '@/hooks/use-wallet-bootstrap';
import { Header } from '@/components/layout/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { TicketCard } from '@/components/ticket/TicketCard';
import { DataActionsModal } from '@/components/modals/DataActionsModal';
import { ImportConfirmModal } from '@/components/modals/ImportConfirmModal';
import { TagManagerModal } from '@/components/modals/TagManagerModal';

const RedeemModal = lazy(() =>
  import('@/components/ticket/RedeemModal').then((module) => ({ default: module.RedeemModal }))
);
const AddModal = lazy(() =>
  import('@/components/modals/AddModal').then((module) => ({ default: module.AddModal }))
);
const SettingsModal = lazy(() =>
  import('@/components/modals/SettingsModal').then((module) => ({ default: module.SettingsModal }))
);
const BatchEditModal = lazy(() =>
  import('@/components/modals/BatchEditModal').then((module) => ({ default: module.BatchEditModal }))
);
const DataHealthCheck = lazy(() =>
  import('@/components/modals/DataHealthCheck').then((module) => ({ default: module.DataHealthCheck }))
);

const APP_VERSION = __APP_VERSION__;
const APP_UPDATED_AT = __APP_UPDATED_AT__;

const Index = () => {
  const { isDark, toggleTheme } = useTheme();
  const [view, setView] = useState<ViewType>('active');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortType, setSortType] = useState<SortType>('expiring');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [importPendingData, setImportPendingData] = useState<ImportPayload | Ticket[] | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [healthIssueSerials, setHealthIssueSerials] = useState<Set<string>>(new Set());
  const [headerHeight, setHeaderHeight] = useState(220);

  const migrateConfig = (config?: Partial<typeof defaultViewConfig>) => ({
    ...defaultViewConfig,
    ...config,
    bgSize: typeof config?.bgSize === 'number' ? config.bgSize : 100,
    bgPosY: typeof config?.bgPosY === 'number' ? config.bgPosY : 50,
    bgOpacity: typeof config?.bgOpacity === 'number' ? config.bgOpacity : 1,
  });
  const {
    tasks,
    setTasks,
    settings,
    setSettings,
    templates,
    setTemplates,
    bgHistory,
    setBgHistory,
    isDataLoaded,
  } = useWalletBootstrap(migrateConfig);

  useDebouncedDbValue(DB_KEYS.TASKS, tasks, isDataLoaded);
  useDebouncedDbValue(DB_KEYS.SETTINGS, settings, isDataLoaded);
  useDebouncedDbValue(DB_KEYS.BG_HISTORY, bgHistory, isDataLoaded);
  useDebouncedDbValue(DB_KEYS.TEMPLATES, templates, isDataLoaded);

  const {
    allTags,
    currentViewCount,
    duplicateSerials,
    emptyStateDescription,
    emptyStateTitle,
    filteredTaskIds,
    filteredTasks,
    hasActiveFilters,
    viewCounts,
    viewLabelMap,
  } = useTicketFilters({
    tasks,
    view,
    activeTags,
    searchQuery,
    sortType,
    notifyDays: settings.notifyDays,
    healthIssueSerials,
  });

  const {
    clearSelection,
    handleSelect,
    handleSelectAll,
    isSelectionMode,
    selectedIds,
    setIsSelectionMode,
    setSelectedIds,
  } = useTicketSelection({
    filteredTaskIds,
    filteredTaskLength: filteredTasks.length,
    view,
  });

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  useEffect(() => {
    if (selectedTicket && !tasks.some((t) => t.id === selectedTicket.id)) {
      setSelectedTicket(null);
    }
  }, [selectedTicket, tasks]);

  const handleViewChange = (nextView: ViewType) => {
    setView(nextView);
    clearSelection();
  };

  const handleAddBatch = (newItems: Ticket[]) => setTasks((prev) => [...newItems, ...prev]);
  const handleUpdate = (updatedTicket: Ticket) => setTasks((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
  const handleToggleComplete = async (ticket: Ticket) => {
    const newStatus = !ticket.completed;
    const completedAt = newStatus ? Date.now() : undefined;
    setTasks((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, completed: newStatus, completedAt } : t)));
    if (newStatus && settings.tgToken && settings.tgChatId) {
      const msg = `✅ *[已核銷]* ${ticket.productName}\n🔢 序號: ${ticket.serial || '無'}\n⏰ 時間: ${formatDateTime(completedAt)}`;
      sendTelegramMessage(settings.tgToken, settings.tgChatId, msg).catch(console.error);
    }
  };
  const handleDelete = (id: string, forceNotify = false, skipConfirm = false) => {
    const now = Date.now();
    if (forceNotify && settings.tgToken && settings.tgChatId) {
      const target = tasks.find((t) => t.id === id);
      if (target) {
        const msg = `🗑️ *[已刪除]*\n方案: ${target.productName}\n序號: \`${target.serial || '無'}\`\n時間: ${formatDateTime(now)}`;
        sendTelegramMessage(settings.tgToken, settings.tgChatId, msg).catch(console.error);
      }
    }
    if (view === 'deleted') {
      if (skipConfirm || confirm('確定永久刪除？')) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } else {
      setTasks((prev) => prev.map((t) => (id === t.id ? { ...t, isDeleted: true, deletedAt: now } : t)));
    }
  };
  const handleRestore = (ticket: Ticket) => setTasks((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, isDeleted: false, deletedAt: undefined } : t)));
  const handleBackup = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const baseName = settings.localBackupFileName?.trim() || 'vouchy_backup';
    const fileName = `${baseName}_${dateStr}_${timeStr}.json`;
    
    const backupData = { version: 3, timestamp: Date.now(), settings, tasks, templates, bgHistory };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName; a.click();
  };
  const handleImportClick = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = (ev) => { 
        try { 
          const rawData = JSON.parse(ev.target?.result as string);
          const validationResult = validateImportData(rawData);
          if (validationResult.success === false) {
            alert(validationResult.error);
            return;
          }
          setImportPendingData(validationResult.data);
          setShowDataModal(false);
        } catch { 
          alert('JSON 格式錯誤，無法解析檔案'); 
        } 
      };
      r.readAsText(file);
    }; input.click();
  };
  const executeImport = (mode: 'append' | 'overwrite', restoreSettings: boolean) => {
    if (!importPendingData) return;
    const importedTasks = Array.isArray(importPendingData) ? importPendingData : (importPendingData.tasks || []);
    if (restoreSettings && importPendingData.settings) {
      const impSet = importPendingData.settings;
      setSettings((prev) => ({
        ...prev,
        ...impSet,
        tgToken: impSet.tgToken || prev.tgToken,
        tgChatId: impSet.tgChatId || prev.tgChatId,
        brandLogo: impSet.brandLogo || prev.brandLogo,
        specificViewKeywords: impSet.specificViewKeywords || ['MOMO', '85度C'],
        viewConfigs: {
          active: migrateConfig(impSet.viewConfigs?.active),
          completed: migrateConfig(impSet.viewConfigs?.completed),
          deleted: migrateConfig(impSet.viewConfigs?.deleted),
        },
      }));
    }
    // 還原背景歷史
    if (restoreSettings && importPendingData.bgHistory && Array.isArray(importPendingData.bgHistory)) {
      if (mode === 'append') {
        setBgHistory((prev) => [...new Set([...importPendingData.bgHistory, ...prev])].slice(0, 20));
      } else {
        setBgHistory(importPendingData.bgHistory);
      }
    }
    if (importPendingData.templates && Array.isArray(importPendingData.templates)) {
      if (mode === 'append') setTemplates((prev) => [...prev, ...importPendingData.templates]);
      else setTemplates(importPendingData.templates);
    }
    if (mode === 'append') setTasks((prev) => [...prev, ...importedTasks]);
    else setTasks(importedTasks);
    setImportPendingData(null);
    alert(`匯入成功！共 ${importedTasks.length} 筆票券。`);
  };
  const handleFullReset = async () => {
    if (window.confirm('⚠️ 確定要清空所有資料嗎？')) {
      await dbHelper.removeItem(DB_KEYS.TASKS);
      await dbHelper.removeItem(DB_KEYS.SETTINGS);
      await dbHelper.removeItem(DB_KEYS.BG_HISTORY);
      await dbHelper.removeItem(DB_KEYS.TEMPLATES);
      await dbHelper.removeItem(DB_KEYS.EXPIRY_NOTIFIED);
      window.location.reload();
    }
  };
  const handleClearExpiryCache = async () => {
    await dbHelper.removeItem(DB_KEYS.EXPIRY_NOTIFIED);
    alert('已清除到期提醒快取，重新整理後會以目前票券重新計算提醒。');
    window.location.reload();
  };
  const handleBatchEdit = (payload: BatchEditPayload) => {
    setTasks((prev) => prev.map((t) => {
      if (!selectedIds.has(t.id)) return t;
      let newTags = payload.clearTags ? [...payload.tagsToAdd] : Array.from(new Set([...(t.tags || []), ...payload.tagsToAdd]));
      let newRedeemUrl = payload.clearRedeemUrl ? undefined : (payload.redeemUrl || t.redeemUrl);
      return { 
        ...t, 
        tags: newTags, 
        productName: payload.name || t.productName, 
        image: payload.image || t.image, 
        expiry: payload.expiry ? payload.expiry.replace(/-/g, '/') : t.expiry,
        redeemUrl: newRedeemUrl,
        ...(payload.setPinned === true ? { pinned: true } : payload.setPinned === false ? { pinned: false } : {}),
      };
    }));
    clearSelection();
  };
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    const imagesToAdd = [newSettings.viewConfigs.active.backgroundImage, newSettings.viewConfigs.completed.backgroundImage, newSettings.viewConfigs.deleted.backgroundImage].filter(Boolean);
    if (imagesToAdd.length > 0) setBgHistory((prev) => [...new Set([...imagesToAdd, ...prev])].slice(0, 20));
  };
  // 記住使用者自訂的背景圖（用於三模式切換）
  const savedBgRef = React.useRef<Record<string, { main: string; header: string }>>({});
  const handleQuickBgChange = () => {
    const cfg = settings.viewConfigs[view];
    const currentBg = cfg.backgroundImage || '';
    const currentHeaderBg = cfg.headerBackgroundImage || '';

    // 儲存非空的背景圖
    if (currentBg) savedBgRef.current[view] = { ...savedBgRef.current[view], main: currentBg };
    if (currentHeaderBg) savedBgRef.current[view] = { ...savedBgRef.current[view], header: currentHeaderBg };

    const saved = savedBgRef.current[view] || { main: '', header: '' };
    // 如果沒有歷史主背景，從 bgHistory 取第一張
    if (!saved.main && bgHistory.length > 0) saved.main = bgHistory[0];

    let nextBg: string;
    let nextHeaderBg: string;

    let modeName: string;

    if (currentBg && currentHeaderBg) {
      // 模式1 (兩者都有) → 模式2 (只顯示主背景)
      nextBg = currentBg;
      nextHeaderBg = '';
      modeName = '🖼 只顯示主背景';
    } else if (currentBg && !currentHeaderBg) {
      // 模式2 (只有主背景) → 模式3 (都不顯示)
      nextBg = '';
      nextHeaderBg = '';
      modeName = '🚫 無背景';
    } else {
      // 模式3 (都沒有) → 模式1 (兩者都顯示)
      const history = bgHistory.length > 0 ? bgHistory : [];
      const lastMain = saved.main || '';
      const idx = history.indexOf(lastMain);
      const nextIdx = (idx + 1) % Math.max(history.length, 1);
      nextBg = history[nextIdx] || saved.main || '';
      nextHeaderBg = saved.header || '';
      modeName = '✨ 全部背景';
    }

    setSettings((prev) => {
      const next = { ...prev };
      const currentView = { ...next.viewConfigs[view], backgroundImage: nextBg, headerBackgroundImage: nextHeaderBg };
      next.viewConfigs = { ...next.viewConfigs, [view]: currentView };
      return next;
    });
  };
  const handleSaveTemplate = (data: { label: string; productName: string; image?: string; tags?: string[]; serial?: string; expiry?: string; redeemUrlPresetId?: string }) => {
    setTemplates((prev) => [...prev, { id: 'tpl_' + Date.now(), ...data }]);
    alert(`已儲存範本：${data.label}`);
  };
  const handleDeleteTemplate = (id: string) => { if (window.confirm('確定刪除此範本？')) setTemplates((prev) => prev.filter((t) => t.id !== id)); };
  const handleRenameTemplate = (id: string, newLabel: string) => {
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, label: newLabel } : t));
  };
  const handleEditTemplate = (id: string, updates: Partial<Omit<Template, 'id'>>) => {
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  };
  const handleReorderTemplate = (fromIndex: number, toIndex: number) => {
    setTemplates((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) return prev;
      const newTemplates = [...prev];
      const [removed] = newTemplates.splice(fromIndex, 1);
      newTemplates.splice(toIndex, 0, removed);
      return newTemplates;
    });
  };
  const handleDeleteTag = (tagToDelete: string) => {
    if (window.confirm(`確定刪除標籤「${tagToDelete}」？將從所有票券移除此標籤。`)) {
      setTasks((prev) => prev.map((t) => ({ ...t, tags: (t.tags || []).filter((tag) => tag !== tagToDelete) })));
      setActiveTags((prev) => prev.filter((t) => t !== tagToDelete));
    }
  };

  const handleForceUpdate = async () => {
    const shouldContinue = window.confirm('這會重新下載最新版並重新整理頁面。要繼續嗎？');
    if (!shouldContinue) return;

    try {
      await forceRefreshToLatest();
    } catch (error) {
      alert(error instanceof Error ? error.message : '強制更新失敗，請稍後再試。');
    }
  };

  if (!isDataLoaded) return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 className="w-10 h-10 text-primary" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-muted-foreground font-medium text-sm"
      >
        正在載入資料庫...
      </motion.p>
    </div>
  );

  const currentConfig = settings.viewConfigs[view] || defaultViewConfig;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.01,
        staggerDirection: -1,
      },
    },
  };

  return (
    <>
      {currentConfig.backgroundImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: currentConfig.bgOpacity || 1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-0 mx-auto max-w-md"
          style={{
            top: '160px',
            backgroundImage: `url(${currentConfig.backgroundImage})`,
            backgroundSize: `${currentConfig.bgSize || 100}% auto`,
            backgroundPosition: `center ${currentConfig.bgPosY || 50}%`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      
      <div className="max-w-md mx-auto min-h-screen relative z-10 overflow-x-hidden" style={{ backgroundColor: currentConfig.backgroundImage ? 'transparent' : undefined }}>
        <Header
          appTitle={settings.appTitle}
          onTitleChange={(t) => setSettings((s) => ({ ...s, appTitle: t }))}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMenu={() => setShowDataModal(true)}
          sortType={sortType}
          setSortType={setSortType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSelectionMode={isSelectionMode}
          setIsSelectionMode={setIsSelectionMode}
          selectedCount={selectedIds.size}
          onSelectAll={handleSelectAll}
          isCompact={isCompact}
          setIsCompact={setIsCompact}
          activeTags={activeTags}
          toggleTag={toggleTag}
          clearTags={() => setActiveTags([])}
          allTags={allTags}
          onQuickBgChange={handleQuickBgChange}
          onOpenTagManager={() => setShowTagManager(true)}
          headerBackgroundImage={currentConfig.headerBackgroundImage}
          headerBgSize={currentConfig.headerBgSize}
          headerBgPosY={currentConfig.headerBgPosY}
          headerBgOpacity={currentConfig.headerBgOpacity}
          brandLogo={settings.brandLogo}
          onBrandLogoChange={(logo) => setSettings((s) => ({ ...s, brandLogo: logo }))}
          headerButtonSize={settings.headerButtonSize}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          currentView={view}
          onForceUpdate={handleForceUpdate}
          onHeightChange={setHeaderHeight}
        />
        
        <div
          className="min-h-[50vh] pb-28 overflow-x-hidden"
          style={{ paddingTop: `${headerHeight + 12}px` }}
        >
          <div className="px-4 mb-4 space-y-3">
            <div className="glass-card rounded-2xl px-4 py-3 border border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
                    目前清單
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {viewLabelMap[view]} {filteredTasks.length} / {currentViewCount} 張
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-primary">
                    版本 v{APP_VERSION}
                  </div>
                  <div className="mt-1 text-[10px] font-medium text-muted-foreground">
                    更新時間 {APP_UPDATED_AT}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {searchQuery.trim() && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                        搜尋: {searchQuery.trim()}
                      </span>
                    )}
                    {activeTags.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                    {isSelectionMode && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-ticket-warning/15 text-ticket-warning">
                        已選 {selectedIds.size} 張
                      </span>
                    )}
                    {!searchQuery.trim() && activeTags.length === 0 && !isSelectionMode && (
                      <span className="text-[11px] text-muted-foreground">
                        目前沒有額外篩選
                      </span>
                    )}
                  </div>
                </div>

                {(hasActiveFilters || isSelectionMode) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTags([]);
                      setIsSelectionMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="px-3 py-2 rounded-xl glass-button text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>

            {isSelectionMode && (
              <div className="rounded-2xl bg-primary/8 border border-primary/15 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">
                    批次模式已開啟
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    點選票券加入批次操作，目前已選 {selectedIds.size} 張。
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shrink-0"
                >
                  {selectedIds.size === filteredTasks.length && filteredTasks.length > 0 ? '取消全選' : '全選目前清單'}
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={view + activeTags.join(',') + sortType}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={isCompact ? `grid gap-3 px-4 ${(currentConfig.gridColumns || 2) === 3 ? 'grid-cols-3' : 'grid-cols-2'}` : ""}
            >
              {filteredTasks.length > 0 ? (
                filteredTasks.map((t, index) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    onClick={setSelectedTicket}
                    notifyDays={settings.notifyDays}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(t.id)}
                    onSelect={handleSelect}
                    isDuplicate={duplicateSerials.has(t.serial)}
                    opacity={currentConfig.cardOpacity}
                    cardBgColor={currentConfig.cardBgColor}
                    cardBorderColor={currentConfig.cardBorderColor}
                    isCompact={isCompact}
                    gridImageHeight={currentConfig.gridImageHeight}
                    index={index}
                    hasHealthIssue={healthIssueSerials.has(t.serial || '')}
                    onTogglePin={(id) => {
                      setTasks(prev => prev.map(tk => tk.id === id ? { ...tk, pinned: !tk.pinned } : tk));
                    }}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 text-center py-16 px-6 glass-card rounded-[28px] text-muted-foreground border border-border/50"
                >
                  <span className="text-6xl mb-6 block opacity-20">🎫</span>
                  <p className="font-semibold text-base text-foreground">{emptyStateTitle}</p>
                  <p className="mt-2 text-sm leading-6">{emptyStateDescription}</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveTags([]);
                      }}
                      className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                    >
                      清除搜尋與篩選
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-2.5 z-40"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
              className="px-5 py-3.5 glass-card text-foreground rounded-2xl font-semibold text-sm shadow-glass-lg"
            >
              取消
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBatchModal(true)}
              disabled={selectedIds.size === 0}
              className="px-5 py-3.5 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm shadow-premium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil size={16} /> 編輯 {selectedIds.size} 張
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (confirm(`確定刪除 ${selectedIds.size} 張票券？`)) {
                  const skipConfirm = view === 'deleted';
                  selectedIds.forEach((id) => handleDelete(id, false, skipConfirm));
                  setSelectedIds(new Set());
                  setIsSelectionMode(false);
                }
              }}
              disabled={selectedIds.size === 0}
              className="px-5 py-3.5 bg-ticket-warning text-primary-foreground rounded-2xl font-semibold text-sm shadow-premium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
            </motion.button>
          </motion.div>
        )}
        
        <BottomNavigation
          view={view}
          setView={handleViewChange}
          onAddClick={() => setShowAddModal(true)}
          activeCount={viewCounts.active}
          completedCount={viewCounts.completed}
          deletedCount={viewCounts.deleted}
        />
      </div>

      <Suspense fallback={null}>
        <RedeemModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onToggleComplete={handleToggleComplete} onDelete={handleDelete} onRestore={handleRestore} onUpdate={handleUpdate} allTags={allTags} specificViewKeywords={settings.specificViewKeywords} onSaveTemplate={handleSaveTemplate} templates={templates} onDeleteTemplate={handleDeleteTemplate} onReorderTemplate={handleReorderTemplate} onRenameTemplate={handleRenameTemplate} onEditTemplate={handleEditTemplate} settings={settings} redeemUrlPresets={settings.redeemUrlPresets} />
      </Suspense>
      <Suspense fallback={null}>
        <AddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} allTags={allTags} specificViewKeywords={settings.specificViewKeywords} templates={templates} onDeleteTemplate={handleDeleteTemplate} onReorderTemplate={handleReorderTemplate} onRenameTemplate={handleRenameTemplate} onEditTemplate={handleEditTemplate} onAddBatch={handleAddBatch} redeemUrlPresets={settings.redeemUrlPresets} onSaveTemplate={handleSaveTemplate} />
      </Suspense>
      <Suspense fallback={null}>
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} bgHistory={bgHistory} onSave={handleSaveSettings} onRemoveHistory={(url) => { if (confirm('移除此背景？')) setBgHistory((prev) => prev.filter((i) => i !== url)); }} onAddToHistory={(bg) => { if (bg) setBgHistory((prev) => [bg, ...prev.filter((b) => b !== bg)].slice(0, 20)); }} />
      </Suspense>
      <DataActionsModal 
        isOpen={showDataModal} 
        onClose={() => setShowDataModal(false)} 
        onBackup={handleBackup} 
        onImportClick={handleImportClick} 
        onClearExpiryCache={handleClearExpiryCache}
        onReset={handleFullReset} 
        onHealthCheck={() => { setShowDataModal(false); setShowHealthCheck(true); }} 
        settings={settings}
        onImportData={(data) => {
          setImportPendingData(data);
          setShowDataModal(false);
        }}
      />
      <ImportConfirmModal isOpen={!!importPendingData} data={importPendingData} onConfirm={executeImport} onCancel={() => setImportPendingData(null)} />
      <Suspense fallback={null}>
        <BatchEditModal isOpen={showBatchModal} onClose={() => setShowBatchModal(false)} selectedCount={selectedIds.size} onBatchEdit={handleBatchEdit} allTags={allTags} templates={templates} onDeleteTemplate={handleDeleteTemplate} onReorderTemplate={handleReorderTemplate} onRenameTemplate={handleRenameTemplate} onEditTemplate={handleEditTemplate} redeemUrlPresets={settings.redeemUrlPresets} />
      </Suspense>
      <TagManagerModal isOpen={showTagManager} onClose={() => setShowTagManager(false)} tags={allTags} onDeleteTag={handleDeleteTag} />
      <Suspense fallback={null}>
        <DataHealthCheck isOpen={showHealthCheck} onClose={() => setShowHealthCheck(false)} onBackup={handleBackup} onMismatchedSerials={setHealthIssueSerials} />
      </Suspense>
    </>
  );
};

export default Index;
