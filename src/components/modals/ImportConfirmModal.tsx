import React, { useState } from 'react';
import { FileJson, Check } from 'lucide-react';

interface ImportConfirmModalProps {
  isOpen: boolean;
  data: any;
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
  const hasSettings = !!data.settings;

  return (
    <div
      className="fixed inset-0 bg-foreground/60 z-[60] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-card w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <FileJson size={32} />
          </div>
          <h2 className="text-xl font-black text-foreground">準備匯入資料</h2>
          <p className="text-sm text-muted-foreground font-bold mt-1">偵測到 {count} 筆票券資料</p>
        </div>
        <div className="space-y-4">
          <div className="flex bg-muted p-1 rounded-2xl">
            <button
              onClick={() => setMode('append')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                mode === 'append' ? 'bg-card shadow text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              添加
            </button>
            <button
              onClick={() => setMode('overwrite')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                mode === 'overwrite' ? 'bg-card shadow text-ticket-warning' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              覆蓋
            </button>
          </div>
          {hasSettings && (
            <label className="flex items-center gap-3 p-4 bg-muted rounded-2xl cursor-pointer">
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  restoreSettings ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-card'
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
        <div className="flex gap-3 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 bg-muted text-muted-foreground rounded-2xl font-bold"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(mode, restoreSettings)}
            className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95"
          >
            確認匯入
          </button>
        </div>
      </div>
    </div>
  );
};
