import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  FileDown,
  FileUp,
  LogOut,
  MoreHorizontal,
  NotebookText,
  Pin,
  PinOff,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserSquare2,
  Vault,
  X,
  KeyRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { dbHelper } from "@/lib/db";
import { createItemFromTemplate, createVaultPayload, getTemplateLabel, searchItems, templates, touchItem } from "@/lib/vault";
import type { EditableVaultItem, FieldType, VaultField, VaultItem, VaultPayload, VaultTemplateType } from "@/types/vault";

const DB_VAULT_KEY = "vault:data";

const fieldTypeLabels: Record<FieldType, string> = {
  text: "文字",
  password: "密碼",
  number: "數字",
  date: "日期",
  multiline: "多行文字",
};

const templateIcons = {
  login: KeyRound,
  identity: UserSquare2,
  note: NotebookText,
} satisfies Record<VaultTemplateType, typeof KeyRound>;

const classNames = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

const maskValue = (value: string) => {
  if (!value) return "未填寫";
  return "•".repeat(Math.min(12, Math.max(6, value.length)));
};

const generatePassword = () => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_+=";
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, (byte) => charset[byte % charset.length]).join("");
};

const createEditableItem = (item?: VaultItem, templateType: VaultTemplateType = "login"): EditableVaultItem =>
  item
    ? {
        ...structuredClone(item),
        tagsText: item.tags.join(", "),
      }
    : {
        ...createItemFromTemplate(templateType),
        tagsText: "",
      };

const formatRelativeTime = (timestamp?: number) => {
  if (!timestamp) return "尚未使用";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;
  return new Date(timestamp).toLocaleDateString("zh-TW", { month: "short", day: "numeric" });
};

