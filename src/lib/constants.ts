import type { ViewConfig, Settings } from '@/types/ticket';

export const defaultViewConfig: ViewConfig = {
  backgroundImage: '',
  headerBackgroundImage: '',
  cardOpacity: 0.95,
  bgOpacity: 1,
  bgPosY: 50,
  bgSize: 100,
  cardBgColor: '#ffffff',
  cardBorderColor: '#e2e8f0',
  compactHeight: 70,
  compactShowImage: false,
};

export const defaultSettings: Settings = {
  tgToken: '',
  tgChatId: '',
  notifyDays: 7,
  appTitle: '我的票夾',
  specificViewKeywords: ['MOMO', '85度C'],
  bgConfigMap: {},
  viewConfigs: {
    active: { ...defaultViewConfig },
    completed: { ...defaultViewConfig },
    deleted: { ...defaultViewConfig },
  },
};

export const DB_KEYS = {
  TASKS: 'wallet_tasks_v3',
  SETTINGS: 'wallet_settings_v3',
  BG_HISTORY: 'wallet_bg_history_v3',
  TEMPLATES: 'wallet_templates_v3',
};
