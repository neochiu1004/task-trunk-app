import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
  Search,
  Loader2,
  Download,
} from 'lucide-react';
import { Ticket, Template } from '@/types/ticket';
import { compressImage } from '@/lib/helpers';
import { BarcodeCanvas } from './BarcodeCanvas';
import { QRCodeCanvas } from './QRCodeCanvas';
import { MomoTemplate } from './MomoTemplate';
import { TagSelectInput } from './TagSelectInput';
import { ImageUpload } from '@/components/ui/image-upload';
import { WebImageSearch } from '@/components/ui/web-image-search';
import { scanBarcodeFromImage } from '@/lib/barcodeScanner';
import { useToast } from '@/hooks/use-toast';

interface RedeemModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onToggleComplete: (ticket: Ticket) => void;
  onDelete: (id: string, forceNotify?: boolean, skipConfirm?: boolean) => void;
  onRestore: (ticket: Ticket) => void;
  onUpdate: (ticket: Ticket) => void;
  allTags: string[];
  specificViewKeywords: string[];
  onSaveTemplate: (data: { label: string; productName: string; image?: string; tags?: string[]; serial?: string; expiry?: string; redeemUrl?: string }) => void;
  templates: Template[];
  onDeleteTemplate: (id: string) => void;
}

type ViewModeType = 'standard' | 'image' | 'momo';

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
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editImage, setEditImage] = useState('');
  const [editOriginalImage, setEditOriginalImage] = useState('');
  const [editBarcodeFormat, setEditBarcodeFormat] = useState<string | undefined>(undefined);
  const [editRedeemUrl, setEditRedeemUrl] = useState('');
  const [viewMode, setViewMode] = useState<ViewModeType>('standard');
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [isRedeemAnimating, setIsRedeemAnimating] = useState(false);
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const isSpecificView = useMemo(() => {
    if (!ticket) return false;
    const keywords = specificViewKeywords?.length > 0 ? specificViewKeywords : ['MOMO', '85度C'];
    const searchTarget = (ticket.productName + (ticket.tags || []).join('')).toUpperCase();
    return keywords.some((kw) => searchTarget.includes(kw.toUpperCase()));
  }, [ticket, specificViewKeywords]);

  const getInitialViewMode = (): ViewModeType => {
    if (!ticket) return 'standard';
    if (ticket.originalImage) return 'image';
    if (isSpecificView) return 'momo';
    if (ticket.image && !ticket.serial) return 'image';
    return 'standard';
  };

  useEffect(() => {
    if (ticket) {
      setEditName(ticket.productName);
      setEditSerial(ticket.serial || '');
      setEditExpiry(ticket.expiry);
      setEditTags(ticket.tags || []);
      setEditImage(ticket.image || '');
      setEditOriginalImage(ticket.originalImage || '');
      setEditBarcodeFormat(ticket.barcodeFormat);
      setEditRedeemUrl(ticket.redeemUrl || '');
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

  const handleOriginalImageChange = async (base64: string) => {
    setEditOriginalImage(base64);
    
    // Scan for barcode in the background
    if (base64) {
      setIsScanning(true);
      try {
        const result = await scanBarcodeFromImage(base64);
        if (result) {
          setEditSerial(result.content);
          setEditBarcodeFormat(result.format);
          toast({
            title: "條碼偵測成功",
            description: `序號: ${result.content} | 格式: ${result.format}`,
          });
        }
      } catch (error) {
        console.error('Barcode scan failed:', error);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const applyTemplate = (tpl: Template) => {
    setEditName(tpl.productName);
    if (tpl.image) setEditImage(tpl.image);
    if (tpl.tags && tpl.tags.length > 0) setEditTags(tpl.tags);
    if (tpl.serial) setEditSerial(tpl.serial);
    if (tpl.expiry) setEditExpiry(tpl.expiry);
    if (tpl.redeemUrl) setEditRedeemUrl(tpl.redeemUrl);
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
      serial: editSerial,
      expiry: editExpiry.replace(/-/g, '/'),
      tags: editTags,
      image: editImage,
      originalImage: editOriginalImage,
      images: editImage ? [editImage] : [],
      barcodeFormat: editBarcodeFormat,
      redeemUrl: editRedeemUrl,
    });
    setIsEditing(false);
  };

  const handleToggleCompleteWithAnimation = () => {
    if (ticket.completed || window.confirm('確定核銷？')) {
      setIsRedeemAnimating(true);
      setTimeout(() => {
        onToggleComplete(ticket);
        setIsRedeemAnimating(false);
        onClose();
        // 核銷後詢問是否跳轉網址
        if (!ticket.completed && ticket.redeemUrl) {
          setTimeout(() => {
            if (window.confirm('是否開啟跳轉連結？')) {
              window.open(ticket.redeemUrl, '_blank');
            }
          }, 300);
        }
      }, 600);
    }
  };

  const handleDownloadOriginal = () => {
    const imageData = ticket.originalImage || ticket.image;
    if (!imageData) return;
    
    const link = document.createElement('a');
    link.href = imageData;
    const ext = imageData.includes('image/png') ? 'png' : imageData.includes('image/webp') ? 'webp' : 'jpg';
    const safeName = ticket.productName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').slice(0, 30);
    link.download = `${safeName}_原圖.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "下載成功", description: "原圖已儲存" });
  };

  const hasAnyImage = !!ticket.image || !!ticket.originalImage;
  const isMomoMode = viewMode === 'momo';

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 400, damping: 30 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
      transition: { duration: 0.2 }
    },
  };

  const buttonVariants = {
    tap: { scale: 0.95 },
    hover: { scale: 1.02 },
  };

  return (
    <>
      <AnimatePresence>
        {ticket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md"
            onClick={onClose}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`glass-card w-full max-w-sm rounded-[28px] overflow-hidden relative flex flex-col border border-border/50 ${
                isMomoMode ? 'h-[85vh] sm:h-auto' : 'max-h-[90vh]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Redeem Animation Overlay */}
              <AnimatePresence>
                {isRedeemAnimating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-ticket-success/90 backdrop-blur-md"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex flex-col items-center"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{ repeat: 1, duration: 0.4 }}
                      >
                        <Sparkles className="w-16 h-16 text-primary-foreground" />
                      </motion.div>
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-bold text-primary-foreground mt-2"
                      >
                        {ticket.completed ? '已標記未用' : '核銷成功！'}
                      </motion.span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4 sm:p-5 flex flex-col h-full">
                <div className="text-center shrink-0">
                  {isEditing ? (
                    <input
                      className="text-lg font-bold text-center w-full border-b-2 border-primary/30 pb-2 mb-2 text-foreground focus:outline-none bg-transparent focus:border-primary transition-colors"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="請輸入票券名稱"
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                      }}
                    />
                  ) : (
                    !isMomoMode && (
                      <motion.h3
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-base font-bold text-foreground break-words leading-tight px-4 mb-2"
                      >
                        {ticket.productName}
                      </motion.h3>
                    )
                  )}
                  
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-left space-y-3 glass-card p-4 rounded-2xl relative max-h-[55vh] overflow-y-auto no-scrollbar pr-2"
                    >
                      {templates && templates.length > 0 && (
                        <div className="mb-4 bg-primary/5 p-3 rounded-2xl border border-primary/10">
                          <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <LayoutDashboard size={12} /> 套用範本
                          </div>
                          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                            {templates.map((tpl) => (
                              <motion.div
                                key={tpl.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => applyTemplate(tpl)}
                                className="shrink-0 flex items-center gap-2 bg-card border border-primary/20 rounded-xl p-1.5 pr-2 cursor-pointer hover:bg-primary/10 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden">
                                  {tpl.image ? (
                                    <img src={tpl.image} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <ImageIcon size={12} className="text-primary/30" />
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-primary max-w-[80px] truncate">{tpl.label}</span>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTemplate(tpl.id);
                                  }}
                                  className="text-primary/30 hover:text-ticket-warning p-0.5"
                                >
                                  <X size={12} />
                                </motion.button>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Image Uploads */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">封面縮圖</label>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setShowWebSearch(true)}
                              className="text-[10px] text-primary flex items-center gap-1 hover:underline"
                            >
                              <Search size={10} /> 搜尋
                            </motion.button>
                          </div>
                          <div className="relative">
                            <ImageUpload
                              value={editImage}
                              onChange={setEditImage}
                              onClear={() => setEditImage('')}
                              type="thumbnail"
                            />
                            {editImage && (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setEditImage('')}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md z-10"
                              >
                                <X size={12} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">核銷原圖</label>
                            {isScanning && (
                              <Loader2 size={10} className="animate-spin text-primary" />
                            )}
                          </div>
                          <div className="relative">
                            <ImageUpload
                              value={editOriginalImage}
                              onChange={handleOriginalImageChange}
                              onClear={() => {
                                setEditOriginalImage('');
                                setEditBarcodeFormat(undefined);
                              }}
                              type="original"
                            />
                            {editOriginalImage && (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setEditOriginalImage('');
                                  setEditBarcodeFormat(undefined);
                                }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md z-10"
                              >
                                <X size={12} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Web Image Search Modal */}
                      <WebImageSearch
                        isOpen={showWebSearch}
                        onClose={() => setShowWebSearch(false)}
                        onSelectImage={(base64) => setEditImage(base64)}
                      />

                      <div className="flex justify-center -my-1 z-10">
                        <motion.button
                          whileTap={{ scale: 0.9, rotate: 180 }}
                          onClick={handleSwapImages}
                          className="w-8 h-8 glass-button rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                        >
                          <ArrowUpDown size={14} />
                        </motion.button>
                      </div>

                      {/* Serial Number */}
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">電子券號</label>
                        <input
                          type="text"
                          className="w-full p-3 glass-card rounded-xl outline-none text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                          value={editSerial}
                          onChange={(e) => setEditSerial(e.target.value)}
                          placeholder="掃描或手動輸入序號"
                        />
                        {editBarcodeFormat && (
                          <div className="text-[10px] text-muted-foreground mt-1 pl-1">
                            條碼格式: {editBarcodeFormat}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">兌換期限</label>
                        <input
                          type="date"
                          className="w-full p-3 glass-card rounded-xl outline-none text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/30 transition-all"
                          value={editExpiry ? editExpiry.replace(/\//g, '-') : ''}
                          onChange={(e) => setEditExpiry(e.target.value)}
                          onFocus={(e) => {
                            setTimeout(() => {
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 300);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">標籤</label>
                        <TagSelectInput
                          allTags={allTags}
                          selectedTags={editTags}
                          onTagsChange={setEditTags}
                          extraSuggestions={specificViewKeywords}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">核銷後跳轉網址</label>
                        <input
                          type="url"
                          className="w-full p-3 glass-card rounded-xl outline-none text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/30 transition-all"
                          value={editRedeemUrl}
                          onChange={(e) => setEditRedeemUrl(e.target.value)}
                          placeholder="留空則不跳轉"
                          onFocus={(e) => {
                            setTimeout(() => {
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 300);
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {!isEditing && (
                  <div className="flex-1 flex flex-col min-h-0">
                    {!isMomoMode && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center shrink-0"
                      >
                        <div className="flex glass-card p-1 rounded-xl mb-3">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewMode('standard')}
                            className={`relative px-4 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                              viewMode === 'standard' ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          >
                            {viewMode === 'standard' && (
                              <motion.div
                                layoutId="viewModeTab"
                                className="absolute inset-0 bg-card shadow-sm rounded-lg"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                              />
                            )}
                            <span className="relative z-10">條碼</span>
                          </motion.button>
                          {hasAnyImage && (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setViewMode('image');
                                if (ticket.originalImage) setShowFullScreen(true);
                              }}
                              className={`relative px-4 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ${
                                viewMode === 'image' ? 'text-primary' : 'text-muted-foreground'
                              }`}
                            >
                              {viewMode === 'image' && (
                                <motion.div
                                  layoutId="viewModeTab"
                                  className="absolute inset-0 bg-card shadow-sm rounded-lg"
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10 flex items-center gap-1">
                                {ticket.originalImage && <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>}
                                原圖
                              </span>
                            </motion.button>
                          )}
                          {isSpecificView && (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setViewMode('momo')}
                              className={`relative px-4 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                                isMomoMode ? 'text-ticket-momo' : 'text-ticket-momo/60'
                              }`}
                            >
                              {isMomoMode && (
                                <motion.div
                                  layoutId="viewModeTab"
                                  className="absolute inset-0 bg-ticket-momo/20 shadow-sm rounded-lg"
                                  transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10">專屬</span>
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex-1 min-h-0 relative overflow-y-auto no-scrollbar pb-4">
                      <AnimatePresence mode="wait">
                        {viewMode === 'image' ? (
                          <motion.div
                            key="image"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col items-center gap-3 relative group"
                          >
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={onClose}
                              className="absolute top-2 right-2 z-10 w-8 h-8 glass-button text-muted-foreground rounded-full flex items-center justify-center"
                            >
                              <X size={18} />
                            </motion.button>

                            <div
                              className="relative w-full flex-1 min-h-0 flex items-center justify-center cursor-zoom-in group"
                              onClick={() => setShowFullScreen(true)}
                            >
                              <img
                                src={ticket.originalImage || ticket.image}
                                className={`max-h-full w-auto rounded-xl shadow-md border border-border transition-opacity ${
                                  !ticket.originalImage ? 'opacity-70 grayscale-[0.3]' : 'opacity-100'
                                }`}
                                alt=""
                              />

                              {!ticket.originalImage && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/90 backdrop-blur-md text-primary-foreground px-4 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-lg"
                                >
                                  <AlertCircle size={12} /> 預覽模式 (建議上傳原圖)
                                </motion.div>
                              )}
                            </div>

                            {ticket.serial && (
                              <div className="w-full space-y-2 shrink-0 pb-4">
                                <div className="glass-card p-2 rounded-xl">
                                  <BarcodeCanvas text={ticket.serial} format={ticket.barcodeFormat} />
                                </div>
                                <div className="flex justify-center p-2 glass-card rounded-xl shrink-0">
                                  <QRCodeCanvas text={ticket.serial} size={100} />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ) : isMomoMode ? (
                          <motion.div
                            key="momo"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full py-1"
                          >
                            <MomoTemplate ticket={ticket} onContentClick={onClose} />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="standard"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="h-full flex flex-col items-center justify-center gap-5 py-4"
                          >
                            {ticket.serial && (
                              <motion.div
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full glass-card p-3 rounded-xl cursor-pointer"
                              >
                                <BarcodeCanvas text={ticket.serial} format={ticket.barcodeFormat} />
                              </motion.div>
                            )}
                            <motion.div
                              whileTap={{ scale: 0.98 }}
                              onClick={onClose}
                              className="p-4 glass-card rounded-[32px] cursor-pointer"
                            >
                              {ticket.serial ? (
                                <QRCodeCanvas text={ticket.serial} size={180} />
                              ) : (
                                <div className="w-40 h-40 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl font-semibold">
                                  無序號
                                </div>
                              )}
                            </motion.div>
                            <div className="text-center">
                              <span className="text-[11px] font-medium text-muted-foreground block mb-1">電子券號</span>
                              <span className="font-mono text-lg font-bold text-foreground glass-card px-4 py-1 rounded-full">
                                {ticket.serial || 'N/A'}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 shrink-0 flex flex-col gap-2"
                >
                  {isEditing ? (
                    <div className="flex gap-2">
                      <motion.button
                        variants={buttonVariants}
                        whileTap="tap"
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-3 glass-card text-muted-foreground rounded-xl font-semibold text-sm"
                      >
                        取消
                      </motion.button>
                      <motion.button
                        variants={buttonVariants}
                        whileTap="tap"
                        onClick={() => {
                          const name = prompt('請輸入範本名稱');
                          if (name) onSaveTemplate({ 
                            label: name, 
                            productName: editName, 
                            image: editImage, 
                            tags: editTags, 
                            serial: editSerial, 
                            expiry: editExpiry, 
                            redeemUrl: editRedeemUrl 
                          });
                        }}
                        className="px-5 py-3 bg-ticket-success/10 text-ticket-success rounded-xl font-semibold text-sm flex items-center gap-1 hover:bg-ticket-success/20"
                      >
                        <LayoutDashboard size={16} /> 存範本
                      </motion.button>
                      <motion.button
                        variants={buttonVariants}
                        whileTap="tap"
                        onClick={handleSave}
                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow-lg"
                      >
                        儲存變更
                      </motion.button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-1">
                        <motion.button
                          variants={buttonVariants}
                          whileTap="tap"
                          whileHover="hover"
                          onClick={(e) => {
                            e.stopPropagation();
                            const confirmMessage = ticket.isDeleted 
                              ? '確定永久刪除此票券？此操作無法復原。'
                              : '確定刪除此票券並視同核銷通知嗎？';
                            if (window.confirm(confirmMessage)) {
                              onDelete(ticket.id, !ticket.isDeleted, true);
                              onClose();
                            }
                          }}
                          className="flex-1 py-4 text-sm font-semibold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-primary-foreground bg-ticket-warning transition-all"
                        >
                          <Trash2 size={18} /> {ticket.isDeleted ? '永久刪除' : '刪除'}
                        </motion.button>

                        {!ticket.isDeleted && (
                          <motion.button
                            variants={buttonVariants}
                            whileTap="tap"
                            whileHover="hover"
                            onClick={handleToggleCompleteWithAnimation}
                            className="flex-[2] py-4 text-sm font-semibold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-primary-foreground bg-ticket-success transition-all"
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
                          </motion.button>
                        )}
                      </div>

                      <div className="flex gap-2 h-11">
                        {ticket.isDeleted ? (
                          <motion.button
                            variants={buttonVariants}
                            whileTap="tap"
                            onClick={() => {
                              onRestore(ticket);
                              onClose();
                            }}
                            className="flex-1 bg-ticket-success/10 text-ticket-success text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                          >
                            <RefreshCcw size={14} /> 還原
                          </motion.button>
                        ) : (
                          <motion.button
                            variants={buttonVariants}
                            whileTap="tap"
                            onClick={() => setIsEditing(true)}
                            className="flex-1 glass-card text-muted-foreground text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                          >
                            <Pencil size={14} /> 編輯
                          </motion.button>
                        )}
                        <motion.button
                          variants={buttonVariants}
                          whileTap="tap"
                          onClick={onClose}
                          className="flex-1 glass-card text-muted-foreground font-semibold rounded-xl flex items-center justify-center text-xs"
                        >
                          關閉
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullScreen && (ticket.originalImage || ticket.image) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[60] flex flex-col"
            onClick={onClose}
          >
            {/* Close button - top right (closes entire modal) */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg"
            >
              <X size={24} />
            </motion.button>
            
            {/* Image container - click to close entire modal */}
            <div 
              className="flex-1 flex items-center justify-center p-4 pb-32 cursor-pointer"
              onClick={onClose}
            >
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={ticket.originalImage || ticket.image}
                className="max-w-full max-h-full object-contain pointer-events-none"
                alt=""
              />
            </div>
            
            {/* Fixed bottom floating buttons */}
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" as const, stiffness: 300, damping: 25 }}
              className="fixed bottom-0 left-0 right-0 p-4 pb-8 flex gap-3 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Back button - returns to detail view only */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowFullScreen(false)}
                className="flex-1 py-4 rounded-2xl font-semibold text-white bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center gap-2 shadow-lg"
              >
                返回詳情
              </motion.button>
              
              {/* Download button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={handleDownloadOriginal}
                className="w-14 py-4 rounded-2xl font-semibold text-white bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg"
              >
                <Download size={18} />
              </motion.button>
              
              {/* Quick Redeem button - emerald green */}
              {!ticket.isDeleted && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setShowFullScreen(false);
                    setTimeout(() => handleToggleCompleteWithAnimation(), 300);
                  }}
                  className="flex-[2] py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 shadow-lg"
                  style={{ 
                    background: ticket.completed 
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                      : 'linear-gradient(135deg, #10b981, #059669)' 
                  }}
                >
                  {ticket.completed ? (
                    <>
                      <RotateCcw size={18} /> 標記未用
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> 快速核銷
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};