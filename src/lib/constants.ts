import type { ViewConfig, Settings, RedeemUrlPreset } from '@/types/ticket';

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
  headerBgSize: 100,
  headerBgPosY: 50,
  headerBgOpacity: 1,
};

// 使用者自訂核銷網址預設（預設為空，由使用者在設定中自行新增）
export const defaultRedeemUrlPresets: RedeemUrlPreset[] = [];

export const defaultSettings: Settings = {
  tgToken: '',
  tgChatId: '',
  notifyDays: 7,
  appTitle: 'Vouchy',
  specificViewKeywords: ['MOMO', '85度C'],
  bgConfigMap: {},
  viewConfigs: {
    active: { ...defaultViewConfig },
    completed: { ...defaultViewConfig },
    deleted: { ...defaultViewConfig },
  },
  redeemUrlPresets: defaultRedeemUrlPresets,
};

export const DB_KEYS = {
  TASKS: 'wallet_tasks_v3',
  SETTINGS: 'wallet_settings_v3',
  BG_HISTORY: 'wallet_bg_history_v3',
  TEMPLATES: 'wallet_templates_v3',
};
