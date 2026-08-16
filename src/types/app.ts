import type { Settings, Template, Ticket, ViewConfig } from '@/types/ticket';

export interface ImportPayload {
  version?: number;
  timestamp?: number;
  tasks?: Ticket[];
  settings?: StoredSettings;
  templates?: Template[];
  bgHistory?: string[];
  expiryNotified?: Record<string, string>;
}

export interface BatchEditPayload {
  tagsToAdd: string[];
  clearTags: boolean;
  name: string;
  expiry: string;
  image: string;
  redeemUrl: string;
  clearRedeemUrl: boolean;
  setPinned?: boolean | null;
}

export interface BatchTicketInput {
  ticketNumber: string;
  expiryDate: string | null;
  productName: string;
  buyer?: string;
}

export type StoredSettings = Partial<Omit<Settings, 'viewConfigs'>> & {
  viewConfigs?: Partial<Record<'active' | 'completed' | 'deleted', Partial<ViewConfig>>>;
};
