import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Ticket, Template, Settings, ViewType, SortType } from '@/types/ticket';
import { dbHelper } from '@/lib/db';
import { defaultSettings, defaultViewConfig, DB_KEYS } from '@/lib/constants';
import { checkIsExpiringSoon, formatDateTime, sendTelegramMessage } from '@/lib/helpers';
import { forceRefreshToLatest } from '@/lib/pwa';
import { validateImportData } from '@/lib/validation';
import { Header } from '@/components/layout/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { TicketCard } from '@/components/ticket/TicketCard';
import { RedeemModal } from '@/components/ticket/RedeemModal';
import { AddModal } from '@/components/modals/AddModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { DataActionsModal } from '@/components/modals/DataActionsModal';
import { ImportConfirmModal } from '@/components/modals/ImportConfirmModal';
import { BatchEditModal } from '@/components/modals/BatchEditModal';
import { TagManagerModal } from '@/components/modals/TagManagerModal';
import { DataHealthCheck } from '@/components/modals/DataHealthCheck';

const Index = () => {
  const { isDark, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<Ticket[]>([]);
  const [view, setView] = useState<ViewType>('active');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortType, setSortType] = useState<SortType>('expiring');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [importPendingData, setImportPendingData] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [bgHistory, setBgHistory] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [healthIssueSerials, setHealthIssueSerials] = useState<Set<string>>(new Set());
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const migrateConfig = (config: any) => ({
    ...defaultViewConfig,
    ...config,
    bgSize: typeof config?.bgSize === 'number' ? config.bgSize : 100,
    bgPosY: typeof config?.bgPosY === 'number' ? config.bgPosY : 50,
    bgOpacity: typeof config?.bgOpacity === 'number' ? config.bgOpacity : 1,
  });

  useEffect(() => {
    const initData = async () => {
      try {
        await dbHelper.init();
        const dbTasks = await dbHelper.getItem<Ticket[]>(DB_KEYS.TASKS);
        const dbSettings = await dbHelper.getItem<any>(DB_KEYS.SETTINGS);
        const dbBgHistory = await dbHelper.getItem<string[]>(DB_KEYS.BG_HISTORY);
        const dbTemplates = await dbHelper.getItem<Template[]>(DB_KEYS.TEMPLATES);

        if (dbTasks) setTasks(dbTasks);
        if (dbSettings) {
          const mergedSettings = {
            ...settings,
            ...dbSettings,
            bgConfigMap: dbSettings.bgConfigMap || {},
            specificViewKeywords: dbSettings.specificViewKeywords || ['MOMO', '85度C'],
            brandLogo: dbSettings.brandLogo || '',
            viewConfigs: {
              active: migrateConfig(dbSettings.viewConfigs?.active),
              completed: migrateConfig(dbSettings.viewConfigs?.completed),
              deleted: migrateConfig(dbSettings.viewConfigs?.deleted),
            },
          };
          setSettings(mergedSettings);
        }
        if (dbBgHistory) setBgHistory(dbBgHistory);
        if (dbTemplates) setTemplates(dbTemplates);
        setIsDataLoaded(true);

        // Telegram expiry reminder: only for active (not completed, not deleted) tickets
        const loadedTasks: Ticket[] = dbTasks || [];
        const loadedSettings: Settings = dbSettings ? { ...defaultSettings, ...dbSettings } : defaultSettings;
        if (loadedSettings.tgToken && loadedSettings.tgChatId) {
          const notifiedMap = (await dbHelper.getItem<Record<string, string>>(DB_KEYS.EXPIRY_NOTIFIED)) || {};
          const today = new Date().toISOString().slice(0, 10);
          const expiringTickets = loadedTasks.filter(
            (t) => !t.completed && !t.isDeleted && t.expiry && checkIsExpiringSoon(t.expiry, loadedSettings.notifyDays) && notifiedMap[t.id] !== today
          );
          if (expiringTickets.length > 0) {
            const pinnedTickets = expiringTickets.filter((t) => t.pinned);
            const unpinnedTickets = expiringTickets.filter((t) => !t.pinned);
            const formatLine = (t: typeof expiringTickets[0]) => `• ${t.pinned ? '📌 ' : ''}${t.productName}（${t.expiry}）`;
            const lines = [...pinnedTickets.map(formatLine), ...unpinnedTickets.map(formatLine)].join('\n');
            const pinnedNote = pinnedTickets.length > 0 ? `（含 ${pinnedTickets.length} 張優先）` : '';
            const msg = `⏰ *[到期提醒]* 共 ${expiringTickets.length} 張快到期${pinnedNote}：\n${lines}`;
            sendTelegramMessage(loadedSettings.tgToken, loadedSettings.tgChatId, msg).then((res) => {
              if (res.success) {
                expiringTickets.forEach((t) => { notifiedMap[t.id] = today; });
                // Clean up old entries for tickets that no longer exist
                const taskIds = new Set(loadedTasks.map((t) => t.id));
                Object.keys(notifiedMap).forEach((id) => { if (!taskIds.has(id)) delete notifiedMap[id]; });
                dbHelper.setItem(DB_KEYS.EXPIRY_NOTIFIED, notifiedMap);
              }
            }).catch(console.error);
          }
        }
      } catch (err) {
        console.error('Database initialization failed:', err);
      }
    };
    initData();
  }, []);

  useEffect(() => { if (isDataLoaded) dbHelper.setItem(DB_KEYS.TASKS, tasks); }, [tasks, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) dbHelper.setItem(DB_KEYS.SETTINGS, settings); }, [settings, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) dbHelper.setItem(DB_KEYS.BG_HISTORY, bgHistory); }, [bgHistory, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) dbHelper.setItem(DB_KEYS.TEMPLATES, templates); }, [templates, isDataLoaded]);

  const allTags = useMemo(() => [...new Set(tasks.flatMap((t) => t.tags || []))], [tasks]);
  const duplicateSerials = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => { if (!t.isDeleted && t.serial) counts[t.serial] = (counts[t.serial] || 0) + 1; });
    return new Set(Object.keys(counts).filter((s) => counts[s] > 1));
  }, [tasks]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const matchesTag = (t: Ticket, tag: string): boolean => {
    if (tag === 'special_expiring') return checkIsExpiringSoon(t.expiry, settings.notifyDays) && !t.completed && !t.isDeleted;
    if (tag === 'special_duplicate') return duplicateSerials.has(t.serial) && !t.completed && !t.isDeleted;
    if (tag === 'special_has_original') return !!t.originalImage && !t.completed && !t.isDeleted;
    if (tag === 'special_pinned') return !!t.pinned && !t.completed && !t.isDeleted;
    return !!(t.tags && t.tags.includes(tag));
  };

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      if (view === 'active' && (t.completed || t.isDeleted)) return false;
      if (view === 'completed' && (!t.completed || t.isDeleted)) return false;
      if (view === 'deleted' && !t.isDeleted) return false;
      
      // Multi-select tag filter (OR union)
      if (activeTags.length > 0) {
        if (!activeTags.some((tag) => matchesTag(t, tag))) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return t.productName.toLowerCase().includes(q) || 
          (t.note && t.note.toLowerCase().includes(q)) || 
          (t.serial && t.serial.toLowerCase().includes(q)) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)));
      }
      return true;
    });
    result.sort((a, b) => {
      if (view === 'completed') {
        return (b.completedAt || 0) - (a.completedAt || 0);
      }
      const hasHealthIssueA = !a.completed && !a.isDeleted && healthIssueSerials.has(a.serial || '');
      const hasHealthIssueB = !b.completed && !b.isDeleted && healthIssueSerials.has(b.serial || '');
      if (hasHealthIssueA !== hasHealthIssueB) return hasHealthIssueA ? -1 : 1;
      
      const pinnedA = !a.completed && !a.isDeleted && !!a.pinned;
      const pinnedB = !b.completed && !b.isDeleted && !!b.pinned;
      if (pinnedA !== pinnedB) return pinnedA ? -1 : 1;
      
      const isExpiringA = !a.completed && !a.isDeleted && checkIsExpiringSoon(a.expiry, settings.notifyDays);
      const isExpiringB = !b.completed && !b.isDeleted && checkIsExpiringSoon(b.expiry, settings.notifyDays);
      if (isExpiringA !== isExpiringB) return isExpiringA ? -1 : 1;
      if (sortType === 'newest') return b.createdAt - a.createdAt;
      if (sortType === 'oldest') return a.createdAt - b.createdAt;
      if (sortType === 'expiring') {
        const dateA = a.expiry ? new Date(a.expiry.replace(/\//g, '-')) : new Date(9999, 11, 31);
        const dateB = b.expiry ? new Date(b.expiry.replace(/\//g, '-')) : new Date(9999, 11, 31);
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    });
    return result;
  }, [tasks, view, activeTags, searchQuery, sortType, duplicateSerials, settings.notifyDays, healthIssueSerials]);

  const viewCounts = useMemo(() => ({
    active: tasks.filter((t) => !t.completed && !t.isDeleted).length,
    completed: tasks.filter((t) => t.completed && !t.isDeleted).length,
    deleted: tasks.filter((t) => t.isDeleted).length,
  }), [tasks]);

  const currentViewCount = viewCounts[view];
  const hasActiveFilters = activeTags.length > 0 || !!searchQuery.trim();
  const viewLabelMap: Record<ViewType, string> = {
    active: '待使用',
    completed: '已使用',
    deleted: '回收桶',
  };
  const emptyStateTitle = searchQuery.trim()
    ? '找不到符合搜尋的票券'
    : activeTags.length > 0
      ? '目前沒有符合標籤條件的票券'
      : view === 'completed'
        ? '目前沒有已使用票券'
        : view === 'deleted'
          ? '回收桶是空的'
          : '目前沒有待使用票券';
  const emptyStateDescription = searchQuery.trim()
    ? '可以試試別的關鍵字，或先清除搜尋與標籤篩選。'
    : activeTags.length > 0
      ? '清掉目前篩選後，就可以回到完整票券清單。'
      : view === 'completed'
        ? '核銷後的票券會集中在這裡，方便回頭查詢。'
        : view === 'deleted'
          ? '刪除的票券會先暫存在這裡，之後可以還原或永久刪除。'
          : '先用下方新增按鈕建立票券，之後就能在這裡集中管理。';
  const filteredTaskIds = useMemo(() => new Set(filteredTasks.map((t) => t.id)), [filteredTasks]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => filteredTaskIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredTaskIds]);

  useEffect(() => {
    if (isSelectionMode && filteredTasks.length === 0) {
      setIsSelectionMode(false);
    }
  }, [filteredTasks.length, isSelectionMode]);

  useEffect(() => {
    if (selectedTicket && !tasks.some((t) => t.id === selectedTicket.id)) {
      setSelectedTicket(null);
    }
  }, [selectedTicket, tasks]);

  const handleViewChange = (nextView: ViewType) => {
    setView(nextView);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
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
    input.onchange = (e: any) => {
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
      r.readAsText(e.target.files[0]);
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
      await dbHelper.removeItem(DB_KEYS.TASKS); await dbHelper.removeItem(DB_KEYS.SETTINGS); await dbHelper.removeItem(DB_KEYS.BG_HISTORY); await dbHelper.removeItem(DB_KEYS.TEMPLATES);
      window.location.reload();
    }
  };
  const handleSelect = (id: string) => { const s = new Set(selectedIds); if (s.has(id)) s.delete(id); else s.add(id); setSelectedIds(s); };
  const handleSelectAll = () => setSelectedIds(selectedIds.size === filteredTasks.length ? new Set() : new Set(filteredTasks.map((t) => t.id)));
  const handleBatchEdit = (payload: any) => {
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
    setSelectedIds(new Set()); setIsSelectionMode(false);
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
        />
        
        <div className="pt-[280px] min-h-[50vh] pb-28 overflow-x-hidden">
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

      <RedeemModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onToggleComplete={handleToggleComplete} onDelete={handleDelete} onRestore={handleRestore} onUpdate={handleUpdate} allTags={allTags} specificViewKeywords={settings.specificViewKeywords} onSaveTemplate={handleSaveTemplate} templates={templates} onDeleteTemplate={handleDeleteTemplate} onReorderTemplate={handleReorderTemplate} onRenameTemplate={handleRenameTemplate} onEditTemplate={handleEditTemplate} settings={settings} redeemUrlPresets={settings.redeemUrlPresets} />
      <AddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} allTags={allTags} specificViewKeywords={settings.specificViewKeywords} templates={templates} onDeleteTemplate={handleDeleteTemplate} onReorderTemplate={handleReorderTemplate} onRenameTemplate={handleRenameTemplate} onEditTemplate={handleEditTemplate} onAddBatch={handleAddBatch} redeemUrlPresets={settings.redeemUrlPresets} onSaveTemplate={handleSaveTemplate} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} bgHistory={bgHistory} onSave={handleSaveSettings} onRemoveHistory={(url) => { if (confirm('移除此背景？')) setBgHistory((prev) => prev.filter((i) => i !== url)); }} onAddToHistory={(bg) => { if (bg) setBgHistory((prev) => [bg, ...prev.filter((b) => b !== bg)].slice(0, 20)); }} />
      <DataActionsModal 
        isOpen={showDataModal} 
        onClose={() => setShowDataModal(false)} 
        onBackup={handleBackup} 
        onImportClick={handleImportClick} 
        onReset={handleFullReset} 
        onHealthCheck={() => { setShowDataModal(false); setShowHealthCheck(true); }} 
        settings={settings}
        onImportData={(data) => {
          setImportPendingData(data);
          setShowDataModal(false);
        }}
      />
      <ImportConfirmModal isOpen={!!importPendingData} data={importPendingData} onConfirm={executeImport} onCancel={() => setImportPendingData(null)} />
      <BatchEditModal isOpen={showBatchModal} onClose={() => setShowBatchModal(false)} selectedCount={selectedIds.size} onBatchEdit={handleBatchEdit} allTags={allTags} templates={templates} onDeleteTemplate={handleDeleteTemplate} onReorderTemplate={handleReorderTemplate} onRenameTemplate={handleRenameTemplate} onEditTemplate={handleEditTemplate} redeemUrlPresets={settings.redeemUrlPresets} />
      <TagManagerModal isOpen={showTagManager} onClose={() => setShowTagManager(false)} tags={allTags} onDeleteTag={handleDeleteTag} />
      <DataHealthCheck isOpen={showHealthCheck} onClose={() => setShowHealthCheck(false)} onBackup={handleBackup} onMismatchedSerials={setHealthIssueSerials} />
    </>
  );
};

export default Index;
