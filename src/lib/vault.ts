import type { PasswordStrength, VaultField, VaultItem, VaultPayload, VaultSettings, VaultTemplateType } from "@/types/vault";

const now = () => Date.now();

const createField = (label: string, type: VaultField["type"], isSensitive = false, value = ""): VaultField => ({
  id: crypto.randomUUID(),
  label,
  value,
  type,
  isSensitive,
  copyBehavior: "value",
});

export const templates: Array<{ type: VaultTemplateType; label: string }> = [
  { type: "login", label: "登入資料" },
  { type: "identity", label: "證件資料" },
  { type: "note", label: "一般備忘" },
];

export const getTemplateLabel = (type: VaultTemplateType) => templates.find((template) => template.type === type)?.label ?? "資料";

export const createVaultSettings = (): VaultSettings => ({
  idleTimeoutMs: 90_000,
  locale: "zh-TW",
});

export const createVaultPayload = (): VaultPayload => ({
  version: 1,
  settings: createVaultSettings(),
  items: [
    {
      id: crypto.randomUUID(),
      templateType: "identity",
      title: "我的護照",
      tags: ["旅行", "常用"],
      isPinned: true,
      createdAt: now(),
      updatedAt: now(),
      fields: [
        createField("中文姓名", "text"),
        createField("英文姓名", "text"),
        createField("護照號碼", "text", true),
        createField("國籍", "text"),
        createField("出生日期", "date"),
        createField("有效期限", "date"),
      ],
    },
  ],
});

export const createItemFromTemplate = (type: VaultTemplateType): VaultItem => {
  const base = {
    id: crypto.randomUUID(),
    templateType: type,
    title: "",
    tags: [],
    isPinned: false,
    createdAt: now(),
    updatedAt: now(),
  };

  if (type === "identity") {
    return {
      ...base,
      fields: [
        createField("中文姓名", "text"),
        createField("英文姓名", "text"),
        createField("護照號碼", "text", true),
        createField("國籍", "text"),
        createField("出生日期", "date"),
        createField("有效期限", "date"),
        createField("備註", "multiline"),
      ],
    };
  }

  if (type === "note") {
    return {
      ...base,
      fields: [createField("內容", "multiline"), createField("備註", "multiline")],
    };
  }

  return {
    ...base,
    fields: [
      createField("網站 / 服務", "text"),
      createField("帳號", "text"),
      createField("密碼", "password", true),
      createField("網址", "text"),
      createField("備註", "multiline"),
    ],
  };
};

export const touchItem = (item: VaultItem): VaultItem => ({
  ...item,
  lastCopiedAt: now(),
  updatedAt: now(),
});

export const searchItems = (items: VaultItem[], query: string) => {
  if (!query.trim()) {
    return [...items].sort((a, b) => {
      const aRank = a.isPinned ? Number.MAX_SAFE_INTEGER : a.lastCopiedAt ?? a.updatedAt;
      const bRank = b.isPinned ? Number.MAX_SAFE_INTEGER : b.lastCopiedAt ?? b.updatedAt;
      return bRank - aRank;
    });
  }

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return items
    .filter((item) => {
      const haystack = [item.title, getTemplateLabel(item.templateType), ...item.tags, ...item.fields.flatMap((field) => [field.label, field.value])]
        .join(" ")
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    })
    .sort((a, b) => (b.lastCopiedAt ?? b.updatedAt) - (a.lastCopiedAt ?? a.updatedAt));
};

export const detectPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: "偏弱，建議加入大小寫、數字與符號" };
  if (score === 3) return { score, label: "中等，可再增加長度與符號" };
  return { score, label: "強度不錯，適合當主密碼" };
};
