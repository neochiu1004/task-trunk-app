import React from 'react';
import { Info, Clock, Image as ImageIcon } from 'lucide-react';
import { Ticket } from '@/types/ticket';
import { BarcodeCanvas } from './BarcodeCanvas';
import { QRCodeCanvas } from './QRCodeCanvas';

interface MomoTemplateProps {
  ticket: Ticket;
  onContentClick: () => void;
}

export const MomoTemplate: React.FC<MomoTemplateProps> = ({ ticket, onContentClick }) => {
  return (
    <div className="w-full h-full flex flex-col bg-white border border-border rounded-2xl overflow-hidden shadow-2xl animate-fade-in text-left">
      <div className="bg-ticket-momo px-4 py-2.5 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black tracking-widest opacity-90">📱 電子票券明細</span>
        </div>
        <Info size={14} className="opacity-60" />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-3 space-y-3">
          <div className="flex gap-3">
            <div
              onClick={onContentClick}
              className="w-20 h-20 shrink-0 border border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
            >
              {ticket.image ? (
                <img src={ticket.image} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="text-muted-foreground" size={24} />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h2 className="text-[15px] font-black text-foreground leading-tight line-clamp-2">{ticket.productName}</h2>
            </div>
          </div>
          <div className="relative border-t border-dashed border-border my-1">
            <div className="absolute -left-5 -top-1.5 w-3 h-3 bg-white rounded-full border border-border"></div>
            <div className="absolute -right-5 -top-1.5 w-3 h-3 bg-white rounded-full border border-border"></div>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 flex flex-col items-center gap-3">
            <div onClick={onContentClick} className="w-full px-2 cursor-pointer">
              <BarcodeCanvas text={ticket.serial} />
            </div>
            <div onClick={onContentClick} className="p-1.5 bg-white border border-border rounded-lg shadow-sm cursor-pointer">
              <QRCodeCanvas text={ticket.serial} size={110} />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground mb-0.5">電子券號</p>
              <p className="text-[13px] font-mono font-black text-foreground tracking-wider break-all px-4">{ticket.serial}</p>
            </div>
          </div>
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-muted-foreground flex items-center gap-1">
                <Clock size={12} /> 兌換期限
              </span>
              <span className="font-black text-ticket-momo tracking-tight">{ticket.expiry || '無效期限制'}</span>
            </div>
            <div className="pt-2 text-[10px] text-muted-foreground leading-tight border-t border-border italic">
              ● 本券限兌換一次，結帳前請出示此畫面。不接受手抄或口說序號。
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-2 bg-muted border-t border-border shrink-0 flex justify-between items-center">
        <span className="text-[9px] font-bold text-muted-foreground">票券管家 Pro</span>
      </div>
    </div>
  );
};
