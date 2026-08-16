import React, { useMemo, useState } from 'react';
import { FileJson, Loader2 } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ImageUpload } from '@/components/ui/image-upload';
import { generateId } from '@/lib/helpers';
import { renderBatchTicketImage } from '@/lib/batchTicketImage';
import { validateBatchTicketData } from '@/lib/validation';
import type { BatchTicketInput } from '@/types/app';
import type { Ticket } from '@/types/ticket';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTickets: Ticket[];
  onAddBatch: (tickets: Ticket[]) => void;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({ isOpen, onClose, existingTickets, onAddBatch }) => {
  const [jsonText, setJsonText] = useState('');
  const [templateImage, setTemplateImage] = useState('');
  const [rows, setRows] = useState<BatchTicketInput[] | null>(null);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ added: number; duplicates: number } | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState('');

  const existingSerials = useMemo(() => new Set(existingTickets.filter(t => !t.isDeleted && t.serial).map(t => t.serial)), [existingTickets]);

  const parseJson = (value = jsonText) => {
    try {
      const parsed = JSON.parse(value);
      const validation = validateBatchTicketData(parsed);
      if (!validation.success) {
        setRows(null);
        setError(validation.error);
        return;
      }
      setRows(validation.data);
      setError('');
    } catch {
      setRows(null);
      setError('JSON 格式錯誤，請確認內容可以被解析。');
    }
  };

  const handleGenerate = async () => {
    // Parse the current textarea value again so paste-and-submit always uses the latest text.
    parseJson();
    let currentRows = rows;
    try {
      const validation = validateBatchTicketData(JSON.parse(jsonText));
      if (validation.success) currentRows = validation.data;
    } catch {
      currentRows = null;
    }
    if (!currentRows?.length) return setError('請先輸入有效的 JSON 資料。');
    if (!templateImage) return setError('請先上傳票券版型圖片。');
    setIsGenerating(true);
    setError('');
    try {
      const batchTickets: Ticket[] = [];
      let duplicates = 0;
      const seenInBatch = new Set<string>();
      for (const row of currentRows) {
        if (existingSerials.has(row.ticketNumber) || seenInBatch.has(row.ticketNumber)) duplicates += 1;
        seenInBatch.add(row.ticketNumber);
        const renderedImage = await renderBatchTicketImage(templateImage, row.productName, row.ticketNumber, row.expiryDate);
        batchTickets.push({
          id: generateId(),
          productName: row.productName,
          serial: row.ticketNumber,
          expiry: row.expiryDate?.replace(/-/g, '/').replace(/\./g, '/') || '',
          image: renderedImage,
          originalImage: templateImage,
          images: [renderedImage],
          tags: ['批量生成', ...(row.buyer ? [row.buyer] : [])],
          barcodeFormat: 'QR_CODE',
          completed: false,
          isDeleted: false,
          createdAt: Date.now(),
        });
      }
      onAddBatch(batchTickets);
      setGeneratedPreview(batchTickets[0]?.image || '');
      setResult({ added: batchTickets.length, duplicates });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : '產生票券圖片失敗。');
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setJsonText(''); setTemplateImage(''); setRows(null); setError(''); setResult(null); setGeneratedPreview('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={handleClose} title="批量新增票券" description="貼上 JSON，再用一張圖片產生多張票券">
      <div className="space-y-4 pb-4">
        {result ? (
          <div className="rounded-2xl bg-ticket-success/10 border border-ticket-success/30 p-4 text-sm font-semibold text-ticket-success space-y-3">
            <div>已新增 {result.added} 張票券；偵測到 {result.duplicates} 張重複序號。所有票券已加入「批量生成」標籤。</div>
            {generatedPreview && (
              <div className="rounded-xl overflow-hidden border border-ticket-success/30 bg-white">
                <img src={generatedPreview} alt="第一張批量產生的票券預覽" className="w-full max-h-80 object-contain" />
              </div>
            )}
          </div>
        ) : null}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold">JSON 資料</label>
            <span className="text-[11px] text-muted-foreground">僅限貼上文字</span>
          </div>
          <textarea
            value={jsonText}
            onChange={(event) => { const value = event.target.value; setJsonText(value); setResult(null); if (value.trim()) parseJson(value); else { setRows(null); setError(''); } }}
            placeholder={'[{"ticketNumber":"E123","expiryDate":"2027/02/12","productName":"票券名稱","buyer":"持有人"}]'}
            className="w-full min-h-40 rounded-2xl border border-border bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileJson size={14} /> {rows ? `已解析 ${rows.length} 筆，可直接確認新增` : '請直接貼上 JSON 陣列內容'}
          </div>
        </div>
        <div>
          <div className="text-sm font-bold mb-2">票券版型圖片</div>
          <ImageUpload value={templateImage} onChange={setTemplateImage} onClear={() => setTemplateImage('')} type="original" label="上傳版型圖片" className="max-w-[180px]" />
          <p className="mt-2 text-[11px] text-muted-foreground">第一版依照目前提供的票券截圖版型覆蓋名稱、QR code、序號與期限。</p>
        </div>
        {error && <div className="rounded-2xl bg-ticket-warning/10 border border-ticket-warning/30 p-3 text-xs font-semibold text-ticket-warning">{error}</div>}
        {rows && rows.length > 0 && (
          <div className="rounded-2xl bg-muted p-3 text-xs font-semibold text-muted-foreground">
            預計新增 {rows.length} 張；其中 {rows.filter(row => existingSerials.has(row.ticketNumber)).length} 張與既有票券序號相同，仍會照常新增並自動標示重複。
          </div>
        )}
        {result ? (
          <button type="button" onClick={handleClose} className="w-full rounded-2xl bg-primary py-3.5 text-primary-foreground font-bold">完成</button>
        ) : (
          <button type="button" disabled={isGenerating} onClick={handleGenerate} className="w-full rounded-2xl bg-primary py-3.5 text-primary-foreground font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {isGenerating ? <><Loader2 size={17} className="animate-spin" />產生中...</> : '確認批量新增'}
          </button>
        )}
      </div>
    </ResponsiveModal>
  );
};
