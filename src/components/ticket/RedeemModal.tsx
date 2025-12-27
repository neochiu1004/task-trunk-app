import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Pencil,
  AlertCircle,
  Maximize2,
  ArrowUpDown,
  RefreshCcw,
  LayoutDashboard,
  Image as ImageIcon,
} from 'lucide-react';
import { Ticket, Template } from '@/types/ticket';
import { compressImage } from '@/lib/helpers';
import { BarcodeCanvas } from './BarcodeCanvas';
import { QRCodeCanvas } from './QRCodeCanvas';
import { MomoTemplate } from './MomoTemplate';
import { TagSelectInput } from './TagSelectInput';

interface RedeemModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onToggleComplete: (ticket: Ticket) => void;
  onDelete: (id: string, forceNotify?: boolean) => void;
  onRestore: (ticket: Ticket) => void;
  onUpdate: (ticket: Ticket) => void;
  allTags: string[];
  specificViewKeywords: string[];
  onSaveTemplate: (data: { label: string; productName: string; image?: string; tags?: string[] }) => void;
  templates: Template[];
  onDeleteTemplate: (id: string) => void;
}

export const RedeemModal: React.FC<RedeemModalProps> = ({
  ticket,
  onClose,
  onToggleComplete,
  onDelete,
  onRestore,
  onUpdate,
  allTags,
  specificViewKeywords,
  onSaveTemplate,
  templates,
  onDeleteTemplate,
}) => {
  type ViewModeType = 'standard' | 'image' | 'momo';
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editImage, setEditImage] = useState('');
  const [editOriginalImage, setEditOriginalImage] = useState('');
  const [viewMode, setViewMode] = useState<ViewModeType>('standard');
  const [showFullScreen, setShowFullScreen] = useState(false);

  const isSpecificView = useMemo(() => {
    if (!ticket) return false;
    const keywords = specificViewKeywords?.length > 0 ? specificViewKeywords : ['MOMO', '85度C'];
    const searchTarget = (ticket.productName + (ticket.tags || []).join('')).toUpperCase();
    return keywords.some((kw) => searchTarget.includes(kw.toUpperCase()));
  }, [ticket, specificViewKeywords]);

  const getInitialViewMode = (): 'standard' | 'image' | 'momo' => {
    if (!ticket) return 'standard';
    if (ticket.originalImage) return 'image';
    if (isSpecificView) return 'momo';
    if (ticket.image && !ticket.serial) return 'image';
    return 'standard';
  };

  useEffect(() => {
    if (ticket) {
      setEditName(ticket.productName);
      setEditExpiry(ticket.expiry);
      setEditTags(ticket.tags || []);
      setEditImage(ticket.image || '');
      setEditOriginalImage(ticket.originalImage || '');
      setViewMode(getInitialViewMode());
      if (ticket.originalImage) {
        setShowFullScreen(true);
      } else {
        setShowFullScreen(false);
      }
    } else {
      setShowFullScreen(false);
    }
  }, [ticket]);

  if (!ticket) return null;

  const applyTemplate = (tpl: Template) => {
    setEditName(tpl.productName);
    if (tpl.image) setEditImage(tpl.image);
    if (tpl.tags && tpl.tags.length > 0) setEditTags(tpl.tags);
  };

  const handleSwapImages = () => {
    const tempThumbnail = editImage;
    setEditImage(editOriginalImage);
    setEditOriginalImage(tempThumbnail);
  };

  const handleSave = () => {
    onUpdate({
      ...ticket,
      productName: editName,
      expiry: editExpiry.replace(/-/g, '/'),
      tags: editTags,
      image: editImage,
      originalImage: editOriginalImage,
      images: editImage ? [editImage] : [],
    });
    setIsEditing(false);
  };

  const hasAnyImage = !!ticket.image || !!ticket.originalImage;
  const isMomoMode = viewMode === 'momo';

  return (
    <>
      <div
        className="fixed inset-0 bg-foreground/70 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className={`bg-card w-full max-w-sm rounded-[28px] overflow-hidden relative shadow-2xl flex flex-col border border-border transition-all ${
            isMomoMode ? 'h-[85vh] sm:h-auto' : 'max-h-[90vh]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-5 flex flex-col h-full">
            <div className="text-center shrink-0">
              {isEditing ? (
                <input
                  className="text-lg font-black text-center w-full border-b border-primary/30 pb-2 mb-2 text-foreground focus:outline-none bg-transparent"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              ) : (
                !isMomoMode && (
                  <h3 className="text-base font-black text-foreground break-words leading-tight px-4 mb-2">
                    {ticket.productName}
                  </h3>
                )
              )}
              {isEditing && (
                <div className="mt-2 text-left space-y-3 bg-muted p-4 rounded-2xl relative max-h-[55vh] overflow-y-auto no-scrollbar pr-2">
                  {templates && templates.length > 0 && (
                    <div className="mb-4 bg-primary/5 p-3 rounded-2xl border border-primary/10">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                        <LayoutDashboard size={12} /> 套用範本
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                        {templates.map((tpl) => (
                          <div
                            key={tpl.id}
                            onClick={() => applyTemplate(tpl)}
                            className="shrink-0 flex items-center gap-2 bg-card border border-primary/20 rounded-xl p-1 pr-2 cursor-pointer hover:bg-primary/10 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden">
                              {tpl.image ? (
                                <img src={tpl.image} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={12} className="text-primary/30" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-primary max-w-[80px] truncate">{tpl.label}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTemplate(tpl.id);
                              }}
                              className="text-primary/30 hover:text-ticket-warning p-0.5"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative group">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">封面 (列表/範本用)</label>
                    <div className="flex items-center gap-3 mt-1">
                      {editImage ? (
                        <img src={editImage} className="w-12 h-12 object-cover rounded-lg border border-border" />
                      ) : (
                        <div className="w-12 h-12 bg-card border border-dashed border-border rounded-lg flex items-center justify-center">
                          <ImageIcon size={16} className="text-muted-foreground" />
                        </div>
                      )}
                      <label className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md cursor-pointer hover:bg-primary/20 transition-colors">
                        上傳縮圖
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const base64 = await compressImage(file, 'thumbnail');
                              setEditImage(base64);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-center -my-1 z-10">
                    <button
                      onClick={handleSwapImages}
                      className="w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm active:rotate-180 duration-300"
                    >
                      <ArrowUpDown size={14} />
                    </button>
                  </div>

                  <div className="relative group">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">核銷原圖 (全螢幕用)</label>
                    <div className="flex items-center gap-3 mt-1">
                      {editOriginalImage ? (
                        <img src={editOriginalImage} className="w-12 h-12 object-cover rounded-lg border border-border" />
                      ) : (
                        <div className="w-12 h-12 bg-card border border-dashed border-border rounded-lg flex items-center justify-center">
                          <Maximize2 size={16} className="text-muted-foreground" />
                        </div>
                      )}
                      <label className="px-3 py-1 bg-ticket-success/10 text-ticket-success text-[10px] font-bold rounded-md cursor-pointer hover:bg-ticket-success/20 transition-colors">
                        上傳原圖
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const base64 = await compressImage(file, 'original');
                              setEditOriginalImage(base64);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">兌換期限</label>
                    <input
                      type="date"
                      className="w-full p-3 bg-card border border-border rounded-xl outline-none text-sm font-bold text-foreground"
                      value={editExpiry ? editExpiry.replace(/\//g, '-') : ''}
                      onChange={(e) => setEditExpiry(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">標籤</label>
                    <TagSelectInput
                      allTags={allTags}
                      selectedTags={editTags}
                      onTagsChange={setEditTags}
                      extraSuggestions={specificViewKeywords}
                    />
                  </div>
                </div>
              )}
            </div>
            {!isEditing && (
              <div className="flex-1 flex flex-col min-h-0">
                {!isMomoMode && (
                  <div className="flex justify-center shrink-0">
                    <div className="flex bg-muted p-1 rounded-xl mb-3">
                      <button
                        onClick={() => setViewMode('standard')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          viewMode === 'standard' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        條碼
                      </button>
                      {hasAnyImage && (
                        <button
                          onClick={() => {
                            setViewMode('image');
                            if (ticket.originalImage) setShowFullScreen(true);
                          }}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all relative flex items-center gap-1 ${
                            viewMode === 'image' ? 'bg-card shadow-sm text-foreground font-black' : 'text-muted-foreground font-bold'
                          }`}
                        >
                          {ticket.originalImage && <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>} 原圖
                        </button>
                      )}
                      {isSpecificView && (
                        <button
                          onClick={() => setViewMode('momo')}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            (viewMode as string) === 'momo' ? 'bg-ticket-momo text-white shadow-sm' : 'text-ticket-momo'
                          }`}
                        >
                          專屬
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex-1 min-h-0 relative overflow-y-auto no-scrollbar pb-4">
                  {viewMode === 'image' ? (
                    <div className="h-full flex flex-col items-center gap-3 relative group">
                      <button
                        onClick={onClose}
                        className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
                      >
                        <X size={18} />
                      </button>

                      <div
                        className="relative w-full flex-1 min-h-0 flex items-center justify-center cursor-zoom-in group"
                        onClick={() => setShowFullScreen(true)}
                      >
                        <img
                          src={ticket.originalImage || ticket.image}
                          className={`max-h-full w-auto rounded-xl shadow-md border border-border transition-opacity ${
                            !ticket.originalImage ? 'opacity-70 grayscale-[0.3]' : 'opacity-100'
                          }`}
                        />

                        {!ticket.originalImage && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/80 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-lg border border-amber-400/50 animate-bounce">
                            <AlertCircle size={12} /> 預覽模式 (建議上傳原圖核銷)
                          </div>
                        )}

                        {ticket.originalImage && (
                          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-2 py-1 rounded-md text-[9px] font-black shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            高畫質核銷圖
                          </div>
                        )}
                      </div>

                      {ticket.serial && (
                        <div className="w-full space-y-2 shrink-0 pb-4">
                          <div className="bg-card p-2 rounded-xl border border-border">
                            <BarcodeCanvas text={ticket.serial} />
                          </div>
                          <div className="flex justify-center p-2 bg-card rounded-xl border border-border shrink-0">
                            <QRCodeCanvas text={ticket.serial} size={100} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isMomoMode ? (
                    <div className="h-full py-1">
                      <MomoTemplate ticket={ticket} onContentClick={onClose} />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-5 py-4">
                      {ticket.serial && (
                        <div onClick={onClose} className="w-full bg-card p-3 rounded-xl border border-border shadow-sm cursor-pointer">
                          <BarcodeCanvas text={ticket.serial} />
                        </div>
                      )}
                      <div onClick={onClose} className="p-4 bg-card rounded-[32px] shadow-sm border border-border cursor-pointer">
                        {ticket.serial ? (
                          <QRCodeCanvas text={ticket.serial} size={180} />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl font-bold">
                            無序號
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <span className="text-[11px] font-bold text-muted-foreground block mb-1">電子券號</span>
                        <span className="font-mono text-lg font-black text-foreground bg-muted px-4 py-1 rounded-full">
                          {ticket.serial || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="mt-4 shrink-0 flex flex-col gap-2">
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-3 bg-muted text-muted-foreground rounded-xl font-bold text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      const name = prompt('請輸入範本名稱');
                      if (name) onSaveTemplate({ label: name, productName: editName, image: editImage, tags: editTags });
                    }}
                    className="px-5 py-3 bg-ticket-success/10 text-ticket-success rounded-xl font-bold text-sm flex items-center gap-1 hover:bg-ticket-success/20"
                  >
                    <LayoutDashboard size={16} /> 存範本
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20"
                  >
                    儲存變更
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-1">
                    <button
                      onClick={() => {
                        if (window.confirm('確定刪除此票券並視同核銷通知嗎？')) {
                          onDelete(ticket.id, true);
                          onClose();
                        }
                      }}
                      className="flex-1 py-4 text-sm font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-white bg-ticket-warning hover:bg-ticket-warning/90 transition-all active:scale-95"
                    >
                      <Trash2 size={18} /> 刪除
                    </button>

                    {!ticket.isDeleted && (
                      <button
                        onClick={() => {
                          if (ticket.completed || window.confirm('確定核銷？')) {
                            onToggleComplete(ticket);
                            onClose();
                          }
                        }}
                        className="flex-[2] py-4 text-sm font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-white bg-ticket-success hover:bg-ticket-success/90 transition-all active:scale-95"
                      >
                        {ticket.completed ? (
                          <>
                            <RotateCcw size={18} /> 標記未用
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} /> 立即核銷
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 h-11">
                    {ticket.isDeleted ? (
                      <button
                        onClick={() => {
                          onRestore(ticket);
                          onClose();
                        }}
                        className="flex-1 bg-ticket-success/10 text-ticket-success text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <RefreshCcw size={14} /> 還原
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 bg-muted text-muted-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-border"
                      >
                        <Pencil size={14} /> 編輯
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="flex-1 bg-muted text-muted-foreground font-bold rounded-xl flex items-center justify-center text-xs hover:bg-muted/80 transition-colors"
                    >
                      關閉
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showFullScreen && (ticket.originalImage || ticket.image) && (
        <div
          className="fixed inset-0 bg-black z-[60] flex items-center justify-center"
          onClick={() => setShowFullScreen(false)}
        >
          <button
            onClick={() => setShowFullScreen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
          >
            <X size={24} />
          </button>
          <img
            src={ticket.originalImage || ticket.image}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
};
