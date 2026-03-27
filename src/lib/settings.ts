import { defaultSettings, defaultViewConfig } from "@/lib/constants";
import type { StoredSettings } from "@/types/app";
import type { Settings, ViewConfig } from "@/types/ticket";

export const migrateViewConfig = (config?: Partial<ViewConfig>): ViewConfig => ({
  ...defaultViewConfig,
  ...config,
  bgSize: typeof config?.bgSize === "number" ? config.bgSize : 100,
  bgPosY: typeof config?.bgPosY === "number" ? config.bgPosY : 50,
  bgOpacity: typeof config?.bgOpacity === "number" ? config.bgOpacity : 1,
  headerBgSize: typeof config?.headerBgSize === "number" ? config.headerBgSize : 100,
  headerBgPosY: typeof config?.headerBgPosY === "number" ? config.headerBgPosY : 50,
  headerBgOpacity: typeof config?.headerBgOpacity === "number" ? config.headerBgOpacity : 1,
});

export const mergeStoredSettings = (stored?: StoredSettings): Settings => ({
  ...defaultSettings,
  ...stored,
  bgConfigMap: stored?.bgConfigMap || {},
  brandLogo: stored?.brandLogo || "",
  specificViewKeywords: stored?.specificViewKeywords || ["MOMO", "85度C"],
  redeemUrlPresets: stored?.redeemUrlPresets || [],
  viewConfigs: {
    active: migrateViewConfig(stored?.viewConfigs?.active),
    completed: migrateViewConfig(stored?.viewConfigs?.completed),
    deleted: migrateViewConfig(stored?.viewConfigs?.deleted),
  },
});
