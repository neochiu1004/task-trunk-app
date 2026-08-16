import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Clock, CheckCircle2, Maximize2, ExternalLink, QrCode, Ticket as TicketIcon, Copy, Pin } from 'lucide-react';
import { Ticket } from '@/types/ticket';
import { checkIsExpiringSoon, formatTime, formatDateTime } from '@/lib/helpers';

interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
  notifyDays: number;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isDuplicate: boolean;
  opacity?: number;
  cardBgColor?: string;
  cardBorderColor?: string;
  isCompact: boolean;
  gridImageHeight?: number;
  index?: number;
  hasHealthIssue?: boolean;
  onTogglePin?: (id: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onClick,
  notifyDays,
  isSelectionMode,
  isSelected,
  onSelect,
  isDuplicate,
  opacity = 0.85,
  cardBgColor,
  cardBorderColor,
  isCompact,
  gridImageHeight = 96,
  index = 0,
  hasHealthIssue = false,
  onTogglePin,
}) => {
  const getExpiryCountdown = (expiry?: string) => {
    if (!expiry) return '無期限';
    const expiryTime = new Date(expiry.replace(/\//g, '-')).getTime();
    if (Number.isNaN(expiryTime)) return expiry;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(expiryTime);
    expiryDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'D-day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `逾期 ${Math.abs(diffDays)} 天`;
  };

  const isExpiring = !ticket.completed && ticket.expiry && checkIsExpiringSoon(ticket.expiry, notifyDays);
  const isDuplicateWarning = isDuplicate && !ticket.completed && !ticket.isDeleted;
  const isExpiringWarning = isExpiring && !ticket.completed && !ticket.isDeleted;
  const isHealthIssueWarning = hasHealthIssue && !ticket.completed && !ticket.isDeleted;
  const compactExpiryText = ticket.completed ? `已用 ${formatTime(ticket.completedAt)}` : getExpiryCountdown(ticket.expiry);

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 30,
        delay: index * 0.03,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.98 },
  };

  const getStatusStyles = () => {
    if (isSelected) {
      return 'ring-2 ring-primary ring-offset-2 ring-offset-background';
    }
    if (isDuplicateWarning) {
      return 'ring-2 ring-purple-500/70 shadow-lg shadow-purple-500/20';
    }
    if (isHealthIssueWarning) {
      return 'ring-2 ring-ticket-danger/60 shadow-lg shadow-ticket-danger/15';
    }
    if (isExpiringWarning) {
      return 'ring-2 ring-ticket-warning/50 shadow-lg shadow-ticket-warning/10';
    }
    return '';
  };

  // Calculate background opacity for card (content stays at full opacity)
  const cardBgOpacity = opacity !== undefined && opacity < 1 ? opacity : 1;

  // Get status dot color
  const getStatusDotColor = () => {
    if (isHealthIssueWarning) return 'bg-ticket-danger';
    if (isExpiringWarning) return 'bg-ticket-warning';
    if (ticket.completed) return 'bg-muted-foreground';
    return 'bg-ticket-success';
  };

  if (isCompact) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileTap="tap"
        layout
        onClick={() => {
          if (isSelectionMode) onSelect(ticket.id);
          else onClick(ticket);
        }}
        className={`rounded-2xl p-3 cursor-pointer relative overflow-hidden flex flex-col ${getStatusStyles()}`}
      >
        {/* Background layer with opacity */}
        <div 
          className="absolute inset-0 glass-card rounded-2xl border border-border/50"
          style={{
            opacity: cardBgOpacity,
            ...(isDuplicateWarning ? { backgroundColor: 'rgba(168, 85, 247, 0.14)' } : cardBgColor && { backgroundColor: cardBgColor }),
            borderColor: isDuplicateWarning ? 'rgba(147, 51, 234, 0.65)' : cardBorderColor,
            ...(cardBorderColor && !isDuplicateWarning && { borderWidth: '1px', borderStyle: 'solid' }),
          }} 
        />
        
        {/* Status dot indicator */}
        <div className="absolute top-0 right-0 p-2 z-20">
          <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor()} block ring-4 ring-card`}></span>
        </div>
        
        {/* Selection checkbox */}
        {isSelectionMode && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute top-2 left-2 z-20 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background/80'
            }`}
          >
            {isSelected && <Check size={12} className="text-primary-foreground" />}
          </motion.div>
        )}
        
        {/* Content layer */}
        <div className="relative z-10 flex flex-1 gap-3">
          {/* Main content (left) */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
            <h3 className="font-bold text-foreground leading-tight line-clamp-1 text-sm">
              {ticket.pinned && <Pin size={10} className="inline mr-1 text-amber-500" />}
              {ticket.productName}
              {ticket.originalImage && <Maximize2 size={10} className="inline ml-1 text-primary" />}
              {ticket.redeemUrl && <ExternalLink size={10} className="inline ml-1 text-ticket-momo" />}
            </h3>
            
            {/* Tags as subtitle */}
            {ticket.tags && ticket.tags.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {ticket.tags.join(', ')}
              </p>
            )}
            
            {/* Expiry & duplicate info */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {isDuplicateWarning && (
                <span className="text-[10px] font-semibold text-purple-700 flex items-center gap-0.5 bg-purple-500/15 px-1.5 py-0.5 rounded-full">
                  <Copy size={10} /> 重複
                </span>
              )}
              {isExpiringWarning ? (
                <span className="text-xs font-medium text-ticket-warning flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>快到期</span>
                </span>
              ) : (
                <span className={`text-xs font-medium flex items-center gap-1 ${ticket.completed ? 'text-muted-foreground' : 'text-ticket-success'}`}>
                  <Clock size={12} />
                  <span>{compactExpiryText}</span>
                </span>
              )}
            </div>
            </div>
          
          {/* Footer with serial and pin toggle */}
          <div className="mt-2 pt-2 border-t border-border/50 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground font-mono tracking-wider line-clamp-1">
              #{ticket.serial?.slice(0, 8) || 'N/A'}
            </span>
            <div className="flex items-center gap-1.5">
              {onTogglePin && !ticket.completed && !ticket.isDeleted && (
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePin(ticket.id); }}
                  className={`p-1 rounded-lg transition-colors ${ticket.pinned ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground/40 hover:text-amber-500/60'}`}
                >
                  <Pin size={14} className={ticket.pinned ? 'fill-amber-500' : ''} />
                </button>
              )}
              <QrCode size={18} className="text-muted-foreground/40 flex-shrink-0" />
            </div>
          </div>
          </div>

          {/* Thumbnail (right) */}
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden shadow-inner"
            style={{ width: `${gridImageHeight}px`, height: `${gridImageHeight}px` }}
          >
            {ticket.image ? (
              <img src={ticket.image} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <TicketIcon size={22} className="text-primary-foreground" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileTap="tap"
      layout
      onClick={() => {
        if (isSelectionMode) onSelect(ticket.id);
        else onClick(ticket);
      }}
      className={`mx-4 mt-3 flex cursor-pointer relative overflow-hidden rounded-[24px] ${getStatusStyles()}`}
    >
      {/* Background layer with opacity */}
      <div 
        className="absolute inset-0 rounded-[24px] border border-border/70 shadow-[0_14px_30px_-22px_hsl(200_30%_20%_/_0.36),0_2px_8px_hsl(200_20%_20%_/_0.07)] backdrop-blur-[10px]"
        style={{ 
          opacity: cardBgOpacity,
          backgroundColor: isDuplicateWarning ? 'rgba(168, 85, 247, 0.14)' : (cardBgColor || 'hsl(var(--wabi-surface))'),
          borderColor: isDuplicateWarning ? 'rgba(147, 51, 234, 0.65)' : cardBorderColor,
          borderWidth: '1px',
          borderStyle: 'solid',
        }} 
      />
      
      {isSelectionMode && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`absolute -top-1.5 -right-1.5 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-md ${
            isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background'
          }`}
        >
          {isSelected && <Check size={14} className="text-primary-foreground" />}
        </motion.div>
      )}
      
      {isHealthIssueWarning && (
        <div className="absolute top-2 left-3 bg-ticket-danger text-primary-foreground text-[10px] px-3 py-1 rounded-full z-20 font-semibold shadow-md">
          序號不符
        </div>
      )}
      
      {isDuplicateWarning && !isHealthIssueWarning && (
        <div className="absolute top-2 left-3 bg-purple-600 text-white text-[10px] px-3 py-1 rounded-full z-20 font-semibold shadow-md">
          重複序號
        </div>
      )}
      
      {/* Content layer - always full opacity */}
      <div className="relative z-10 flex w-full p-3 gap-3">
        <div className="w-[72px] h-[72px] flex-shrink-0 rounded-[18px] flex items-center justify-center relative overflow-hidden bg-muted/60 shadow-inner">
          {ticket.image ? (
            <motion.img 
              src={ticket.image} 
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              alt=""
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#6A9C89] to-[#334A52] flex items-center justify-center">
              <TicketIcon size={24} className="text-primary-foreground" />
            </div>
          )}
          {ticket.originalImage && (
            <div className="absolute bottom-1 left-1 bg-foreground/60 text-background p-0.5 rounded-md backdrop-blur-sm z-20">
              <Maximize2 size={8} />
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-black text-foreground line-clamp-1 text-[15px] tracking-normal">
                {ticket.pinned && <Pin size={10} className="inline mr-1 text-amber-500" />}
                {ticket.productName}
                {ticket.redeemUrl && <ExternalLink size={10} className="inline ml-1 text-ticket-momo" />}
              </h3>
              {ticket.completed && (
                <span className="bg-muted text-muted-foreground text-[10px] px-2 py-1 rounded-lg font-medium ml-1.5 flex-shrink-0 shadow-sm">已用</span>
              )}
            </div>
            
            {isExpiringWarning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-semibold text-ticket-warning mt-1 flex items-center gap-0.5"
              >
                <AlertCircle size={10} /> 快到期
              </motion.div>
            )}
            
            <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
              {ticket.tags && ticket.tags.map((t) => (
                <span key={t} className="text-[10px] bg-primary/8 text-primary px-2 py-1 rounded-full font-bold whitespace-nowrap">
                  {t}
                </span>
              ))}
              {!ticket.tags?.length && <span className="text-[9px] text-muted-foreground/50">#</span>}
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-2.5 gap-2">
            {ticket.completed && ticket.completedAt ? (
              <div className="text-[10px] font-bold text-ticket-success flex items-center gap-1.5 bg-ticket-success/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={12} /> <span>{formatDateTime(ticket.completedAt)}</span>
              </div>
            ) : (
              <div className={`text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isExpiring ? 'text-ticket-warning bg-ticket-warning/10' : 'text-ticket-success bg-ticket-success/10'}`}>
                <Clock size={12} /> <span>{ticket.expiry || '無期限'}</span>
              </div>
            )}
            
            {!isSelectionMode && (
              <div className="flex items-center gap-2">
                {onTogglePin && !ticket.completed && !ticket.isDeleted && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onTogglePin(ticket.id); }}
                    className={`p-2 rounded-full transition-colors ${ticket.pinned ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground/40 hover:text-amber-500/60 bg-muted/50'}`}
                  >
                    <Pin size={16} className={ticket.pinned ? 'fill-amber-500' : ''} />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`text-xs font-black px-5 py-2.5 rounded-[14px] transition-all duration-200 shadow-sm ${
                    ticket.completed
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-ticket-success text-primary-foreground hover:shadow-lg hover:shadow-ticket-success/30'
                  }`}
                >
                  {ticket.completed ? '查看' : '兌換'}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
