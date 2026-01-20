import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Clock, CheckCircle2, Maximize2, ExternalLink } from 'lucide-react';
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
  compactHeight?: number;
  compactShowImage?: boolean;
  index?: number;
  hasHealthIssue?: boolean;
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
  compactHeight = 72,
  compactShowImage = false,
  index = 0,
  hasHealthIssue = false,
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

  // Build custom card styles based on settings - opacity only affects card background, not content
  const cardStyle: React.CSSProperties = {
    ...(cardBgColor && { backgroundColor: cardBgColor }),
    ...(cardBorderColor && { borderColor: cardBorderColor, borderWidth: '1px', borderStyle: 'solid' }),
  };
  
  // Calculate background opacity for card (content stays at full opacity)
  const cardBgOpacity = opacity !== undefined && opacity < 1 ? opacity : 1;

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
        style={{ height: `${Math.max(compactHeight - 8, 56)}px` }}
        className={`mx-3 mb-2 px-3 rounded-2xl flex items-center gap-2.5 cursor-pointer relative overflow-hidden ${getStatusStyles()}`}
      >
        {/* Background layer with opacity */}
        <div 
          className="absolute inset-0 glass-card rounded-2xl"
          style={{ 
            opacity: cardBgOpacity,
            ...(cardBgColor && { backgroundColor: cardBgColor }),
            ...(cardBorderColor && { borderColor: cardBorderColor, borderWidth: '1px', borderStyle: 'solid' }),
          }} 
        />
        {/* Content layer - always full opacity */}
        <div className="relative z-10 flex items-center gap-2.5 w-full h-full py-1">
        {isSelectionMode && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background/50'
            }`}
          >
            {isSelected && <Check size={12} className="text-primary-foreground" />}
          </motion.div>
        )}
        
        {compactShowImage && (
          <div className="h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
            {ticket.image ? (
              <img
                src={ticket.image}
                className={`w-full h-full object-cover ${ticket.completed ? 'grayscale opacity-50' : ''}`}
                alt=""
              />
            ) : (
              <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">🎫</span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0 py-2.5">
          <div className="flex items-center gap-2">
            {isHealthIssueWarning && (
              <span className="text-[10px] bg-ticket-danger text-primary-foreground px-2 py-0.5 rounded-lg font-semibold shadow-sm">不符</span>
            )}
            {isDuplicateWarning && !isHealthIssueWarning && (
              <span className="text-[10px] bg-ticket-warning text-primary-foreground px-2 py-0.5 rounded-lg font-semibold shadow-sm">重複</span>
            )}
            <h3 className={`font-semibold text-foreground line-clamp-1 text-sm tracking-tight ${ticket.completed ? 'line-through text-muted-foreground' : ''}`}>
              {ticket.productName}
              {ticket.originalImage && <Maximize2 size={10} className="inline ml-1 text-primary" />}
              {ticket.redeemUrl && <ExternalLink size={10} className="inline ml-1 text-ticket-momo" />}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {isExpiringWarning && (
              <span className="text-[10px] font-semibold text-ticket-warning flex items-center gap-0.5">
                <AlertCircle size={10} /> 快到期
              </span>
            )}
            <span className={`text-[11px] font-medium ${ticket.completed ? 'text-muted-foreground' : 'text-ticket-success'}`}>
              {ticket.completed ? `已用 ${formatTime(ticket.completedAt)}` : ticket.expiry || '無期限'}
            </span>
          </div>
        </div>
        
        {!isSelectionMode && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-sm ${
              ticket.completed
                ? 'bg-muted text-muted-foreground'
                : 'bg-ticket-success text-primary-foreground hover:shadow-md hover:shadow-ticket-success/30'
            }`}
          >
            {ticket.completed ? '查看' : '兌換'}
          </motion.button>
        )}
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
      className={`mx-4 mt-4 rounded-2xl flex cursor-pointer relative overflow-visible ${getStatusStyles()}`}
    >
      {/* Background layer with opacity */}
      <div 
        className="absolute inset-0 glass-card rounded-2xl"
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
      <div className="relative z-10 flex w-full">
        {/* Left stub - image section */}
        <div className="ticket-stub w-24 flex-shrink-0 rounded-l-2xl flex items-center justify-center p-2.5 relative overflow-hidden">
          {ticket.image ? (
            <motion.img 
              src={ticket.image} 
              className={`w-full h-full object-cover rounded-xl shadow-sm ${ticket.completed ? 'grayscale opacity-50' : ''}`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              alt=""
            />
          ) : (
            <div className="w-full aspect-square bg-muted/50 rounded-xl flex items-center justify-center">
              <span className="text-muted-foreground text-2xl">🎫</span>
            </div>
          )}
          {ticket.originalImage && (
            <div className="absolute bottom-1 left-1 bg-foreground/60 text-background p-0.5 rounded-md backdrop-blur-sm z-20">
              <Maximize2 size={8} />
            </div>
          )}
        </div>
        
        {/* Ticket divider (dashed line) */}
        <div className="ticket-divider self-stretch my-2" />
        
        {/* Main content section */}
        <div className="flex-1 flex flex-col justify-between py-3 pr-4 pl-2.5 min-w-0">
          <div>
            <div className="flex justify-between items-start">
              <h3 className={`font-bold text-foreground line-clamp-1 text-sm tracking-tight ${ticket.completed ? 'line-through text-muted-foreground' : ''}`}>
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
                <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg font-medium whitespace-nowrap shadow-sm">
                  {t}
                </span>
              ))}
              {!ticket.tags?.length && <span className="text-[9px] text-muted-foreground/50">#</span>}
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-2.5">
            {ticket.completed && ticket.completedAt ? (
              <div className="text-[10px] font-semibold text-ticket-success flex items-center gap-1.5 bg-ticket-success/10 px-2.5 py-1 rounded-xl shadow-sm">
                <CheckCircle2 size={12} /> <span>{formatDateTime(ticket.completedAt)}</span>
              </div>
            ) : (
              <div className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-sm ${isExpiring ? 'text-ticket-warning bg-ticket-warning/10' : 'text-ticket-success bg-ticket-success/10'}`}>
                <Clock size={12} /> <span>{ticket.expiry || '無期限'}</span>
              </div>
            )}
            
            {!isSelectionMode && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`text-xs font-bold px-5 py-2 rounded-xl transition-all duration-200 shadow-md ${
                  ticket.completed
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-ticket-success text-primary-foreground hover:shadow-lg hover:shadow-ticket-success/30'
                }`}
              >
                {ticket.completed ? '查看' : '兌換'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};