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
  const isExpiring = !ticket.completed && ticket.expiry && checkIsExpiringSoon(ticket.expiry, notifyDays);
  const isDuplicateWarning = isDuplicate && !ticket.completed && !ticket.isDeleted;
  const isExpiringWarning = isExpiring && !ticket.completed && !ticket.isDeleted;
  const isHealthIssueWarning = hasHealthIssue && !ticket.completed && !ticket.isDeleted;

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
    if (isHealthIssueWarning) {
      return 'ring-2 ring-ticket-danger/60 shadow-lg shadow-ticket-danger/15';
    }
    if (isExpiringWarning) {
      return 'ring-2 ring-ticket-warning/50 shadow-lg shadow-ticket-warning/10';
    }
    if (isDuplicateWarning) {
      return 'ring-2 ring-ticket-warning/40';
    }
    return '';
  };

  const statusMeta = (() => {
    if (isHealthIssueWarning) {
      return { badge: '資料異常', badgeClassName: 'bg-ticket-danger/10 text-ticket-danger', dotClassName: 'bg-ticket-danger' };
    }
    if (isExpiringWarning) {
      return { badge: '快到期', badgeClassName: 'bg-ticket-warning/15 text-ticket-warning', dotClassName: 'bg-ticket-warning' };
    }
    if (isDuplicateWarning) {
      return { badge: '重複', badgeClassName: 'bg-orange-500/12 text-orange-500', dotClassName: 'bg-orange-500' };
    }
    if (ticket.completed) {
      return { badge: '已核銷', badgeClassName: 'bg-muted text-muted-foreground', dotClassName: 'bg-muted-foreground' };
    }
    if (ticket.pinned) {
      return { badge: '優先', badgeClassName: 'bg-amber-500/12 text-amber-600', dotClassName: 'bg-amber-500' };
    }
    return { badge: '待使用', badgeClassName: 'bg-ticket-success/10 text-ticket-success', dotClassName: 'bg-ticket-success' };
  })();

  // Build custom card styles based on settings - opacity only affects card background, not content
  const cardStyle: React.CSSProperties = {
    ...(cardBgColor && { backgroundColor: cardBgColor }),
    ...(cardBorderColor && { borderColor: cardBorderColor, borderWidth: '1px', borderStyle: 'solid' }),
  };
  
  // Calculate background opacity for card (content stays at full opacity)
  const cardBgOpacity = opacity !== undefined && opacity < 1 ? opacity : 1;
  const primaryMeta = isHealthIssueWarning
    ? { label: '資料異常', icon: AlertCircle, className: 'bg-ticket-danger/12 text-ticket-danger border-ticket-danger/20' }
    : isExpiringWarning
      ? { label: '快到期', icon: AlertCircle, className: 'bg-ticket-warning/14 text-ticket-warning border-ticket-warning/20' }
      : ticket.completed
        ? { label: '已核銷', icon: CheckCircle2, className: 'bg-muted text-muted-foreground border-border/60' }
        : { label: '有效票券', icon: Clock, className: 'bg-ticket-success/12 text-ticket-success border-ticket-success/20' };
  const PrimaryMetaIcon = primaryMeta.icon;
  const compactSerial = ticket.serial?.slice(0, 8) || ticket.id.slice(0, 8);
  const ticketCode = ticket.serial?.slice(-6).toUpperCase() || ticket.id.slice(-6).toUpperCase();
  const dateLabel = ticket.completed && ticket.completedAt
    ? formatDateTime(ticket.completedAt)
    : ticket.expiry || '無使用期限';

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
        className={`relative flex flex-col overflow-hidden rounded-[1.7rem] p-3 cursor-pointer ${getStatusStyles()}`}
      >
        {/* Background layer with opacity */}
        <div 
          className="absolute inset-0 rounded-[1.7rem] border border-white/60 bg-white/78 shadow-[0_24px_54px_-30px_rgba(15,23,42,0.42)] backdrop-blur-xl"
          style={{ 
            opacity: cardBgOpacity,
            ...(cardBgColor && { backgroundColor: cardBgColor }),
            ...(cardBorderColor && { borderColor: cardBorderColor, borderWidth: '1px', borderStyle: 'solid' }),
          }} 
        />
        
        {/* Status dot indicator */}
        <div className="absolute top-0 right-0 p-2 z-20">
          <span className={`block h-2.5 w-2.5 rounded-full ${statusMeta.dotClassName} ring-4 ring-card`}></span>
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
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusMeta.badgeClassName}`}>
                  {statusMeta.badge}
                </span>
                {ticket.pinned && <Pin size={11} className="text-amber-500" />}
              </div>
              <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground">
                {ticket.productName}
                {ticket.originalImage && <Maximize2 size={10} className="ml-1 inline text-primary" />}
                {ticket.redeemUrl && <ExternalLink size={10} className="ml-1 inline text-ticket-momo" />}
              </h3>
            
              {ticket.tags && ticket.tags.length > 0 && (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {ticket.tags.join(' · ')}
                </p>
              )}

              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {isDuplicateWarning && (
                  <span className="flex items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-500">
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
                  <span>{ticket.completed ? `已用 ${formatTime(ticket.completedAt)}` : ticket.expiry || '無期限'}</span>
                </span>
              )}
              </div>
            </div>
          
          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
            <span className="line-clamp-1 text-[10px] font-mono tracking-wider text-muted-foreground">
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
              <QrCode size={18} className="flex-shrink-0 text-muted-foreground/40" />
            </div>
          </div>
          </div>

          {/* Thumbnail (right) */}
          <div
            className="flex-shrink-0 overflow-hidden rounded-[1.15rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-white/60"
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
      className={`mx-4 mt-4 flex cursor-pointer relative overflow-visible rounded-[1.8rem] ${getStatusStyles()}`}
    >
      {/* Background layer with opacity */}
      <div 
        className="absolute inset-0 rounded-[1.8rem] border border-white/60 bg-white/80 shadow-[0_24px_56px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl"
        style={{ 
          opacity: cardBgOpacity,
          ...(cardBgColor && { backgroundColor: cardBgColor }),
          ...(cardBorderColor && { borderColor: cardBorderColor, borderWidth: '1px', borderStyle: 'solid' }),
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
        <div className="absolute -top-2 left-4 bg-ticket-danger text-primary-foreground text-[10px] px-3 py-1 rounded-full z-20 font-semibold shadow-md">
          序號不符
        </div>
      )}
      
      {isDuplicateWarning && !isHealthIssueWarning && (
        <div className="absolute -top-2 left-4 bg-ticket-warning text-primary-foreground text-[10px] px-3 py-1 rounded-full z-20 font-semibold shadow-md">
          重複序號
        </div>
      )}
      
      {/* Content layer - always full opacity */}
      <div className="ticket-shell relative z-10 flex w-full">
        {/* Left stub - image section */}
        <div className="ticket-stub flex w-28 flex-shrink-0 flex-col justify-between rounded-l-[1.8rem] p-3 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="mb-2 inline-flex items-center rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-[10px] font-semibold tracking-[0.24em] text-white/88">
              TASK TRUNK
            </div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-white/60">
              Admit One
            </div>
          </div>

          {ticket.image ? (
            <motion.img 
              src={ticket.image} 
              className="relative z-10 h-[88px] w-full rounded-[1.1rem] object-cover shadow-[0_16px_30px_-22px_rgba(0,0,0,0.72)] ring-1 ring-white/18"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              alt=""
            />
          ) : (
            <div className="relative z-10 flex h-[88px] w-full items-center justify-center rounded-[1.1rem] bg-white/12 ring-1 ring-white/15 backdrop-blur-sm">
              <TicketIcon size={28} className="text-white/80" />
            </div>
          )}
          {ticket.originalImage && (
            <div className="absolute bottom-[3.35rem] left-4 bg-foreground/60 text-background p-0.5 rounded-md backdrop-blur-sm z-20">
              <Maximize2 size={8} />
            </div>
          )}

          <div className="relative z-10 mt-3">
            <div className="text-[9px] uppercase tracking-[0.28em] text-white/52">
              Ticket ID
            </div>
            <div className="mt-1 font-mono text-xs tracking-[0.22em] text-white/88">
              {ticketCode}
            </div>
          </div>
        </div>
        
        {/* Ticket divider (dashed line) */}
        <div className="ticket-divider self-stretch my-2" />
        
        {/* Main content section */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-3.5 pr-4 pl-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${primaryMeta.className}`}>
                    <PrimaryMetaIcon size={10} />
                    {primaryMeta.label}
                  </span>
                  {ticket.pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-600">
                      <Pin size={10} className="fill-amber-500 text-amber-500" />
                      置頂
                    </span>
                  )}
                </div>
                <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-foreground">
                  {ticket.productName}
                  {ticket.redeemUrl && <ExternalLink size={11} className="ml-1 inline text-ticket-momo" />}
                </h3>
              </div>

              <div className="rounded-2xl bg-primary/[0.045] px-2.5 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                <div className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
                  Serial
                </div>
                <div className="mt-1 font-mono text-[11px] font-semibold tracking-[0.2em] text-foreground/70">
                  {compactSerial}
                </div>
              </div>
            </div>
            
            <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
              {ticket.tags && ticket.tags.map((t) => (
                <span key={t} className="whitespace-nowrap rounded-lg bg-primary/8 px-2.5 py-1 text-[10px] font-medium text-primary shadow-sm">
                  {t}
                </span>
              ))}
              {!ticket.tags?.length && <span className="text-[10px] text-muted-foreground/55">未分類票券</span>}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/60 bg-white/55 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <div className="text-[9px] uppercase tracking-[0.26em] text-muted-foreground">
                  {ticket.completed ? '完成時間' : '使用期限'}
                </div>
                <div className={`mt-1 flex items-center gap-1.5 text-[11px] font-semibold ${ticket.completed ? 'text-ticket-success' : isExpiring ? 'text-ticket-warning' : 'text-foreground'}`}>
                  {ticket.completed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  <span className="line-clamp-1">{dateLabel}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/45 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <div className="text-[9px] uppercase tracking-[0.26em] text-muted-foreground">
                  票券狀態
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-foreground/72">
                  <span className={`h-2 w-2 rounded-full ${statusMeta.dotClassName}`} />
                  <span>{statusMeta.badge}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex items-end justify-between gap-3 border-t border-dashed border-border/70 pt-3">
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                Admission Code
              </div>
              <div className="mt-1 font-mono text-[12px] font-semibold tracking-[0.28em] text-foreground/74">
                {ticketCode}
              </div>
            </div>

            {!isSelectionMode && (
              <div className="flex flex-shrink-0 items-center gap-2">
                {onTogglePin && !ticket.completed && !ticket.isDeleted && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onTogglePin(ticket.id); }}
                    className={`rounded-2xl p-2.5 transition-colors shadow-sm ${ticket.pinned ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/[0.045] text-muted-foreground/45 hover:text-amber-500/60'}`}
                  >
                    <Pin size={16} className={ticket.pinned ? 'fill-amber-500' : ''} />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`rounded-2xl px-5 py-2.5 text-xs font-bold tracking-[0.08em] transition-all duration-200 shadow-md ${
                    ticket.completed
                      ? 'bg-muted text-muted-foreground'
                      : 'brand-gradient text-primary-foreground hover:shadow-lg hover:shadow-ticket-success/30'
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
