import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Clock, CheckCircle2, Maximize2 } from 'lucide-react';
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
}) => {
  const isExpiring = !ticket.completed && ticket.expiry && checkIsExpiringSoon(ticket.expiry, notifyDays);
  const isDuplicateWarning = isDuplicate && !ticket.completed && !ticket.isDeleted;
  const isExpiringWarning = isExpiring && !ticket.completed && !ticket.isDeleted;

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
      opacity,
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
    if (isExpiringWarning) {
      return 'ring-2 ring-ticket-warning/50 shadow-lg shadow-ticket-warning/10';
    }
    if (isDuplicateWarning) {
      return 'ring-2 ring-ticket-warning/40';
    }
    return '';
  };

  // Build custom card styles based on settings
  const cardStyle: React.CSSProperties = {
    ...(cardBgColor && { backgroundColor: cardBgColor }),
    ...(cardBorderColor && { borderColor: cardBorderColor, borderWidth: '1px', borderStyle: 'solid' }),
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
        style={{ height: `${Math.max(compactHeight - 8, 56)}px`, ...cardStyle }}
        className={`glass-card mx-2 mb-1.5 px-2.5 rounded-xl flex items-center gap-2 cursor-pointer relative overflow-hidden ${getStatusStyles()}`}
      >
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
          <div className="h-12 w-12 flex-shrink-0 rounded-xl overflow-hidden">
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
        
        <div className="flex-1 min-w-0 py-2">
          <div className="flex items-center gap-2">
            {isDuplicateWarning && (
              <span className="text-[10px] bg-ticket-warning text-primary-foreground px-1.5 py-0.5 rounded-md font-semibold">重複</span>
            )}
            <h3 className={`font-semibold text-foreground line-clamp-1 text-sm tracking-tight ${ticket.completed ? 'line-through text-muted-foreground' : ''}`}>
              {ticket.productName}
              {ticket.originalImage && <Maximize2 size={10} className="inline ml-1 text-primary" />}
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
            className={`flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors ${
              ticket.completed
                ? 'bg-muted text-muted-foreground'
                : 'bg-ticket-success/15 text-ticket-success hover:bg-ticket-success hover:text-primary-foreground'
            }`}
          >
            {ticket.completed ? '查看' : '兌換'}
          </motion.button>
        )}
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
      style={cardStyle}
      className={`glass-card mx-2 mt-2 p-3 rounded-2xl flex gap-3 cursor-pointer relative overflow-hidden ${getStatusStyles()}`}
    >
      {isSelectionMode && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`absolute top-3 right-3 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background/80'
          }`}
        >
          {isSelected && <Check size={14} className="text-primary-foreground" />}
        </motion.div>
      )}
      
      {isDuplicateWarning && (
        <div className="absolute top-0 left-0 bg-ticket-warning text-primary-foreground text-[10px] px-2.5 py-1 rounded-br-xl z-20 font-semibold">
          重複序號
        </div>
      )}
      
      <div className="w-16 h-16 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden relative bg-muted/30">
        {ticket.image ? (
          <motion.img 
            src={ticket.image} 
            className={`w-full h-full object-cover ${ticket.completed ? 'grayscale opacity-50' : ''}`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            alt=""
          />
        ) : (
          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
            <span className="text-muted-foreground text-xl">🎫</span>
          </div>
        )}
        {ticket.originalImage && (
          <div className="absolute bottom-0.5 left-0.5 bg-foreground/60 text-background p-0.5 rounded-md backdrop-blur-sm z-20">
            <Maximize2 size={8} />
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-between py-0 min-w-0">
        <div>
          <div className="flex justify-between items-start pr-6">
            <h3 className={`font-semibold text-foreground line-clamp-1 text-[13px] tracking-tight ${ticket.completed ? 'line-through text-muted-foreground' : ''}`}>
              {ticket.productName}
            </h3>
            {ticket.completed && (
              <span className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 rounded-md font-medium">已用</span>
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
          
          <div className="flex gap-1 mt-1.5 overflow-x-auto no-scrollbar">
            {ticket.tags && ticket.tags.map((t) => (
              <span key={t} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap">
                {t}
              </span>
            ))}
            {!ticket.tags?.length && <span className="text-[9px] text-muted-foreground/50">#</span>}
          </div>
        </div>
        
        <div className="flex justify-between items-end mt-2">
          {ticket.completed && ticket.completedAt ? (
            <div className="text-[9px] font-medium text-ticket-success flex items-center gap-1 bg-ticket-success/10 px-2 py-0.5 rounded-lg">
              <CheckCircle2 size={10} /> <span>{formatDateTime(ticket.completedAt)}</span>
            </div>
          ) : (
            <div className={`text-[10px] font-medium flex items-center gap-1 ${isExpiring ? 'text-ticket-warning' : 'text-ticket-success'}`}>
              <Clock size={11} /> <span>{ticket.expiry || '無期限'}</span>
            </div>
          )}
          
          {!isSelectionMode && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-xl transition-all ${
                ticket.completed
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-ticket-success/15 text-ticket-success hover:bg-ticket-success hover:text-primary-foreground shadow-sm'
              }`}
            >
              {ticket.completed ? '查看' : '兌換'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};