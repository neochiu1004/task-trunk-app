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

// 常用行動支付預設網址
export const defaultRedeemUrlPresets: RedeemUrlPreset[] = [
  { id: 'preset-linepay', label: 'Line Pay', url: 'linepay://' },
  { id: 'preset-jkopay', label: '街口支付', url: 'jkopay://' },
  { id: 'preset-pxpay', label: '全支付 PX Pay', url: 'pxpay://' },
  { id: 'preset-twpay', label: '台灣 Pay', url: 'twmpay://' },
  { id: 'preset-applepay', label: 'Apple Pay', url: 'shoebox://' },
  { id: 'preset-icashpay', label: 'icash Pay', url: 'icashpay://' },
  { id: 'preset-familypay', label: '全盈+PAY', url: 'familypay://' },
  { id: 'preset-openpointpay', label: 'OPEN POINT', url: 'openpoint://' },
];

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
