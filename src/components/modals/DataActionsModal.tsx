import React from 'react';
import { Activity, ArchiveRestore, DatabaseBackup, Eraser } from 'lucide-react';

import { ModalShell } from '@/components/ui/modal-shell';

interface DataActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackup: () => void;
  onImportClick: () => void;
  onReset: () => void;
  onHealthCheck: () => void;
}

export const DataActionsModal: React.FC<DataActionsModalProps> = ({
  isOpen,
  onClose,
  onBackup,
  onImportClick,
  onReset,
  onHealthCheck,
}) => {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="max-w-xs"
      header={<h2 className="text-center text-lg font-black text-foreground">資料管理</h2>}
      footer={
        <button onClick={onClose} className="w-full py-3 text-sm font-bold text-muted-foreground">
          取消
        </button>
      }
    >
      <div className="space-y-4">
        <button
          onClick={onHealthCheck}
          className="flex w-full flex-col items-center gap-1 rounded-2xl bg-blue-500/10 py-4 font-bold text-blue-500 transition-colors hover:bg-blue-500/20"
        >
          <Activity size={24} /> 資料健檢
        </button>

        <button
          onClick={onBackup}
          className="flex w-full flex-col items-center gap-1 rounded-2xl bg-primary/10 py-4 font-bold text-primary transition-colors hover:bg-primary/20"
        >
          <DatabaseBackup size={24} /> 匯出備份 (JSON)
        </button>
        <button
          onClick={onImportClick}
          className="flex w-full flex-col items-center gap-1 rounded-2xl bg-ticket-success/10 py-4 font-bold text-ticket-success transition-colors hover:bg-ticket-success/20"
        >
          <ArchiveRestore size={24} /> 匯入還原
        </button>
        <button
          onClick={onReset}
          className="flex w-full flex-col items-center gap-1 rounded-2xl bg-muted py-4 font-bold text-muted-foreground transition-colors hover:bg-ticket-warning/10 hover:text-ticket-warning"
        >
          <Eraser size={24} /> 清空/重置
        </button>
      </div>
    </ModalShell>
  );
};
