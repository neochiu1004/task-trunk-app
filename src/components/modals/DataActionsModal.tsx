import React, { useState, useEffect } from 'react';
import { DatabaseBackup, ArchiveRestore, Eraser, Activity, Cloud, CloudDownload, Loader2, ExternalLink, FileJson, RefreshCw, AlertTriangle } from 'lucide-react';
import { Settings } from '../../types/ticket';
import { dbHelper } from '../../lib/db';
import { formatDistanceToNow, format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast } from '../../hooks/use-toast';
import { validateImportData, isValidGasUrl } from '../../lib/validation';

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

  const hasGoogleDriveConfig = !!settings.googleDrive?.gasWebAppUrl;
  const isGasUrlValid = settings.googleDrive?.gasWebAppUrl ? isValidGasUrl(settings.googleDrive.gasWebAppUrl) : false;
  
  // Note: fetchCloudFileInfo is disabled because the legacy GAS backend
  // does not support action=getFileInfo. The doGet only returns file content.
  // Keeping this as a placeholder for future GAS versions that may support metadata.
  const fetchCloudFileInfo = async () => {
    // Legacy GAS mode: metadata query not supported
    // Set to null to show "舊版模式不支援顯示詳細資訊" message
    setCloudFileInfo(null);
    setCloudFileError('舊版 GAS 不支援顯示詳細資訊');
  };

  useEffect(() => {
    if (isOpen && hasGoogleDriveConfig) {
      // Show legacy mode message instead of fetching
      setCloudFileError('舊版 GAS 模式');
      setCloudFileInfo(null);
    }
  }, [isOpen, hasGoogleDriveConfig]);

  if (!isOpen) return null;

  const handleCloudBackup = async () => {
    if (!settings.googleDrive?.gasWebAppUrl) {
      alert('請先在設定中配置 GAS Web App URL');
      return;
    }

    if (!isValidGasUrl(settings.googleDrive.gasWebAppUrl)) {
      alert('請使用官方 Google Apps Script 網址 (https://script.google.com/...)');
      return;
    }

    setCloudBackupStatus('loading');
    try {
      const allData = await dbHelper.exportAllData();
      // Calculate size before sending (for display purposes)
      const contentForSize = JSON.stringify(allData, null, 2);
      const contentSize = new Blob([contentForSize]).size;

      // Use text/plain to avoid CORS preflight (OPTIONS) which GAS doesn't support
      // GAS will handle the string content and we must manually stringify the body
      const response = await fetch(settings.googleDrive.gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          filename: settings.googleDrive.backupFileName || 'vouchy-backup.json',
          folder: settings.googleDrive.folderId || undefined, 
          content: allData, 
        }),
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json().catch(() => ({ status: 'error', message: '無法解析伺服器回應' }));
      if (data.status === 'error') throw new Error(data.message || 'Unknown error');
      if (data.error) throw new Error(data.error);

      await dbHelper.recordBackup();
      setCloudBackupStatus('success');
      
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
    if (!settings.googleDrive?.gasWebAppUrl) {
      alert('請先在設定中配置 GAS Web App URL');
      return;
    }

    if (!isValidGasUrl(settings.googleDrive.gasWebAppUrl)) {
      alert('請使用官方 Google Apps Script 網址 (https://script.google.com/...)');
      return;
    }

    if (!confirm('確定要從雲端還原嗎？這將覆蓋目前的所有資料。')) {
      return;
    }

    setCloudRestoreStatus('loading');
    try {
      // Use lowercase 'filename' and 'folder' to match GAS expectations
      const params = new URLSearchParams({
        filename: settings.googleDrive.backupFileName || 'vouchy-backup.json',
      });
      if (settings.googleDrive.folderId) {
        params.set('folder', settings.googleDrive.folderId); 
      }

      const response = await fetch(`${settings.googleDrive.gasWebAppUrl}?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) throw new Error('伺服器未傳回正確的 JSON 格式');
      
      const data = await response.json();

      // Check for error responses from GAS
      if (data.error) {
        if (data.error === 'Folder not found' || data.error === 'File not found') {
          alert('找不到備份檔案或資料夾');
          setCloudRestoreStatus('idle');
          return;
        }
        throw new Error(data.error);
      }

      // Legacy GAS returns the content directly without { data: ... } wrapper
      const restoredData = data;
      
      // Validate restored data
      const validationResult = validateImportData(restoredData);
      if (validationResult.success === false) {
        alert(`還原資料驗證失敗:\n${validationResult.error}`);
        setCloudRestoreStatus('error');
        setTimeout(() => setCloudRestoreStatus('idle'), 3000);
        return;
      }
      
      if (onImportData) {
        onImportData(validationResult.data);
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
            {/* Security warning for non-official GAS URL */}
            {!isGasUrlValid && settings.googleDrive?.gasWebAppUrl && (
              <div className="flex items-start gap-2 p-2 bg-ticket-warning/10 rounded-lg text-ticket-warning text-xs">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>請使用官方 Google Apps Script 網址 (https://script.google.com/...)</span>
              </div>
            )}
            
            {/* Cloud File Info Section - Legacy Mode Notice */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileJson size={16} className="text-indigo-500" />
                雲端備份 (舊版模式)
              </div>
              <div className="text-xs text-muted-foreground">
                舊版 GAS 不支援顯示詳細資訊，請直接使用備份/還原功能。
              </div>
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
