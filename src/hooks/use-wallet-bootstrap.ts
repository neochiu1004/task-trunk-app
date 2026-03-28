import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { dbHelper } from '@/lib/db';
import { defaultSettings, DB_KEYS, defaultViewConfig } from '@/lib/constants';
import { checkIsExpiringSoon, sendTelegramMessage } from '@/lib/helpers';
import type { StoredSettings } from '@/types/app';
import type { Settings, Template, Ticket } from '@/types/ticket';

type MigrateConfig = (config?: Partial<typeof defaultViewConfig>) => typeof defaultViewConfig;

interface UseWalletBootstrapResult {
  tasks: Ticket[];
  setTasks: Dispatch<SetStateAction<Ticket[]>>;
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  templates: Template[];
  setTemplates: Dispatch<SetStateAction<Template[]>>;
  bgHistory: string[];
  setBgHistory: Dispatch<SetStateAction<string[]>>;
  isDataLoaded: boolean;
}

export function useWalletBootstrap(migrateConfig: MigrateConfig): UseWalletBootstrapResult {
  const [tasks, setTasks] = useState<Ticket[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [bgHistory, setBgHistory] = useState<string[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        await dbHelper.init();
        const dbTasks = await dbHelper.getItem<Ticket[]>(DB_KEYS.TASKS);
        const dbSettings = await dbHelper.getItem<StoredSettings>(DB_KEYS.SETTINGS);
        const dbBgHistory = await dbHelper.getItem<string[]>(DB_KEYS.BG_HISTORY);
        const dbTemplates = await dbHelper.getItem<Template[]>(DB_KEYS.TEMPLATES);

        if (dbTasks) setTasks(dbTasks);
        if (dbSettings) {
          const mergedSettings: Settings = {
            ...defaultSettings,
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

        const loadedTasks: Ticket[] = dbTasks || [];
        const loadedSettings: Settings = dbSettings ? { ...defaultSettings, ...dbSettings } as Settings : defaultSettings;
        if (loadedSettings.tgToken && loadedSettings.tgChatId) {
          const notifiedMap = (await dbHelper.getItem<Record<string, string>>(DB_KEYS.EXPIRY_NOTIFIED)) || {};
          const today = new Date().toISOString().slice(0, 10);
          const expiringTickets = loadedTasks.filter(
            (ticket) =>
              !ticket.completed &&
              !ticket.isDeleted &&
              ticket.expiry &&
              checkIsExpiringSoon(ticket.expiry, loadedSettings.notifyDays) &&
              notifiedMap[ticket.id] !== today
          );

          if (expiringTickets.length > 0) {
            const pinnedTickets = expiringTickets.filter((ticket) => ticket.pinned);
            const unpinnedTickets = expiringTickets.filter((ticket) => !ticket.pinned);
            const formatLine = (ticket: Ticket) => `• ${ticket.pinned ? '📌 ' : ''}${ticket.productName}（${ticket.expiry}）`;
            const lines = [...pinnedTickets.map(formatLine), ...unpinnedTickets.map(formatLine)].join('\n');
            const pinnedNote = pinnedTickets.length > 0 ? `（含 ${pinnedTickets.length} 張優先）` : '';
            const message = `⏰ *[到期提醒]* 共 ${expiringTickets.length} 張快到期${pinnedNote}：\n${lines}`;
            sendTelegramMessage(loadedSettings.tgToken, loadedSettings.tgChatId, message)
              .then((result) => {
                if (!result.success) return;
                expiringTickets.forEach((ticket) => {
                  notifiedMap[ticket.id] = today;
                });
                const taskIds = new Set(loadedTasks.map((ticket) => ticket.id));
                Object.keys(notifiedMap).forEach((id) => {
                  if (!taskIds.has(id)) delete notifiedMap[id];
                });
                void dbHelper.setItem(DB_KEYS.EXPIRY_NOTIFIED, notifiedMap);
              })
              .catch(console.error);
          }
        }
      } catch (error) {
        console.error('Database initialization failed:', error);
      }
    };

    void initData();
  }, [migrateConfig]);

  return {
    tasks,
    setTasks,
    settings,
    setSettings,
    templates,
    setTemplates,
    bgHistory,
    setBgHistory,
    isDataLoaded,
  };
}
