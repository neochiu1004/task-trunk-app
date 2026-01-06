import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  Loader2,
  Lock,
  ScanBarcode,
  CircleCheck,
  CircleX,
} from 'lucide-react';
import { dbHelper, DataHealthStatus } from '@/lib/db';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Ticket } from '@/types/ticket';
import { DB_KEYS } from '@/lib/constants';
import { scanBarcodeFromImage } from '@/lib/barcodeScanner';

interface DataHealthCheckProps {
  isOpen: boolean;
  onClose: () => void;
  onBackup: () => void;
  onMismatchedSerials?: (serials: Set<string>) => void;
}

export const DataHealthCheck: React.FC<DataHealthCheckProps> = ({
  isOpen,
  onClose,
  onBackup,
  onMismatchedSerials,
}) => {
  const [status, setStatus] = useState<DataHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{
    total: number;
    matched: number;
    mismatched: { name: string; serial: string; scannedSerial: string }[];
    noBarcode: string[];
  } | null>(null);

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const healthStatus = await dbHelper.checkDataHealth();
      setStatus(healthStatus);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPersistence = async () => {
    setIsPersisting(true);
    try {
      const granted = await dbHelper.requestPersistentStorage();
      if (granted) {
        await runHealthCheck();
      } else {
        alert('瀏覽器未授權持久化儲存');
      }
    } catch (error) {
      console.error('Persistence request failed:', error);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleBackup = async () => {
    await dbHelper.recordBackup();
    onBackup();
    await runHealthCheck();
  };

  const scanBarcodes = async () => {
    setIsScanning(true);
    setScanResults(null);
    try {
      const tickets = await dbHelper.getItem<Ticket[]>(DB_KEYS.TASKS) || [];
      // 排除回收區票券
      const ticketsWithImage = tickets.filter(t => t.originalImage && t.serial && !t.isDeleted);
      
      const results = {
        total: ticketsWithImage.length,
        matched: 0,
        mismatched: [] as { name: string; serial: string; scannedSerial: string }[],
        noBarcode: [] as string[],
      };

      for (const ticket of ticketsWithImage) {
        try {
          const scanResult = await scanBarcodeFromImage(ticket.originalImage!);
          if (scanResult) {
            if (scanResult.content === ticket.serial) {
              results.matched++;
            } else {
              results.mismatched.push({
                name: ticket.productName,
                serial: ticket.serial!,
                scannedSerial: scanResult.content,
              });
            }
          } else {
            results.noBarcode.push(ticket.productName);
          }
        } catch (error) {
          results.noBarcode.push(ticket.productName);
        }
      }

      setScanResults(results);
      
      // 通知父組件不符的序號
      if (onMismatchedSerials) {
        const mismatchedSerials = new Set(results.mismatched.map(m => m.serial));
        onMismatchedSerials(mismatchedSerials);
      }
    } catch (error) {
      console.error('Barcode scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
      setScanResults(null);
    }
  }, [isOpen]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatLastBackup = (timestamp?: number): string => {
    if (!timestamp) return '從未備份';
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    
    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小時前`;
    return '剛才';
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="資料健康檢查"
      description="檢查並保護您的票券資料"
    >
      <div className="space-y-4">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground mt-3 font-medium">正在檢查資料...</p>
          </motion.div>
        ) : status ? (
          <>
            {/* Overall Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl flex items-center gap-4 ${
                status.isHealthy 
                  ? 'bg-ticket-success/10 border border-ticket-success/20' 
                  : 'bg-ticket-warning/10 border border-ticket-warning/20'
              }`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
              >
                {status.isHealthy ? (
                  <ShieldCheck className="w-12 h-12 text-ticket-success" />
                ) : (
                  <ShieldAlert className="w-12 h-12 text-ticket-warning" />
                )}
              </motion.div>
              <div>
                <h3 className="font-bold text-foreground">
                  {status.isHealthy ? '資料健康良好' : '需要注意'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {status.isHealthy 
                    ? '您的票券資料完整且安全' 
                    : `發現 ${status.issues.length} 個問題`}
                </p>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card p-3 rounded-xl"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <HardDrive size={14} />
                  <span className="text-[10px] font-semibold uppercase">儲存空間</span>
                </div>
                <p className="text-lg font-bold text-foreground">{formatBytes(status.totalSize)}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-3 rounded-xl"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock size={14} />
                  <span className="text-[10px] font-semibold uppercase">上次備份</span>
                </div>
                <p className="text-lg font-bold text-foreground">{formatLastBackup(status.lastBackup)}</p>
              </motion.div>
            </div>

            {/* Issues */}
            <AnimatePresence>
              {status.issues.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle size={14} className="text-ticket-warning" /> 發現問題
                  </h4>
                  {status.issues.map((issue, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-ticket-warning/10 border border-ticket-warning/20 text-sm text-ticket-warning p-3 rounded-xl font-medium"
                    >
                      {issue}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recommendations */}
            {status.recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-primary" /> 建議
                </h4>
                {status.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + 0.1 * index }}
                    className="bg-primary/5 border border-primary/10 text-sm text-foreground p-3 rounded-xl"
                  >
                    {rec}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Barcode Scan Check */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="space-y-3"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={scanBarcodes}
                disabled={isScanning}
                className="w-full py-3 glass-card rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                {isScanning ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ScanBarcode size={16} />
                )}
                {isScanning ? '掃描中...' : '掃描條碼比對序號'}
              </motion.button>

              <AnimatePresence>
                {scanResults && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2">
                        <CircleCheck size={16} className="text-ticket-success" />
                        <span className="text-sm font-medium">{scanResults.matched} 符合</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CircleX size={16} className="text-ticket-danger" />
                        <span className="text-sm font-medium">{scanResults.mismatched.length} 不符</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-sm">共 {scanResults.total} 張</span>
                      </div>
                    </div>

                    {scanResults.mismatched.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <AlertTriangle size={14} className="text-ticket-warning" /> 序號不符
                        </h4>
                        {scanResults.mismatched.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            className="bg-ticket-warning/10 border border-ticket-warning/20 text-sm p-3 rounded-xl"
                          >
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              輸入: <span className="font-mono">{item.serial}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              掃描: <span className="font-mono text-ticket-warning">{item.scannedSerial}</span>
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {scanResults.noBarcode.length > 0 && (
                      <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                        無法掃描: {scanResults.noBarcode.slice(0, 3).join('、')}
                        {scanResults.noBarcode.length > 3 && ` 等 ${scanResults.noBarcode.length} 張`}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={runHealthCheck}
                className="flex-1 py-3 glass-card rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={16} /> 重新檢查
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleBackup}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <Download size={16} /> 立即備份
              </motion.button>
            </div>

            {/* Persistent Storage */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={requestPersistence}
              disabled={isPersisting}
              className="w-full py-3 glass-card rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {isPersisting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              啟用持久化儲存保護
            </motion.button>
          </>
        ) : null}
      </div>
    </ResponsiveModal>
  );
};