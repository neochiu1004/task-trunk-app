import type { Settings, Template, Ticket, ViewConfig, ViewType } from "@/types/ticket";

export interface ImportPayload {
  version?: number;
  timestamp?: number;
  tasks?: Ticket[];
  settings?: Partial<Settings>;
  templates?: Template[];
  bgHistory?: string[];
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

export type StoredSettings = Partial<Omit<Settings, "viewConfigs">> & {
  viewConfigs?: Partial<Record<ViewType, Partial<ViewConfig>>>;
};
