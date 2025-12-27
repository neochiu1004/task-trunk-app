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
} from 'lucide-react';
import { dbHelper, DataHealthStatus } from '@/lib/db';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface DataHealthCheckProps {
  isOpen: boolean;
  onClose: () => void;
  onBackup: () => void;
}

export const DataHealthCheck: React.FC<DataHealthCheckProps> = ({
  isOpen,
  onClose,
  onBackup,
}) => {
  const [status, setStatus] = useState<DataHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
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