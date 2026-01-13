import { z } from 'zod';

// Maximum sizes for security
const MAX_STRING_LENGTH = 500;
const MAX_LONG_STRING_LENGTH = 5000;
const MAX_BASE64_IMAGE_SIZE = 2000000; // ~2MB in base64
const MAX_TICKETS = 10000;
const MAX_TEMPLATES = 100;
const MAX_TAGS = 50;
const MAX_BG_HISTORY = 50;

// URL validation helper
export const isValidHttpUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Google Apps Script URL validation
export const isValidGasUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'script.google.com';
  } catch {
    return false;
  }
};

// Ticket schema
const TicketSchema = z.object({
  id: z.string().max(100),
  productName: z.string().max(MAX_STRING_LENGTH),
  serial: z.string().max(MAX_STRING_LENGTH).optional().default(''),
  expiry: z.string().max(50),
  image: z.string().max(MAX_BASE64_IMAGE_SIZE).optional().default(''),
  originalImage: z.string().max(MAX_BASE64_IMAGE_SIZE).optional(),
  images: z.array(z.string().max(MAX_BASE64_IMAGE_SIZE)).max(10).optional(),
  tags: z.array(z.string().max(100)).max(MAX_TAGS).optional().default([]),
  note: z.string().max(MAX_LONG_STRING_LENGTH).optional(),
  barcodeFormat: z.string().max(50).optional(),
  completed: z.boolean().optional().default(false),
  completedAt: z.number().optional(),
  isDeleted: z.boolean().optional().default(false),
  deletedAt: z.number().optional(),
  createdAt: z.number(),
  redeemUrl: z.string().max(MAX_STRING_LENGTH).optional().refine(
    (url) => !url || isValidHttpUrl(url),
    { message: 'redeemUrl must be a valid HTTP/HTTPS URL' }
  ),
});

// Template schema
const TemplateSchema = z.object({
  id: z.string().max(100),
  label: z.string().max(MAX_STRING_LENGTH),
  productName: z.string().max(MAX_STRING_LENGTH),
  image: z.string().max(MAX_BASE64_IMAGE_SIZE).optional(),
  tags: z.array(z.string().max(100)).max(MAX_TAGS).optional(),
  serial: z.string().max(MAX_STRING_LENGTH).optional(),
  expiry: z.string().max(50).optional(),
  redeemUrl: z.string().max(MAX_STRING_LENGTH).optional().refine(
    (url) => !url || isValidHttpUrl(url),
    { message: 'redeemUrl must be a valid HTTP/HTTPS URL' }
  ),
});

// ViewConfig schema
const ViewConfigSchema = z.object({
  backgroundImage: z.string().max(MAX_BASE64_IMAGE_SIZE).optional().default(''),
  headerBackgroundImage: z.string().max(MAX_BASE64_IMAGE_SIZE).optional().default(''),
  cardOpacity: z.number().min(0).max(1).optional().default(1),
  bgOpacity: z.number().min(0).max(1).optional().default(1),
  bgPosY: z.number().min(0).max(100).optional().default(50),
  bgSize: z.number().min(10).max(500).optional().default(100),
  cardBgColor: z.string().max(20).optional().default('#ffffff'),
  cardBorderColor: z.string().max(20).optional().default('#e2e8f0'),
  compactHeight: z.number().min(40).max(200).optional().default(70),
  compactShowImage: z.boolean().optional().default(true),
  headerBgSize: z.number().min(10).max(500).optional().default(100),
  headerBgPosY: z.number().min(0).max(100).optional().default(50),
  headerBgOpacity: z.number().min(0).max(1).optional().default(1),
}).passthrough();

// GoogleDrive config schema
const GoogleDriveConfigSchema = z.object({
  gasWebAppUrl: z.string().max(500).optional().default(''),
  backupFileName: z.string().max(200).optional().default('vouchy-backup.json'),
  folderId: z.string().max(200).optional(),
}).passthrough();

// Settings schema
const SettingsSchema = z.object({
  tgToken: z.string().max(200).optional().default(''),
  tgChatId: z.string().max(50).optional().default(''),
  notifyDays: z.number().min(1).max(365).optional().default(7),
  appTitle: z.string().max(100).optional().default(''),
  brandLogo: z.string().max(MAX_BASE64_IMAGE_SIZE).optional(),
  specificViewKeywords: z.array(z.string().max(50)).max(20).optional().default([]),
  bgConfigMap: z.record(z.object({
    bgSize: z.number().optional(),
    bgPosY: z.number().optional(),
  })).optional().default({}),
  viewConfigs: z.object({
    active: ViewConfigSchema.optional(),
    completed: ViewConfigSchema.optional(),
    deleted: ViewConfigSchema.optional(),
  }).optional(),
  googleDrive: GoogleDriveConfigSchema.optional(),
  localBackupFileName: z.string().max(100).optional(),
  autoCopySerialOnRedeem: z.boolean().optional(),
}).passthrough();

// Import data schema
export const ImportDataSchema = z.object({
  version: z.number().optional(),
  timestamp: z.number().optional(),
  tasks: z.array(TicketSchema).max(MAX_TICKETS).optional().default([]),
  settings: SettingsSchema.optional(),
  templates: z.array(TemplateSchema).max(MAX_TEMPLATES).optional(),
  bgHistory: z.array(z.string().max(MAX_BASE64_IMAGE_SIZE)).max(MAX_BG_HISTORY).optional(),
}).passthrough();

// Legacy format support (array of tickets)
export const LegacyImportSchema = z.array(TicketSchema).max(MAX_TICKETS);

export type ValidatedImportData = z.infer<typeof ImportDataSchema>;
export type ValidatedTicket = z.infer<typeof TicketSchema>;

/**
 * Validates imported JSON data against our schema
 * Supports both new format (object with tasks, settings, etc.) and legacy format (array of tickets)
 */
export const validateImportData = (data: unknown): { success: true; data: ValidatedImportData } | { success: false; error: string } => {
  try {
    // Check if it's a legacy format (array)
    if (Array.isArray(data)) {
      const result = LegacyImportSchema.safeParse(data);
      if (result.success) {
        return { success: true, data: { tasks: result.data } };
      }
      return { success: false, error: formatZodError(result.error) };
    }

    // New format (object)
    const result = ImportDataSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: formatZodError(result.error) };
  } catch (error) {
    return { success: false, error: `驗證失敗: ${(error as Error).message}` };
  }
};

/**
 * Format Zod errors into a user-friendly message
 */
const formatZodError = (error: z.ZodError): string => {
  const issues = error.issues.slice(0, 3); // Only show first 3 issues
  const messages = issues.map(issue => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  
  if (error.issues.length > 3) {
    messages.push(`...還有 ${error.issues.length - 3} 個問題`);
  }
  
  return `資料格式錯誤:\n${messages.join('\n')}`;
};

/**
 * Validate a redeemUrl before opening
 */
export const validateRedeemUrl = (url: string | undefined): { valid: boolean; error?: string } => {
  if (!url) {
    return { valid: false, error: '網址為空' };
  }
  
  if (!isValidHttpUrl(url)) {
    return { valid: false, error: '僅支援 http:// 或 https:// 網址' };
  }
  
  return { valid: true };
};
