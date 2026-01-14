import React from 'react';
import { DatabaseBackup, ArchiveRestore, Eraser, Activity } from 'lucide-react';
import { Settings } from '../../types/ticket';

interface DataActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackup: () => void;
  onImportClick: () => void;
  onReset: () => void;
  onHealthCheck: () => void;
  settings: Settings;
  onImportData?: (data: Record<string, unknown>) => void;
}

export const DataActionsModal: React.FC<DataActionsModalProps> = ({
  isOpen,
  onClose,
  onBackup,
  onImportClick,
  onReset,
  onHealthCheck,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-xs rounded-3xl p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-black text-foreground text-center mb-2">資料管理</h2>
        <button
          onClick={onHealthCheck}
          className="w-full py-4 bg-blue-500/10 text-blue-500 rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-blue-500/20 transition-colors"
        >
          <Activity size={24} /> 資料健檢
        </button>

        <button
          onClick={onBackup}
          className="w-full py-4 bg-primary/10 text-primary rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-primary/20 transition-colors"
        >
          <DatabaseBackup size={24} /> 匯出備份 (JSON)
        </button>
        <button
          onClick={onImportClick}
          className="w-full py-4 bg-ticket-success/10 text-ticket-success rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-ticket-success/20 transition-colors"
        >
          <ArchiveRestore size={24} /> 匯入還原
        </button>
        <button
          onClick={onReset}
          className="w-full py-4 bg-muted text-muted-foreground rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-ticket-warning/10 hover:text-ticket-warning transition-colors"
        >
          <Eraser size={24} /> 清空/重置
        </button>
        <button onClick={onClose} className="w-full py-3 text-muted-foreground font-bold text-sm mt-2">
          取消
        </button>
      </div>
    </div>
  );
};
