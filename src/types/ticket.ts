export interface Ticket {
  id: string;
  productName: string;
  serial: string;
  expiry: string;
  image: string;
  originalImage?: string;
  images?: string[];
  tags: string[];
  note?: string;
  barcodeFormat?: string;
  completed: boolean;
  completedAt?: number;
  isDeleted: boolean;
  deletedAt?: number;
  createdAt: number;
}

export interface Template {
  id: string;
  label: string;
  productName: string;
  image?: string;
  tags?: string[];
}

export interface ViewConfig {
  backgroundImage: string;
  headerBackgroundImage: string;
  cardOpacity: number;
  bgOpacity: number;
  bgPosY: number;
  bgSize: number;
  cardBgColor: string;
  cardBorderColor: string;
  compactHeight: number;
  compactShowImage: boolean;
  headerBgSize: number;
  headerBgPosY: number;
  headerBgOpacity: number;
}

export interface Settings {
  tgToken: string;
  tgChatId: string;
  notifyDays: number;
  appTitle: string;
  brandLogo?: string;
  specificViewKeywords: string[];
  bgConfigMap: Record<string, { bgSize?: number; bgPosY?: number }>;
  viewConfigs: {
    active: ViewConfig;
    completed: ViewConfig;
    deleted: ViewConfig;
  };
}

export type ViewType = 'active' | 'completed' | 'deleted';
export type SortType = 'expiring' | 'newest' | 'oldest';
