import React, { useState } from 'react';
import { X, Minus, Plus, Check, CloudCog, ListTodo, CheckCircle2, Trash, PanelTop, Palette, PaintBucket, Droplets, Maximize, Move, Rows, Image as ImageIcon, SendHorizontal, Loader2, HardDrive, FolderOpen, FileJson, Copy, Link, ShieldAlert } from 'lucide-react';
import { Settings, ViewConfig, GoogleDriveConfig } from '@/types/ticket';
import { defaultViewConfig } from '@/lib/constants';
import { compressImage, sendTelegramMessage } from '@/lib/helpers';
import { isValidGasUrl } from '@/lib/validation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  bgHistory: string[];
  onSave: (settings: Settings) => void;
  onRemoveHistory: (url: string) => void;
  onAddToHistory: (bg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  bgHistory,
  onSave,
  onRemoveHistory,
  onAddToHistory,
}) => {
  const [localSettings, setLocalSettings] = useState<Settings>(() =>
    settings ? JSON.parse(JSON.stringify(settings)) : ({} as Settings)
  );
  const [currentTab, setCurrentTab] = useState<'active' | 'completed' | 'deleted'>('active');
  const [testStatus, setTestStatus] = useState<'sending' | 'success' | 'error' | null>(null);
  const [driveTestStatus, setDriveTestStatus] = useState<'testing' | 'success' | 'error' | null>(null);
  const [newKw, setNewKw] = useState('');
  const headerFileInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  const handleGoogleDriveChange = (key: keyof GoogleDriveConfig, value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      googleDrive: {
        gasWebAppUrl: prev.googleDrive?.gasWebAppUrl || '',
        backupFileName: prev.googleDrive?.backupFileName || 'vouchy-backup.json',
        folderId: prev.googleDrive?.folderId || '',
        [key]: value,
      },
    }));
  };

  const handleTestGoogleDrive = async () => {
    const config = localSettings.googleDrive;
    if (!config?.gasWebAppUrl) {
      alert('請先輸入 GAS Web App URL');
      return;
    }
    
    setDriveTestStatus('testing');
    try {
      const response = await fetch(`${config.gasWebAppUrl}?action=test`);
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setDriveTestStatus('success');
      setTimeout(() => setDriveTestStatus(null), 3000);
    } catch (err) {
      setDriveTestStatus('error');
      alert(`連線失敗: ${(err as Error).message}`);
    }
  };

  if (!isOpen) return null;

  const currentViewConfig: ViewConfig = localSettings.viewConfigs?.[currentTab] || { ...defaultViewConfig };

  const handleGlobalChange = (key: keyof Settings, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddKw = () => {
    if (!newKw.trim()) return;
    const kws = localSettings.specificViewKeywords || [];
    if (!kws.includes(newKw.trim())) {
      handleGlobalChange('specificViewKeywords', [...kws, newKw.trim()]);
    }
    setNewKw('');
  };

  const handleRemoveKw = (kw: string) => {
    const kws = localSettings.specificViewKeywords || [];
    handleGlobalChange(
      'specificViewKeywords',
      kws.filter((k) => k !== kw)
    );
  };

  const handleViewConfigChange = (key: keyof ViewConfig, value: any) => {
    setLocalSettings((prev) => {
      const next = { ...prev };
      const currentView = { ...next.viewConfigs[currentTab] };
      (currentView as any)[key] = value;

      const imageUrl = currentView.backgroundImage;
      if (!next.bgConfigMap) next.bgConfigMap = {};

      if (key === 'backgroundImage' && value) {
        const sharedConfig = next.bgConfigMap[value];
        if (sharedConfig) {
          currentView.bgSize = sharedConfig.bgSize ?? currentView.bgSize;
          currentView.bgPosY = sharedConfig.bgPosY ?? currentView.bgPosY;
        }
      } else if (imageUrl && (key === 'bgSize' || key === 'bgPosY')) {
        next.bgConfigMap[imageUrl] = {
          ...next.bgConfigMap[imageUrl],
          [key]: value,
        };
      }

      next.viewConfigs = { ...next.viewConfigs, [currentTab]: currentView };
      return next;
    });
  };

  const handleStep = (key: keyof ViewConfig | keyof Settings, delta: number, min: number, max: number, isViewConfig = true, stepVal = 1) => {
    const currentVal = isViewConfig ? (currentViewConfig as any)[key] : (localSettings as any)[key];
    let nextVal = parseFloat(currentVal || 0) + delta * stepVal;
    // Wrap around: if exceeds max, go to min; if below min, go to max
    if (nextVal > max) {
      nextVal = min;
    } else if (nextVal < min) {
      nextVal = max;
    }
    nextVal = Math.round(nextVal * 100) / 100;

    if (isViewConfig) {
      handleViewConfigChange(key as keyof ViewConfig, nextVal);
    } else {
      handleGlobalChange(key as keyof Settings, nextVal);
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleHeaderBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 'original');
        handleViewConfigChange('headerBackgroundImage', base64);
      } catch (err) {
        alert('處理圖片時發生錯誤');
      }
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 'original');
        if (onAddToHistory) onAddToHistory(base64);
      } catch (err) {
        alert('處理圖片時發生錯誤');
      }
    }
  };

  const handleTest = async () => {
    setTestStatus('sending');
    const result = await sendTelegramMessage(
      localSettings.tgToken,
      localSettings.tgChatId,
      '🔔 這是一則來自「離線票券管家」的測試訊息。'
    );
    if (result.success) {
      setTestStatus('success');
      setTimeout(() => setTestStatus(null), 3000);
    } else {
      setTestStatus('error');
      alert(`發送失敗: ${result.error}`);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
          <CloudCog size={24} className="text-primary" /> 系統設定
        </h2>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              通知天數 (紅框顯示)
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStep('notifyDays', -1, 1, 99, false)}
                className="w-9 h-9 flex items-center justify-center bg-muted rounded-xl text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={localSettings.notifyDays}
                onChange={(e) => handleGlobalChange('notifyDays', parseInt(e.target.value) || 7)}
                className="flex-1 p-2.5 bg-muted rounded-xl text-sm font-bold text-center text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => handleStep('notifyDays', 1, 1, 99, false)}
                className="w-9 h-9 flex items-center justify-center bg-muted rounded-xl text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
              特定畫面觸發關鍵字 (MOMO模式)
            </label>
            <div className="flex gap-2 mb-3 pr-1">
              <input
                value={newKw}
                onChange={(e) => setNewKw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKw()}
                placeholder="輸入關鍵字 (如: MOMO, 85度C)..."
                className="flex-1 p-2 bg-muted rounded-lg text-sm outline-none border-none focus:ring-1 focus:ring-primary min-w-0"
              />
              <button onClick={handleAddKw} className="px-4 bg-primary text-primary-foreground rounded-lg font-bold shrink-0">
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto no-scrollbar">
              {(localSettings.specificViewKeywords || []).map((kw) => (
                <span
                  key={kw}
                  className="bg-muted text-foreground px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"
                >
                  {kw}{' '}
                  <X size={10} className="cursor-pointer hover:text-ticket-warning" onClick={() => handleRemoveKw(kw)} />
                </span>
              ))}
              {(!localSettings.specificViewKeywords || localSettings.specificViewKeywords.length === 0) && (
                <span className="text-[10px] text-muted-foreground">預設：MOMO, 85度C</span>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <HardDrive size={14} /> Google 雲端硬碟備份 (GAS)
            </label>
            
            {/* Security notice for GAS backup */}
            <div className="flex items-start gap-2 p-2 mb-3 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400 text-[10px]">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>請僅使用您信任的 Google Apps Script 網址，網址必須為 https://script.google.com/...</span>
            </div>
            
            <div className="space-y-3 bg-muted p-3 rounded-xl">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <Link size={12} /> GAS Web App URL
                </label>
                <input
                  type="text"
                  value={localSettings.googleDrive?.gasWebAppUrl || ''}
                  onChange={(e) => handleGoogleDriveChange('gasWebAppUrl', e.target.value)}
                  placeholder="https://script.google.com/macros/s/..."
                  className={`w-full p-2.5 bg-card rounded-lg text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary ${
                    localSettings.googleDrive?.gasWebAppUrl && !isValidGasUrl(localSettings.googleDrive.gasWebAppUrl)
                      ? 'ring-2 ring-ticket-warning'
                      : ''
                  }`}
                />
                {localSettings.googleDrive?.gasWebAppUrl && !isValidGasUrl(localSettings.googleDrive.gasWebAppUrl) && (
                  <p className="text-[10px] text-ticket-warning mt-1">
                    請使用官方 Google Apps Script 網址
                  </p>
                )}
                {(!localSettings.googleDrive?.gasWebAppUrl || isValidGasUrl(localSettings.googleDrive.gasWebAppUrl)) && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    部署 GAS 腳本後取得的 Web App URL
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                  備份檔案名稱
                </label>
                <input
                  type="text"
                  value={localSettings.googleDrive?.backupFileName || 'vouchy-backup.json'}
                  onChange={(e) => handleGoogleDriveChange('backupFileName', e.target.value)}
                  placeholder="vouchy-backup.json"
                  className="w-full p-2.5 bg-card rounded-lg text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <FolderOpen size={12} /> 資料夾 ID（選填）
                </label>
                <input
                  type="text"
                  value={localSettings.googleDrive?.folderId || ''}
                  onChange={(e) => handleGoogleDriveChange('folderId', e.target.value)}
                  placeholder="從雲端硬碟資料夾網址取得 ID"
                  className="w-full p-2.5 bg-card rounded-lg text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  留空則儲存至根目錄或 GAS 預設位置
                </p>
              </div>

              <button
                onClick={handleTestGoogleDrive}
                disabled={!localSettings.googleDrive?.gasWebAppUrl || driveTestStatus === 'testing'}
                className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  driveTestStatus === 'success'
                    ? 'bg-ticket-success/10 text-ticket-success'
                    : driveTestStatus === 'error'
                    ? 'bg-ticket-warning/10 text-ticket-warning'
                    : 'bg-card text-muted-foreground hover:bg-card/80 border border-border'
                }`}
              >
                {driveTestStatus === 'testing' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : driveTestStatus === 'success' ? (
                  <Check size={14} />
                ) : (
                  <HardDrive size={14} />
                )}
                {driveTestStatus === 'testing'
                  ? '測試中...'
                  : driveTestStatus === 'success'
                  ? '連線成功'
                  : driveTestStatus === 'error'
                  ? '連線失敗'
                  : '測試連線'}
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileJson size={14} /> 本地備份設定
            </label>
            
            <div className="space-y-3 bg-muted p-3 rounded-xl">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                  備份檔案名稱前綴
                </label>
                <input
                  type="text"
                  value={localSettings.localBackupFileName || ''}
                  onChange={(e) => handleGlobalChange('localBackupFileName', e.target.value)}
                  placeholder="vouchy_backup"
                  className="w-full p-2.5 bg-card rounded-lg text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  檔名格式：<span className="font-mono">{localSettings.localBackupFileName?.trim() || 'vouchy_backup'}_日期_時間.json</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Copy size={14} /> 核銷行為設定
            </label>
            
            <div className="space-y-3 bg-muted p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-foreground block">
                    自動複製序號
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    核銷時自動將序號複製到剪貼簿
                  </p>
                </div>
                <button
                  onClick={() => handleGlobalChange('autoCopySerialOnRedeem', !localSettings.autoCopySerialOnRedeem)}
                  className={`w-12 h-7 rounded-full transition-all relative ${
                    localSettings.autoCopySerialOnRedeem !== false ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      localSettings.autoCopySerialOnRedeem !== false ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">外觀設定</label>

            <div className="flex bg-muted p-1 rounded-xl mb-4">
              {([
                { id: 'active', label: '待使用', icon: ListTodo },
                { id: 'completed', label: '已使用', icon: CheckCircle2 },
                { id: 'deleted', label: '回收桶', icon: Trash },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    currentTab === tab.id ? 'bg-card shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon size={12} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-4 animate-fade-in">
              <div className="bg-muted p-3 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <PanelTop size={12} /> 頂部功能區背景
                  </label>
                  {currentViewConfig.headerBackgroundImage && (
                    <button
                      onClick={() => handleViewConfigChange('headerBackgroundImage', '')}
                      className="text-[10px] text-ticket-warning font-bold hover:underline"
                    >
                      移除
                    </button>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <div
                    className="w-10 h-10 rounded-lg bg-muted/50 bg-cover bg-center border border-border flex-shrink-0"
                    style={{
                      backgroundImage: currentViewConfig.headerBackgroundImage
                        ? `url(${currentViewConfig.headerBackgroundImage})`
                        : 'none',
                    }}
                  ></div>
                  <button
                    onClick={() => headerFileInputRef.current?.click()}
                    className="flex-1 py-2 bg-card border border-border text-foreground rounded-lg text-xs font-bold hover:bg-muted"
                  >
                    更換圖片
                  </button>
                  <input
                    type="file"
                    ref={headerFileInputRef}
                    accept="image/*"
                    onChange={handleHeaderBgUpload}
                    className="hidden"
                  />
                </div>

                {currentViewConfig.headerBackgroundImage && (
                  <>
                    <div className="w-full h-16 rounded-lg bg-muted/50 border border-border relative overflow-hidden">
                      <div
                        className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-75"
                        style={{
                          backgroundImage: `url(${currentViewConfig.headerBackgroundImage})`,
                          backgroundSize: `${currentViewConfig.headerBgSize || 100}% auto`,
                          backgroundPosition: `center ${currentViewConfig.headerBgPosY || 50}%`,
                          backgroundRepeat: 'no-repeat',
                          opacity: currentViewConfig.headerBgOpacity || 1,
                        }}
                      />
                      <div className="absolute top-1 right-1 bg-black/40 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-1 shadow-sm">
                        預覽
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                          <Maximize size={12} /> 背景縮放 (寬度 %)
                        </label>
                        <span className="text-xs font-bold text-primary">{currentViewConfig.headerBgSize || 100}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStep('headerBgSize', -1, 50, 300, true, 5)}
                          className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="range"
                          min="50"
                          max="300"
                          step="5"
                          value={currentViewConfig.headerBgSize || 100}
                          onChange={(e) => handleViewConfigChange('headerBgSize', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <button
                          onClick={() => handleStep('headerBgSize', 1, 50, 300, true, 5)}
                          className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                          <Move size={12} /> 背景垂直位置
                        </label>
                        <span className="text-xs font-bold text-primary">{currentViewConfig.headerBgPosY || 50}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStep('headerBgPosY', -1, 0, 100, true, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={currentViewConfig.headerBgPosY || 50}
                          onChange={(e) => handleViewConfigChange('headerBgPosY', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <button
                          onClick={() => handleStep('headerBgPosY', 1, 0, 100, true, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                          <Droplets size={12} /> 背景透明度
                        </label>
                        <span className="text-xs font-bold text-primary">{Math.round((currentViewConfig.headerBgOpacity || 1) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStep('headerBgOpacity', -1, 0, 1, true, 0.05)}
                          className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={Math.round((currentViewConfig.headerBgOpacity || 1) * 100)}
                          onChange={(e) => handleViewConfigChange('headerBgOpacity', parseInt(e.target.value) / 100)}
                          className="flex-1 h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <button
                          onClick={() => handleStep('headerBgOpacity', 1, 0, 1, true, 0.05)}
                          className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </div>

              <div>
                <div className="text-xs font-bold text-muted-foreground mb-2 flex justify-between">
                  <span>曾經使用的背景 (主畫面)</span>
                  {bgHistory.length === 0 && <span className="text-muted-foreground font-normal">尚無紀錄</span>}
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full h-12 rounded-lg bg-primary/5 border border-dashed border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus size={16} strokeWidth={3} />
                    <input
                      type="file"
                      ref={galleryInputRef}
                      accept="image/*"
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </div>

                  {bgHistory.map((bgUrl, idx) => (
                    <div key={idx} className="relative group">
                      <button
                        onClick={() => handleViewConfigChange('backgroundImage', bgUrl)}
                        className="w-full h-12 rounded-lg bg-cover bg-center border border-border hover:scale-105 transition-transform shadow-sm"
                        style={{ backgroundImage: `url(${bgUrl})` }}
                      >
                        {currentViewConfig.backgroundImage === bgUrl && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveHistory(bgUrl);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-ticket-warning text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleViewConfigChange('backgroundImage', '')}
                    className="w-full h-12 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 text-xs font-bold"
                  >
                    無
                  </button>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-xl space-y-3">
                {currentViewConfig.backgroundImage && (
                  <div className="w-32 aspect-[3/5] mx-auto bg-muted/50 rounded-xl border border-border relative overflow-hidden flex items-center justify-center shadow-inner">
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-75"
                      style={{
                        backgroundImage: `url(${currentViewConfig.backgroundImage})`,
                        backgroundSize: `${currentViewConfig.bgSize || 100}% auto`,
                        backgroundPosition: `center ${currentViewConfig.bgPosY || 50}%`,
                        backgroundRepeat: 'no-repeat',
                        opacity: currentViewConfig.bgOpacity || 1,
                      }}
                    />
                    <div className="absolute top-1 right-1 bg-black/40 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-1 shadow-sm">
                      預覽
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Maximize size={12} /> 背景縮放 (寬度 %)
                    </label>
                    <span className="text-xs font-bold text-primary">{currentViewConfig.bgSize || 100}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStep('bgSize', -1, 50, 300, true, 5)}
                      className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      step="5"
                      value={currentViewConfig.bgSize || 100}
                      onChange={(e) => handleViewConfigChange('bgSize', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <button
                      onClick={() => handleStep('bgSize', 1, 50, 300, true, 5)}
                      className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Move size={12} /> 背景垂直位置
                    </label>
                    <span className="text-xs font-bold text-primary">{currentViewConfig.bgPosY || 50}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStep('bgPosY', -1, 0, 100, true, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={currentViewConfig.bgPosY || 50}
                      onChange={(e) => handleViewConfigChange('bgPosY', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <button
                      onClick={() => handleStep('bgPosY', 1, 0, 100, true, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Droplets size={12} /> 背景透明度
                    </label>
                    <span className="text-xs font-bold text-primary">{Math.round((currentViewConfig.bgOpacity || 1) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStep('bgOpacity', -1, 0, 1, true, 0.05)}
                      className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round((currentViewConfig.bgOpacity || 1) * 100)}
                      onChange={(e) => handleViewConfigChange('bgOpacity', parseInt(e.target.value) / 100)}
                      className="flex-1 h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <button
                      onClick={() => handleStep('bgOpacity', 1, 0, 1, true, 0.05)}
                      className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Palette size={12} /> 卡片底色
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{currentViewConfig.cardBgColor}</span>
                    <input
                      type="color"
                      value={currentViewConfig.cardBgColor}
                      onChange={(e) => handleViewConfigChange('cardBgColor', e.target.value)}
                      className="w-6 h-6 rounded overflow-hidden border-none outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <PaintBucket size={12} /> 卡片邊框
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {currentViewConfig.cardBorderColor || '#e2e8f0'}
                    </span>
                    <input
                      type="color"
                      value={currentViewConfig.cardBorderColor || '#e2e8f0'}
                      onChange={(e) => handleViewConfigChange('cardBorderColor', e.target.value)}
                      className="w-6 h-6 rounded overflow-hidden border-none outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Droplets size={12} /> 卡片透明度
                    </label>
                    <span className="text-xs font-bold text-primary">
                      {Math.round((1 - currentViewConfig.cardOpacity) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStep('cardOpacity', 1, 0, 1, true, 0.05)}
                      className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round((1 - currentViewConfig.cardOpacity) * 100)}
                      onChange={(e) => handleViewConfigChange('cardOpacity', 1 - parseInt(e.target.value) / 100)}
                      className="flex-1 h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <button
                      onClick={() => handleStep('cardOpacity', -1, 0, 1, true, 0.05)}
                      className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Rows size={12} /> 列表模式高度
                  </label>
                  <span className="text-xs font-bold text-primary">{currentViewConfig.compactHeight || 70}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStep('compactHeight', -1, 40, 150, true, 5)}
                    className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    step="5"
                    value={currentViewConfig.compactHeight || 70}
                    onChange={(e) => handleViewConfigChange('compactHeight', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <button
                    onClick={() => handleStep('compactHeight', 1, 40, 150, true, 5)}
                    className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <ImageIcon size={12} /> 列表顯示圖片
                  </label>
                  <button
                    onClick={() => handleViewConfigChange('compactShowImage', !currentViewConfig.compactShowImage)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      currentViewConfig.compactShowImage ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                        currentViewConfig.compactShowImage ? 'left-6' : 'left-1'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <SendHorizontal size={14} /> Telegram 通知設定
            </label>
            
            {/* Security notice for Telegram */}
            <div className="flex items-start gap-2 p-2 mb-3 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400 text-[10px]">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>Bot Token 將儲存在本機瀏覽器，請僅在個人裝置上使用此功能</span>
            </div>
            
            <div className="space-y-3 bg-muted p-3 rounded-xl">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                  Bot Token
                </label>
                <input
                  type="password"
                  value={localSettings.tgToken}
                  onChange={(e) => handleGlobalChange('tgToken', e.target.value)}
                  placeholder="123456:ABC-DEF..."
                  className="w-full p-2.5 bg-card rounded-lg text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={localSettings.tgChatId}
                  onChange={(e) => handleGlobalChange('tgChatId', e.target.value)}
                  placeholder="-123456789"
                  className="w-full p-2.5 bg-card rounded-lg text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <button
                onClick={handleTest}
                disabled={!localSettings.tgToken || !localSettings.tgChatId || testStatus === 'sending'}
                className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  testStatus === 'success'
                    ? 'bg-ticket-success/10 text-ticket-success'
                    : testStatus === 'error'
                    ? 'bg-ticket-warning/10 text-ticket-warning'
                    : 'bg-card text-muted-foreground hover:bg-card/80 border border-border'
                }`}
              >
                {testStatus === 'sending' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : testStatus === 'success' ? (
                  <Check size={14} />
                ) : (
                  <SendHorizontal size={14} />
                )}
                {testStatus === 'sending'
                  ? '傳送中...'
                  : testStatus === 'success'
                  ? '測試成功'
                  : testStatus === 'error'
                  ? '測試失敗'
                  : '測試傳送'}
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-muted-foreground font-bold hover:bg-muted rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};