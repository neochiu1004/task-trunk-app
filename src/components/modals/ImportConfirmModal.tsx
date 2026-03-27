import React, { useState } from 'react';
import { Check, FileJson } from 'lucide-react';

import { ModalShell } from '@/components/ui/modal-shell';
import type { ImportPayload } from '@/types/app';
import type { Ticket } from '@/types/ticket';

interface ImportConfirmModalProps {
  isOpen: boolean;
  data: ImportPayload | Ticket[] | null;
  onConfirm: (mode: 'append' | 'overwrite', restoreSettings: boolean) => void;
  onCancel: () => void;
}

export const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({
  isOpen,
  data,
  onConfirm,
  onCancel,
}) => {
  const [mode, setMode] = useState<'append' | 'overwrite'>('append');
  const [restoreSettings, setRestoreSettings] = useState(false);

  if (!isOpen || !data) return null;

  const count = Array.isArray(data) ? data.length : (data.tasks || []).length;
  const hasSettings = !!(!Array.isArray(data) && data.settings);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      contentClassName="max-w-sm"
      header={
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileJson size={32} />
          </div>
          <h2 className="text-xl font-black text-foreground">準備匯入資料</h2>
          <p className="mt-1 text-sm font-bold text-muted-foreground">偵測到 {count} 筆票券資料</p>
        </div>
      }
      footer={
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-muted py-3.5 font-bold text-muted-foreground"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(mode, restoreSettings)}
            className="flex-1 rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 active:scale-95"
          >
            確認匯入
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex rounded-2xl bg-muted p-1">
          <button
            onClick={() => setMode('append')}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
              mode === 'append' ? 'bg-card text-primary shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            添加
          </button>
          <button
            onClick={() => setMode('overwrite')}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
              mode === 'overwrite' ? 'bg-card text-ticket-warning shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            覆蓋
          </button>
        </div>

        {hasSettings && (
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-muted p-4">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                restoreSettings ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-card'
              }`}
            >
              {restoreSettings && <Check size={14} className="text-primary-foreground" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={restoreSettings}
              onChange={(e) => setRestoreSettings(e.target.checked)}
            />
            <div className="text-sm font-bold text-foreground">還原設定 (標題、背景等)</div>
          </label>
        )}
      </div>
    </ModalShell>
  );
};
