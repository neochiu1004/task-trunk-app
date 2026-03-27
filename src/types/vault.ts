export type FieldType = "text" | "password" | "number" | "date" | "multiline";

export type VaultTemplateType = "login" | "identity" | "note";

export type VaultField = {
  id: string;
  label: string;
  type: FieldType;
  value: string;
  isSensitive: boolean;
  copyBehavior: "value";
};

export type VaultItem = {
  id: string;
  templateType: VaultTemplateType;
  title: string;
  tags: string[];
  isPinned: boolean;
  fields: VaultField[];
  createdAt: number;
  updatedAt: number;
  lastCopiedAt?: number;
};

export type EditableVaultItem = VaultItem & {
  tagsText: string;
};

export type VaultSettings = {
  idleTimeoutMs: number;
  locale: string;
};

export type VaultPayload = {
  version: number;
  settings: VaultSettings;
  items: VaultItem[];
};

export type PasswordStrength = {
  score: number;
  label: string;
};
