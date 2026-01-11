import React, { useState, useEffect } from 'react';
import { DatabaseBackup, ArchiveRestore, Eraser, Activity, Cloud, CloudDownload, Loader2, ExternalLink, FileJson, RefreshCw } from 'lucide-react';
import { Settings } from '@/types/ticket';
import { supabase } from '@/integrations/supabase/client';
import { dbHelper } from '@/lib/db';
import { formatDistanceToNow, format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface CloudFileInfo {
  id: string;
  name: string;
  size: string;
  modifiedTime: string;
  webViewLink: string;
}

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
  settings,
  onImportData,
}) => {
  const [cloudBackupStatus, setCloudBackupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [cloudRestoreStatus, setCloudRestoreStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [cloudFileInfo, setCloudFileInfo] = useState<CloudFileInfo | null>(null);
  const [cloudFileLoading, setCloudFileLoading] = useState(false);
  const [cloudFileError, setCloudFileError] = useState<string | null>(null);

  const hasGoogleDriveConfig = !!settings.googleDrive?.serviceAccountJson;

  const fetchCloudFileInfo = async () => {
    if (!settings.googleDrive?.serviceAccountJson) return;

    setCloudFileLoading(true);
    setCloudFileError(null);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-backup', {
        body: {
          action: 'getFileInfo',
          serviceAccountJson: settings.googleDrive.serviceAccountJson,
          fileName: settings.googleDrive.backupFileName || 'vouchy-backup.json',
          folderId: settings.googleDrive.folderId || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.notFound) {
        setCloudFileInfo(null);
      } else if (data?.fileInfo) {
        setCloudFileInfo(data.fileInfo);
      }
    } catch (err) {
      setCloudFileError((err as Error).message);
    } finally {
      setCloudFileLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && hasGoogleDriveConfig) {
      fetchCloudFileInfo();
    }
  }, [isOpen, hasGoogleDriveConfig]);

  if (!isOpen) return null;

  const handleCloudBackup = async () => {
    if (!settings.googleDrive?.serviceAccountJson) {
      alert('請先在設定中配置 Google Drive 憑證');
      return;
    }

    setCloudBackupStatus('loading');
    try {
      const allData = await dbHelper.exportAllData();
      const content = JSON.stringify(allData, null, 2);
      const contentSize = new Blob([content]).size;

      const { data, error } = await supabase.functions.invoke('google-drive-backup', {
        body: {
          action: 'backup',
          serviceAccountJson: settings.googleDrive.serviceAccountJson,
          fileName: settings.googleDrive.backupFileName || 'vouchy-backup.json',
          folderId: settings.googleDrive.folderId || undefined,
          content,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await dbHelper.recordBackup();
      setCloudBackupStatus('success');
      fetchCloudFileInfo();
      
      const now = new Date();
      const fileSizeKB = (contentSize / 1024).toFixed(1);
      toast({
        title: "☁️ 雲端備份成功",
        description: `備份時間：${format(now, 'yyyy/MM/dd HH:mm:ss', { locale: zhTW })}\n檔案大小：${fileSizeKB} KB`,
      });
      
      setTimeout(() => setCloudBackupStatus('idle'), 3000);
    } catch (err) {
      setCloudBackupStatus('error');
      toast({
        title: "備份失敗",
        description: (err as Error).message,
        variant: "destructive",
      });
      setTimeout(() => setCloudBackupStatus('idle'), 3000);
    }
  };

  const handleCloudRestore = async () => {
    if (!settings.googleDrive?.serviceAccountJson) {
      alert('請先在設定中配置 Google Drive 憑證');
      return;
    }

    if (!confirm('確定要從雲端還原嗎？這將覆蓋目前的所有資料。')) {
      return;
    }

    setCloudRestoreStatus('loading');
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-backup', {
        body: {
          action: 'restore',
          serviceAccountJson: settings.googleDrive.serviceAccountJson,
          fileName: settings.googleDrive.backupFileName || 'vouchy-backup.json',
          folderId: settings.googleDrive.folderId || undefined,
        },
      });

      if (error) throw error;
      if (data?.notFound) {
        alert('找不到備份檔案');
        setCloudRestoreStatus('idle');
        return;
      }
      if (data?.error) throw new Error(data.error);

      const restoredData = JSON.parse(data.data);
      if (onImportData) {
        onImportData(restoredData);
      }

      setCloudRestoreStatus('success');
      setTimeout(() => {
        setCloudRestoreStatus('idle');
        onClose();
      }, 1500);
    } catch (err) {
      setCloudRestoreStatus('error');
      alert(`還原失敗: ${(err as Error).message}`);
      setTimeout(() => setCloudRestoreStatus('idle'), 3000);
    }
  };
  
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
        
        {hasGoogleDriveConfig && (
          <div className="space-y-3">
            {/* Cloud File Info Section */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileJson size={16} className="text-indigo-500" />
                  雲端備份資訊
                </div>
                <button
                  onClick={fetchCloudFileInfo}
                  disabled={cloudFileLoading}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <RefreshCw size={14} className={`text-muted-foreground ${cloudFileLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {cloudFileLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" />
                  載入中...
                </div>
              ) : cloudFileError ? (
                <div className="text-xs text-ticket-warning">
                  {cloudFileError}
                </div>
              ) : cloudFileInfo ? (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">檔案名稱</span>
                    <span className="text-foreground font-medium">{cloudFileInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">上次備份</span>
                    <span className="text-foreground font-medium">
                      {formatDistanceToNow(new Date(cloudFileInfo.modifiedTime), { addSuffix: true, locale: zhTW })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">檔案大小</span>
                    <span className="text-foreground font-medium">
                      {(parseInt(cloudFileInfo.size) / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  {cloudFileInfo.webViewLink && (
                    <a
                      href={cloudFileInfo.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-500 hover:underline mt-1"
                    >
                      <ExternalLink size={12} />
                      在 Google Drive 中查看
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  尚無雲端備份檔案
                </div>
              )}
            </div>

            {/* Cloud Backup/Restore Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCloudBackup}
                disabled={cloudBackupStatus === 'loading'}
                className={`flex-1 py-4 rounded-2xl font-bold flex flex-col items-center gap-1 transition-colors ${
                  cloudBackupStatus === 'success'
                    ? 'bg-ticket-success/20 text-ticket-success'
                    : cloudBackupStatus === 'error'
                    ? 'bg-ticket-warning/20 text-ticket-warning'
                    : 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20'
                }`}
              >
                {cloudBackupStatus === 'loading' ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Cloud size={24} />
                )}
                <span className="text-xs">
                  {cloudBackupStatus === 'loading' ? '備份中...' : cloudBackupStatus === 'success' ? '備份成功' : '雲端備份'}
                </span>
              </button>
              <button
                onClick={handleCloudRestore}
                disabled={cloudRestoreStatus === 'loading'}
                className={`flex-1 py-4 rounded-2xl font-bold flex flex-col items-center gap-1 transition-colors ${
                  cloudRestoreStatus === 'success'
                    ? 'bg-ticket-success/20 text-ticket-success'
                    : cloudRestoreStatus === 'error'
                    ? 'bg-ticket-warning/20 text-ticket-warning'
                    : 'bg-violet-500/10 text-violet-500 hover:bg-violet-500/20'
                }`}
              >
                {cloudRestoreStatus === 'loading' ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <CloudDownload size={24} />
                )}
                <span className="text-xs">
                  {cloudRestoreStatus === 'loading' ? '還原中...' : cloudRestoreStatus === 'success' ? '還原成功' : '雲端還原'}
                </span>
              </button>
            </div>
          </div>
        )}

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