const downloadTextFile = (filename: string, contents: string) => {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

type ItemCardProps = {
  item: VaultItem;
  onOpen: () => void;
  onCopy: (item: VaultItem, field: VaultField) => Promise<void>;
};

function ItemCard({ item, onOpen, onCopy }: ItemCardProps) {
  const Icon = templateIcons[item.templateType];
  const quickFields = item.fields.filter((field) => field.value.trim()).slice(0, 3);

  return (
    <Card className="overflow-hidden border-white/60 bg-white/80 shadow-xl shadow-slate-900/8 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <button className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={onOpen}>
            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-[20px] bg-secondary">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-semibold">{item.title}</p>
                {item.isPinned ? <Pin className="h-4 w-4 text-primary" /> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {getTemplateLabel(item.templateType)} ・ {formatRelativeTime(item.lastCopiedAt)}
              </p>
            </div>
          </button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl" onClick={onOpen}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {quickFields.length === 0 ? (
            <div className="rounded-2xl bg-secondary/70 px-3 py-3 text-sm text-muted-foreground">尚未填寫欄位內容</div>
          ) : (
            quickFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white px-3 py-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{field.label}</p>
                  <p className="truncate text-sm font-medium">{field.isSensitive ? maskValue(field.value) : field.value}</p>
                </div>
                <Button size="icon" className="h-10 w-10 rounded-2xl shrink-0" onClick={() => void onCopy(item, field)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [vault, setVault] = useState<VaultPayload | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorItem, setEditorItem] = useState<EditableVaultItem | null>(null);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      await dbHelper.init();
      const storedVault = await dbHelper.getItem<VaultPayload>(DB_VAULT_KEY);
      setVault(storedVault ?? createVaultPayload());
      setIsReady(true);
    };

    bootstrap().catch((error) => {
      console.error(error);
      toast.error("初始化失敗，請重新整理");
    });
  }, []);

  const persistVault = async (nextVault: VaultPayload) => {
    await dbHelper.setItem(DB_VAULT_KEY, nextVault);
    setVault(nextVault);
  };

  const items = vault?.items ?? [];
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
  const filteredItems = useMemo(() => searchItems(items, searchQuery), [items, searchQuery]);
  const pinnedItems = useMemo(() => items.filter((item) => item.isPinned).slice(0, 4), [items]);
  const recentItems = useMemo(
    () =>
      [...items]
        .sort((a, b) => (b.lastCopiedAt ?? b.updatedAt) - (a.lastCopiedAt ?? a.updatedAt))
        .slice(0, 5),
    [items],
  );

  const stats = useMemo(() => {
    const sensitiveFields = items.reduce(
      (count, item) => count + item.fields.filter((field) => field.isSensitive && field.value.trim()).length,
      0,
    );
    return {
      itemCount: items.length,
      pinnedCount: items.filter((item) => item.isPinned).length,
      sensitiveFields,
    };
  }, [items]);

  const copyField = async (item: VaultItem, field: VaultField) => {
    try {
      await navigator.clipboard.writeText(field.value);
      if (vault) {
        const nextVault = {
          ...vault,
          items: items.map((entry) => (entry.id === item.id ? touchItem(entry) : entry)),
        };
        await persistVault(nextVault);
      }
      setSelectedItemId(item.id);
      toast.success(`已複製 ${field.label}`);
    } catch (error) {
      console.error(error);
      toast.error("複製失敗");
    }
  };

  const openEditor = (item?: VaultItem, templateType?: VaultTemplateType) => {
    setEditorItem(createEditableItem(item, templateType));
    setEditorOpen(true);
  };

  const saveEditor = async () => {
    if (!vault || !editorItem) return;
    if (!editorItem.title.trim()) {
      toast.error("請輸入標題");
      return;
    }

    const nextItem: VaultItem = {
      ...editorItem,
      title: editorItem.title.trim(),
      tags: editorItem.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      fields: editorItem.fields.map((field) => ({
        ...field,
        label: field.label.trim() || "未命名欄位",
      })),
      updatedAt: Date.now(),
    };

    const exists = vault.items.some((item) => item.id === nextItem.id);
    const nextVault = {
      ...vault,
      items: exists ? vault.items.map((item) => (item.id === nextItem.id ? nextItem : item)) : [nextItem, ...vault.items],
    };
    await persistVault(nextVault);
    setEditorOpen(false);
    setEditorItem(null);
    toast.success(exists ? "資料已更新" : "已新增資料");
  };

  const removeItem = async (itemId: string) => {
    if (!vault || !window.confirm("要刪除這筆資料嗎？")) return;
    const nextVault = {
      ...vault,
      items: vault.items.filter((item) => item.id !== itemId),
    };
    await persistVault(nextVault);
    if (selectedItemId === itemId) setSelectedItemId(null);
    toast.success("已刪除");
  };

  const togglePin = async (itemId: string) => {
    if (!vault) return;
    const nextVault = {
      ...vault,
      items: vault.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isPinned: !item.isPinned,
              updatedAt: Date.now(),
            }
          : item,
      ),
    };
    await persistVault(nextVault);
  };

  const handleExport = () => {
    if (!vault) return;
    const payload = JSON.stringify({ format: "wallet-backup-v1", createdAt: Date.now(), vault }, null, 2);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadTextFile(`vault-backup-${stamp}.json`, payload);
    setExportOpen(false);
    toast.success("已匯出備份");
  };

  const handleImport = async () => {
    if (!vault || !importFile) {
      toast.error("請先選擇備份檔");
      return;
    }

    try {
      const raw = JSON.parse(await importFile.text()) as { format: string; vault: VaultPayload };
      if (raw.format !== "wallet-backup-v1") {
        toast.error("備份格式不正確");
        return;
      }

      const incomingVault = raw.vault;
      const nextVault =
        importMode === "merge"
          ? {
              ...incomingVault,
              items: [...incomingVault.items, ...vault.items.filter((item) => !incomingVault.items.some((entry) => entry.id === item.id))],
              settings: vault.settings,
            }
          : {
              ...incomingVault,
              settings: vault.settings,
            };

      await persistVault(nextVault);
      setImportOpen(false);
      setImportFile(null);
      toast.success(importMode === "merge" ? "已合併匯入" : "已還原備份");
    } catch (error) {
      console.error(error);
      toast.error("備份檔讀取失敗");
    }
  };

  const clearVault = async () => {
    if (!window.confirm("確定清空所有資料？")) return;
    const nextVault = createVaultPayload();
    await persistVault(nextVault);
    setSelectedItemId(null);
    setSettingsOpen(false);
    toast.success("已清空資料");
  };

  const renderFieldValue = (field: VaultField) => (field.isSensitive && !visibleFields[field.id] ? maskValue(field.value) : field.value || "未填寫");

  if (!isReady || !vault) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[28px] border border-white/40 bg-white/80 shadow-lg shadow-slate-900/10 backdrop-blur">
            <Vault className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Pocket Vault</p>
            <h1 className="mt-2 text-3xl font-semibold">正在載入資料保管箱</h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-6">
      <section className="rounded-[32px] border border-white/50 bg-white/75 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Pocket Vault</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">搜尋即複製</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">已取消密碼功能，現在打開 app 就能直接查看與複製資料。</p>
          </div>
          <Button variant="secondary" size="icon" className="h-11 w-11 rounded-2xl" onClick={() => setSettingsOpen(true)}>
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Card className="border-0 bg-slate-950 text-white shadow-xl shadow-slate-900/15">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Items</p>
              <p className="mt-2 text-3xl font-semibold">{stats.itemCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/90 shadow-xl shadow-slate-900/10">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pinned</p>
              <p className="mt-2 text-3xl font-semibold">{stats.pinnedCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-emerald-50/90 shadow-xl shadow-emerald-900/10">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700/70">Sensitive</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-800">{stats.sensitiveFields}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-5 rounded-[28px] bg-slate-950/95 p-4 text-white shadow-xl shadow-slate-900/15">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-white/60" />
            <input className="h-10 flex-1 bg-transparent text-base outline-none placeholder:text-white/45" placeholder="搜尋姓名、護照、網站、備註..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            {searchQuery ? (
              <button className="rounded-full p-1.5 text-white/60" onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-5">
        {!searchQuery && pinnedItems.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-muted-foreground">釘選資料</h2>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                最常用
              </Badge>
            </div>
            <div className="grid gap-3">
              {pinnedItems.map((item) => (
                <ItemCard key={item.id} item={item} onOpen={() => setSelectedItemId(item.id)} onCopy={copyField} />
              ))}
            </div>
          </div>
        ) : null}

        {!searchQuery && recentItems.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-muted-foreground">最近使用</h2>
              <span className="text-xs text-muted-foreground">點卡片就能看到所有欄位</span>
            </div>
            <div className="grid gap-3">
              {recentItems.map((item) => (
                <ItemCard key={item.id} item={item} onOpen={() => setSelectedItemId(item.id)} onCopy={copyField} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-muted-foreground">{searchQuery ? "搜尋結果" : "全部資料"}</h2>
            <span className="text-xs text-muted-foreground">{filteredItems.length} 筆</span>
          </div>

          {filteredItems.length === 0 ? (
            <Card className="border-dashed border-white/60 bg-white/70 shadow-lg shadow-slate-900/5">
              <CardContent className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-secondary">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold">沒有找到符合的內容</p>
                  <p className="mt-1 text-sm text-muted-foreground">試著搜尋姓名、護照號碼、網站或欄位名稱。</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} onOpen={() => setSelectedItemId(item.id)} onCopy={copyField} />
              ))}
            </div>
          )}
        </div>
      </section>

      <button className="fixed bottom-6 left-1/2 flex h-16 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-center gap-2 rounded-[28px] bg-slate-950 text-base font-medium text-white shadow-2xl shadow-slate-900/20" onClick={() => openEditor(undefined, "login")}>
        <Plus className="h-5 w-5" />
        新增資料
      </button>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItemId(null)}>
        <DialogContent className="top-auto max-h-[92vh] w-full translate-x-[-50%] translate-y-0 rounded-t-[32px] border-white/50 bg-white/95 p-0 sm:top-[50%] sm:max-w-xl sm:translate-y-[-50%] sm:rounded-[32px]">
          {selectedItem ? (
            <div className="max-h-[92vh] overflow-y-auto p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {getTemplateLabel(selectedItem.templateType)}
                    </Badge>
                    {selectedItem.isPinned ? (
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        已釘選
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold">{selectedItem.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">最近使用：{formatRelativeTime(selectedItem.lastCopiedAt)}</p>
                </div>
                <Button variant="secondary" size="icon" className="h-11 w-11 rounded-2xl" onClick={() => openEditor(selectedItem)}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-3">
                {selectedItem.fields.map((field) => (
                  <Card key={field.id} className="border-white/70 bg-white shadow-lg shadow-slate-900/5">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{field.label}</p>
                          <p className="mt-2 break-all text-base font-medium">{renderFieldValue(field)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {field.isSensitive ? (
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl" onClick={() => setVisibleFields((current) => ({ ...current, [field.id]: !current[field.id] }))}>
                              {visibleFields[field.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          ) : null}
                          <Button size="icon" className="h-10 w-10 rounded-2xl" onClick={() => void copyField(selectedItem, field)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedItem.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedItem.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Button variant="outline" className="rounded-2xl" onClick={() => void togglePin(selectedItem.id)}>
                  {selectedItem.isPinned ? <PinOff className="mr-1 h-4 w-4" /> : <Pin className="mr-1 h-4 w-4" />}
                  {selectedItem.isPinned ? "取消釘選" : "釘選"}
                </Button>
                <Button variant="outline" className="rounded-2xl" onClick={() => openEditor(selectedItem)}>
                  編輯
                </Button>
                <Button variant="destructive" className="rounded-2xl" onClick={() => void removeItem(selectedItem.id)}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  刪除
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="top-auto max-h-[92vh] w-full translate-x-[-50%] translate-y-0 rounded-t-[32px] border-white/50 bg-white/95 p-0 sm:top-[50%] sm:max-w-xl sm:translate-y-[-50%] sm:rounded-[32px]">
          {editorItem ? (
            <div className="max-h-[92vh] overflow-y-auto p-5">
              <DialogHeader>
                <DialogTitle>{vault?.items.some((item) => item.id === editorItem.id) ? "編輯資料" : "新增資料"}</DialogTitle>
                <DialogDescription>內建模板可快速開始，也能自由新增欄位。</DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {templates.map((template) => {
                    const Icon = templateIcons[template.type];
                    const active = editorItem.templateType === template.type;
                    return (
                      <button
                        key={template.type}
                        className={classNames("rounded-[24px] border px-3 py-4 text-left transition", active ? "border-primary bg-primary text-primary-foreground" : "border-white/70 bg-white")}
                        onClick={() => setEditorItem((current) => (current ? { ...current, templateType: template.type, fields: createItemFromTemplate(template.type).fields } : current))}
                      >
                        <Icon className="h-5 w-5" />
                        <p className="mt-3 text-sm font-medium">{template.label}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">標題</label>
                  <Input value={editorItem.title} onChange={(event) => setEditorItem((current) => (current ? { ...current, title: event.target.value } : current))} placeholder="例如：護照、GitHub、家用 Wi-Fi" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">標籤</label>
                  <Input value={editorItem.tagsText} onChange={(event) => setEditorItem((current) => (current ? { ...current, tagsText: event.target.value } : current))} placeholder="例如：旅行, 常用, 工作" />
                </div>

                <div className="space-y-3">
                  {editorItem.fields.map((field, index) => (
                    <Card key={field.id} className="border-white/70 bg-white shadow-sm">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">欄位 {index + 1}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setEditorItem((current) => (current ? { ...current, fields: current.fields.filter((entry) => entry.id !== field.id) } : current))} disabled={editorItem.fields.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <Input value={field.label} onChange={(event) => setEditorItem((current) => (current ? { ...current, fields: current.fields.map((entry) => (entry.id === field.id ? { ...entry, label: event.target.value } : entry)) } : current))} placeholder="欄位名稱" />

                        {field.type === "multiline" ? (
                          <Textarea value={field.value} onChange={(event) => setEditorItem((current) => (current ? { ...current, fields: current.fields.map((entry) => (entry.id === field.id ? { ...entry, value: event.target.value } : entry)) } : current))} placeholder="輸入內容" />
                        ) : (
                          <Input type={field.type === "password" ? "password" : field.type === "date" ? "date" : "text"} value={field.value} onChange={(event) => setEditorItem((current) => (current ? { ...current, fields: current.fields.map((entry) => (entry.id === field.id ? { ...entry, value: event.target.value } : entry)) } : current))} placeholder="輸入內容" />
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <select className="h-11 rounded-xl border border-input bg-card px-3 text-sm" value={field.type} onChange={(event) => setEditorItem((current) => (current ? { ...current, fields: current.fields.map((entry) => (entry.id === field.id ? { ...entry, type: event.target.value as FieldType } : entry)) } : current))}>
                            {Object.entries(fieldTypeLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>

                          <button className={classNames("rounded-xl border px-3 text-sm transition", field.isSensitive ? "border-primary bg-primary/10 text-primary" : "border-input bg-card text-muted-foreground")} onClick={() => setEditorItem((current) => (current ? { ...current, fields: current.fields.map((entry) => (entry.id === field.id ? { ...entry, isSensitive: !entry.isSensitive } : entry)) } : current))}>
                            {field.isSensitive ? "敏感欄位" : "一般欄位"}
                          </button>
                        </div>

                        {field.type === "password" ? (
                          <Button variant="outline" className="w-full rounded-xl" onClick={() => setEditorItem((current) => (current ? { ...current, fields: current.fields.map((entry) => (entry.id === field.id ? { ...entry, value: generatePassword(), isSensitive: true } : entry)) } : current))}>
                            <Sparkles className="mr-1 h-4 w-4" />
                            產生強密碼
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button variant="outline" className="w-full rounded-2xl" onClick={() => setEditorItem((current) => (current ? { ...current, fields: [...current.fields, { id: crypto.randomUUID(), label: "新欄位", value: "", type: "text", isSensitive: false, copyBehavior: "value" }] } : current))}>
                  <Plus className="mr-1 h-4 w-4" />
                  新增欄位
                </Button>

                <Button className="h-12 w-full rounded-2xl text-base" onClick={() => void saveEditor()}>
                  儲存資料
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="rounded-[32px] border-white/50 bg-white/95">
          <DialogHeader>
            <DialogTitle>匯出備份</DialogTitle>
            <DialogDescription>已取消密碼保護，備份會直接輸出為 JSON 檔。</DialogDescription>
          </DialogHeader>
          <Button className="w-full rounded-2xl" onClick={handleExport}>
            <FileDown className="mr-1 h-4 w-4" />
            下載備份
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="rounded-[32px] border-white/50 bg-white/95">
          <DialogHeader>
            <DialogTitle>匯入備份</DialogTitle>
            <DialogDescription>可覆蓋目前資料，或把備份內容和現有資料合併。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <button className="flex h-24 w-full items-center justify-between rounded-[24px] border border-dashed border-input bg-secondary/40 px-4" onClick={() => fileInputRef.current?.click()}>
              <div className="text-left">
                <p className="text-sm font-medium">{importFile ? importFile.name : "選擇備份檔"}</p>
                <p className="mt-1 text-xs text-muted-foreground">接受 `wallet-backup-v1` JSON 檔</p>
              </div>
              <FileUp className="h-5 w-5 text-muted-foreground" />
            </button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} />

            <div className="grid grid-cols-2 gap-3">
              <button className={classNames("rounded-2xl border px-4 py-3 text-sm", importMode === "replace" ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")} onClick={() => setImportMode("replace")}>
                取代目前資料
              </button>
              <button className={classNames("rounded-2xl border px-4 py-3 text-sm", importMode === "merge" ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")} onClick={() => setImportMode("merge")}>
                合併匯入
              </button>
            </div>

            <Button className="w-full rounded-2xl" onClick={() => void handleImport()}>
              開始匯入
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="top-auto w-full translate-x-[-50%] translate-y-0 rounded-t-[32px] border-white/50 bg-white/95 p-5 sm:top-[50%] sm:max-w-xl sm:translate-y-[-50%] sm:rounded-[32px]">
          <DialogHeader>
            <DialogTitle>保管箱設定</DialogTitle>
            <DialogDescription>目前已取消密碼與鎖定流程，打開 app 就能直接使用。</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <button className="flex w-full items-center justify-between rounded-[24px] border border-white/70 bg-white px-4 py-4 text-left" onClick={() => openEditor(undefined, "identity")}>
              <div>
                <p className="font-medium">新增證件資料</p>
                <p className="mt-1 text-sm text-muted-foreground">快速填姓名、護照號碼、國籍與日期</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button className="flex w-full items-center justify-between rounded-[24px] border border-white/70 bg-white px-4 py-4 text-left" onClick={() => setExportOpen(true)}>
              <div>
                <p className="font-medium">匯出備份</p>
                <p className="mt-1 text-sm text-muted-foreground">不再需要輸入備份密碼</p>
              </div>
              <FileDown className="h-5 w-5 text-muted-foreground" />
            </button>

            <button className="flex w-full items-center justify-between rounded-[24px] border border-white/70 bg-white px-4 py-4 text-left" onClick={() => setImportOpen(true)}>
              <div>
                <p className="font-medium">匯入備份</p>
                <p className="mt-1 text-sm text-muted-foreground">可選擇覆蓋或合併現有內容</p>
              </div>
              <FileUp className="h-5 w-5 text-muted-foreground" />
            </button>

            <Button variant="outline" className="w-full rounded-2xl" onClick={() => setSettingsOpen(false)}>
              <LogOut className="mr-1 h-4 w-4" />
              關閉設定
            </Button>

            <Button variant="destructive" className="w-full rounded-2xl" onClick={() => void clearVault()}>
              <Trash2 className="mr-1 h-4 w-4" />
              清空所有資料
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
