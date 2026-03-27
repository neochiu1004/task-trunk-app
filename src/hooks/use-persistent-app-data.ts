import { useEffect, useRef, useState } from "react";

import { DB_KEYS, defaultSettings } from "@/lib/constants";
import { dbHelper } from "@/lib/db";
import { checkIsExpiringSoon, sendTelegramMessage } from "@/lib/helpers";
import { mergeStoredSettings } from "@/lib/settings";
import type { StoredSettings } from "@/types/app";
import type { Settings, Template, Ticket } from "@/types/ticket";

async function runExpiryReminder(tasks: Ticket[], settings: Settings) {
  if (!settings.tgToken || !settings.tgChatId) return;

  const notifiedMap = (await dbHelper.getItem<Record<string, string>>(DB_KEYS.EXPIRY_NOTIFIED)) || {};
  const today = new Date().toISOString().slice(0, 10);
  const expiringTickets = tasks.filter(
    (ticket) =>
      !ticket.completed &&
      !ticket.isDeleted &&
      ticket.expiry &&
      checkIsExpiringSoon(ticket.expiry, settings.notifyDays) &&
      notifiedMap[ticket.id] !== today,
  );

  if (expiringTickets.length === 0) return;

  const pinnedTickets = expiringTickets.filter((ticket) => ticket.pinned);
  const unpinnedTickets = expiringTickets.filter((ticket) => !ticket.pinned);
  const lines = [...pinnedTickets, ...unpinnedTickets]
    .map((ticket) => `• ${ticket.pinned ? "📌 " : ""}${ticket.productName}（${ticket.expiry}）`)
    .join("\n");
  const pinnedNote = pinnedTickets.length > 0 ? `（含 ${pinnedTickets.length} 張優先）` : "";
  const message = `⏰ *[到期提醒]* 共 ${expiringTickets.length} 張快到期${pinnedNote}：\n${lines}`;
  const result = await sendTelegramMessage(settings.tgToken, settings.tgChatId, message);

  if (!result.success) return;

  expiringTickets.forEach((ticket) => {
    notifiedMap[ticket.id] = today;
  });

  const taskIds = new Set(tasks.map((ticket) => ticket.id));
  Object.keys(notifiedMap).forEach((id) => {
    if (!taskIds.has(id)) delete notifiedMap[id];
  });

  await dbHelper.setItem(DB_KEYS.EXPIRY_NOTIFIED, notifiedMap);
}

export function usePersistentAppData() {
  const [tasks, setTasks] = useState<Ticket[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [bgHistory, setBgHistory] = useState<string[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const hasRunInitialReminder = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        await dbHelper.init();
        const [storedTasks, storedSettings, storedBgHistory, storedTemplates] = await Promise.all([
          dbHelper.getItem<Ticket[]>(DB_KEYS.TASKS),
          dbHelper.getItem<StoredSettings>(DB_KEYS.SETTINGS),
          dbHelper.getItem<string[]>(DB_KEYS.BG_HISTORY),
          dbHelper.getItem<Template[]>(DB_KEYS.TEMPLATES),
        ]);

        if (!isMounted) return;

        setTasks(storedTasks || []);
        setSettings(mergeStoredSettings(storedSettings));
        setBgHistory(storedBgHistory || []);
        setTemplates(storedTemplates || []);
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Database initialization failed:", error);
      }
    };

    void initData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    void dbHelper.setItem(DB_KEYS.TASKS, tasks);
  }, [isDataLoaded, tasks]);

  useEffect(() => {
    if (!isDataLoaded) return;
    void dbHelper.setItem(DB_KEYS.SETTINGS, settings);
  }, [isDataLoaded, settings]);

  useEffect(() => {
    if (!isDataLoaded) return;
    void dbHelper.setItem(DB_KEYS.BG_HISTORY, bgHistory);
  }, [bgHistory, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    void dbHelper.setItem(DB_KEYS.TEMPLATES, templates);
  }, [isDataLoaded, templates]);

  useEffect(() => {
    if (!isDataLoaded || hasRunInitialReminder.current) return;

    hasRunInitialReminder.current = true;
    void runExpiryReminder(tasks, settings);
  }, [isDataLoaded, settings, tasks]);

  return {
    bgHistory,
    isDataLoaded,
    setBgHistory,
    setSettings,
    setTasks,
    setTemplates,
    settings,
    tasks,
    templates,
  };
}
