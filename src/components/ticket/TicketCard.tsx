import React from 'react';
import { Check, AlertCircle, Clock, CheckCircle2, Maximize2 } from 'lucide-react';
import { Ticket } from '@/types/ticket';
import { checkIsExpiringSoon, formatTime, formatDateTime, hexToRgb } from '@/lib/helpers';

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
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onClick,
  notifyDays,
  isSelectionMode,
  isSelected,
  onSelect,
  isDuplicate,
  opacity = 0.95,
  cardBgColor = '#ffffff',
  cardBorderColor = '#e2e8f0',
  isCompact,
  compactHeight = 70,
  compactShowImage = false,
}) => {
  const isExpiring = !ticket.completed && ticket.expiry && checkIsExpiringSoon(ticket.expiry, notifyDays);
  const isDuplicateWarning = isDuplicate && !ticket.completed && !ticket.isDeleted;
  const isExpiringWarning = isExpiring && !ticket.completed && !ticket.isDeleted;
  const { r, g, b } = hexToRgb(cardBgColor);
  const bgBase = `rgba(${r}, ${g}, ${b}, ${opacity})`;

  let overlayClass = '';
  let dynamicBorderStyle: React.CSSProperties = {};

  if (isSelected) {
    overlayClass = 'bg-primary/10 ring-2 ring-primary border-primary';
  } else if (isExpiringWarning) {
    overlayClass = 'bg-ticket-warning/10 border-ticket-warning shadow-ticket-warning/20';
  } else {
    overlayClass = 'hover:shadow-md border';
    dynamicBorderStyle = { borderColor: cardBorderColor };
  }
  const duplicateClass = isDuplicateWarning ? 'border-ticket-warning ring-2 ring-ticket-warning/20 shadow-ticket-warning/30' : '';

  if (isCompact) {
    return (
      <div
        onClick={() => {
          if (isSelectionMode) onSelect(ticket.id);
          else onClick(ticket);
        }}
        style={{ backgroundColor: bgBase, height: `${compactHeight}px`, ...(!isSelected && !isExpiringWarning && !isDuplicateWarning ? dynamicBorderStyle : {}) }}
        className={`backdrop-blur-sm mx-2 mb-1 px-2 rounded-lg shadow-sm flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group ${overlayClass} ${duplicateClass}`}
      >
        {isSelectionMode && (
          <div
            className={`w-4 h-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background'
            }`}
          >
            {isSelected && <Check size={10} className="text-primary-foreground" />}
          </div>
        )}
        {compactShowImage && (
          <div className="h-full aspect-square py-1 mr-1 flex-shrink-0">
            {ticket.image ? (
              <img
                src={ticket.image}
                className={`w-full h-full object-cover rounded-md ${ticket.completed ? 'grayscale opacity-50' : ''}`}
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-md flex items-center justify-center border border-border">
                <span className="text-muted-foreground text-xs">🎫</span>
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            {isDuplicateWarning && (
              <span className="text-[9px] bg-ticket-warning text-white px-1.5 py-0.5 rounded font-bold">重複</span>
            )}
            <h3
              className={`font-bold text-foreground line-clamp-1 text-sm flex items-center gap-1 ${
                ticket.completed ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {ticket.productName}
        {ticket.originalImage && <span title="包含核銷原圖"><Maximize2 size={12} className="text-primary shrink-0" /></span>}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {isExpiringWarning && (
              <span className="text-[9px] font-bold text-ticket-warning flex items-center gap-0.5">
                <AlertCircle size={9} /> 快到期
              </span>
            )}
            <span className={`text-[10px] font-bold ${ticket.completed ? 'text-ticket-success' : 'text-ticket-success'}`}>
              {ticket.completed ? `已用 ${formatTime(ticket.completedAt)}` : ticket.expiry || '無期限'}
            </span>
          </div>
        </div>
        {!isSelectionMode && (
          <button
            className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${
              ticket.completed
                ? 'bg-muted text-muted-foreground'
                : 'bg-ticket-success/10 text-ticket-success hover:bg-ticket-success hover:text-white'
            }`}
          >
            {ticket.completed ? '查看' : '兌換'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        if (isSelectionMode) onSelect(ticket.id);
        else onClick(ticket);
      }}
      style={{ backgroundColor: bgBase, ...(!isSelected && !isExpiringWarning && !isDuplicateWarning ? dynamicBorderStyle : {}) }}
      className={`backdrop-blur-sm mx-4 mt-4 p-4 rounded-3xl shadow-sm flex gap-4 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group ${overlayClass} ${duplicateClass}`}
    >
      {isSelectionMode && (
        <div
          className={`absolute top-3 right-3 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background'
          }`}
        >
          {isSelected && <Check size={14} className="text-primary-foreground" />}
        </div>
      )}
      {isDuplicateWarning && (
        <div className="absolute top-0 left-0 bg-ticket-warning text-white text-[9px] px-2 py-0.5 rounded-br-lg z-20 font-bold">
          重複序號
        </div>
      )}
      <div className="w-20 h-20 flex-shrink-0 rounded-2xl flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform">
        {ticket.image ? (
          <img src={ticket.image} className={`w-full h-full object-cover ${ticket.completed ? 'grayscale opacity-50' : ''}`} />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-2xl">🎫</span>
          </div>
        )}
        {ticket.originalImage && (
          <div className="absolute bottom-1 left-1 bg-black/60 text-white p-1 rounded-md backdrop-blur-sm z-20 shadow-sm border border-white/10">
            <span title="包含核銷原圖"><Maximize2 size={10} /></span>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div>
          <div className="flex justify-between items-start pr-6">
            <h3 className={`font-bold text-foreground line-clamp-1 text-[15px] ${ticket.completed ? 'line-through text-muted-foreground' : ''}`}>
              {ticket.productName}
            </h3>
            {ticket.completed && (
              <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">已使用</span>
            )}
          </div>
          {isExpiringWarning && (
            <div className="text-[10px] font-bold text-ticket-warning mt-1 flex items-center gap-1 animate-pulse">
              <AlertCircle size={10} /> 快到期
            </div>
          )}
          <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            {ticket.tags &&
              ticket.tags.map((t) => (
                <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold whitespace-nowrap">
                  {t}
                </span>
              ))}
            {!ticket.tags?.length && <span className="text-[10px] text-muted-foreground font-bold">#</span>}
          </div>
        </div>
        <div className="flex justify-between items-end mt-2">
          {ticket.completed && ticket.completedAt ? (
            <div className="text-[10px] font-bold text-ticket-success flex items-center gap-1 bg-ticket-success/10 px-2 py-0.5 rounded-lg">
              <CheckCircle2 size={10} /> <span>核銷於 {formatDateTime(ticket.completedAt)}</span>
            </div>
          ) : (
            <div className={`text-xs font-bold flex items-center gap-1.5 ${isExpiring ? 'text-ticket-warning' : 'text-ticket-success'}`}>
              <Clock size={12} /> <span>{ticket.expiry || '無期限'}</span>
            </div>
          )}
          {!isSelectionMode && (
            <button
              className={`text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm transition-all active:scale-95 ${
                ticket.completed
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-ticket-success/10 text-ticket-success hover:bg-ticket-success hover:text-white shadow-ticket-success/20'
              }`}
            >
              {ticket.completed ? '查看' : '兌換'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
