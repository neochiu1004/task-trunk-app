import {
  BARCODE_FORMATS,
  compressImage,
  escapeHtml,
  generateId,
  parseTags,
  showToast,
  tagsToText,
  normalizeDateInput,
} from '../utils.js';
import { BATCH_IMAGE_VERSION, renderBatchTicketImage } from '../services/batchImportService.js';

let barcodeServicePromise = null;

async function getBarcodeScanner() {
  barcodeServicePromise ||= import('../services/barcodeService.js');
  return barcodeServicePromise;
}

export class AddPage {
  constructor(app) {
    this.app = app;
  }

  toDateInputValue(value) {
    const normalized = normalizeDateInput(value || '').trim();
    if (!normalized) return '';
    const [year, month, day] = normalized.split('/');
    if (!year || !month || !day) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  getDefaultExpiryAfterMonths(months = 6) {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const day = now.getDate();

    const targetMonthTotal = monthIndex + months;
    const targetYear = year + Math.floor(targetMonthTotal / 12);
    const targetMonth = targetMonthTotal % 12;
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const targetDay = Math.min(day, lastDayOfTargetMonth);

    const mm = String(targetMonth + 1).padStart(2, '0');
    const dd = String(targetDay).padStart(2, '0');
    return `${targetYear}/${mm}/${dd}`;
  }

  getEditingTicket() {
    const id = this.app.state.ui.editingTicketId;
    if (!id) return null;
    return this.app.state.tasks.find((t) => t.id === id) || null;
  }

  buildTemplateOptions(selectedTemplateId = '') {
    const options = this.app.state.templates || [];
    const hasSelectedTemplate = options.some((tpl) => tpl.id === selectedTemplateId);
    return [
      `<option value="" ${!hasSelectedTemplate ? 'selected' : ''}>不套用範本</option>`,
      ...options.map((tpl) => `<option value="${tpl.id}" ${tpl.id === selectedTemplateId ? 'selected' : ''}>${escapeHtml(tpl.label || tpl.productName || '未命名範本')}</option>`),
    ]
      .join('');
  }

  buildBarcodeFormatOptions(selected = '') {
    return BARCODE_FORMATS.map((item) => `
      <option value="${item.value}" ${item.value === selected ? 'selected' : ''}>${item.label}</option>
    `).join('');
  }

  pickBarcodeResult(results) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4';
      modal.innerHTML = `
        <div class="w-full max-w-md bg-white rounded-2xl border border-wabi-border shadow-2xl p-4">
          <h3 class="text-lg font-semibold text-wabi-primary mb-1">選擇條碼</h3>
          <p class="text-sm text-wabi-text-secondary mb-3">偵測到 ${results.length} 個結果，請選擇要帶入的序號</p>
          <div class="space-y-2 max-h-72 overflow-auto">
            ${results.map((result, index) => `
              <button type="button" data-pick-barcode="${index}" class="w-full text-left px-3 py-2 rounded-lg border border-wabi-border hover:bg-wabi-primary/5">
                <p class="text-sm font-medium break-all">${escapeHtml(result.content)}</p>
                <p class="text-xs text-wabi-text-secondary mt-1">${escapeHtml(result.format || 'UNKNOWN')}</p>
              </button>
            `).join('')}
          </div>
          <div class="flex justify-end mt-3">
            <button type="button" data-cancel-barcode class="px-4 py-2 rounded-lg border border-wabi-border text-sm">取消</button>
          </div>
        </div>
      `;

      const cleanup = (picked) => {
        modal.remove();
        resolve(picked || null);
      };

      modal.addEventListener('click', (event) => {
        if (event.target === modal) cleanup(null);
      });

      modal.querySelector('[data-cancel-barcode]')?.addEventListener('click', () => cleanup(null));
      modal.querySelectorAll('[data-pick-barcode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const index = Number(btn.dataset.pickBarcode);
          cleanup(results[index]);
        });
      });

      document.body.appendChild(modal);
    });
  }

  async render() {
    const editing = this.getEditingTicket();
    const defaultExpiry = this.getDefaultExpiryAfterMonths(6);
    const defaultExpiryInputValue = this.toDateInputValue(editing?.expiry || defaultExpiry);
    const quickTags = (this.app.state.settings.quickTags || []).filter(Boolean);
    const selectedQuickTagSet = new Set(editing?.tags || []);
    const selectableTags = [...new Set([...quickTags, ...(editing?.tags || [])])];
    if (!editing && this.app.state.ui.editingTicketId) {
      this.app.state.ui.editingTicketId = null;
      this.app.state.ui.editingFromRoute = null;
    }
    const backRoute = editing ? (this.app.state.ui.editingFromRoute || 'active') : 'active';
    const routeLabel = backRoute === 'completed' ? '已使用' : backRoute === 'deleted' ? '回收桶' : '待使用';
    const defaultTemplateId = editing ? '' : this.app.state.settings.defaultTemplateId || '';
    const defaultTemplate = defaultTemplateId
      ? this.app.state.templates.find((tpl) => tpl.id === defaultTemplateId)
      : null;
    const defaultTemplateLabel = defaultTemplate?.label || defaultTemplate?.productName || '';

    this.app.mount(`
      <section class="page active p-4 pb-24 md:pb-8 max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-wabi-primary">${editing ? '編輯票券' : '新增票券'}</h1>
            ${editing ? `<p class="text-xs text-wabi-text-secondary mt-1">來源視圖：${routeLabel}</p>` : ''}
          </div>
          <a id="add-back-link" href="#${backRoute}" class="px-3 py-2 rounded-lg bg-white border border-wabi-border text-sm">${editing ? '返回來源' : '返回'}</a>
        </div>

        <form id="ticket-form" class="space-y-4 bg-white border border-wabi-border rounded-2xl p-4">
          <div>
            <label class="block text-sm text-wabi-text-secondary mb-1">範本快速套用</label>
            <select id="template-id" class="w-full rounded-lg border border-wabi-border px-3 py-2 bg-white">${this.buildTemplateOptions(defaultTemplateId)}</select>
            <p class="mt-1 text-[11px] text-wabi-text-secondary">
              ${editing
                ? '編輯票券時不會自動套用預設範本。'
                : defaultTemplateLabel
                  ? `目前預設：${escapeHtml(defaultTemplateLabel)}。手動改選後會記住新的預設。`
                  : '手動選擇範本後會記住為下次新增的預設。'
              }
            </p>
          </div>

          <div>
            <label class="block text-sm text-wabi-text-secondary mb-1">票券名稱 *</label>
            <input id="product-name" required class="w-full rounded-lg border border-wabi-border px-3 py-2" value="${escapeHtml(editing?.productName || '')}" />
          </div>

          <div class="space-y-3 rounded-2xl border border-wabi-border/70 bg-wabi-bg/40 p-3">
            <div>
              <label class="block text-sm text-wabi-text-secondary mb-1">縮圖模式（主頁卡片）</label>
              <input id="thumb-image-file" type="file" accept="image/*" class="w-full rounded-lg border border-wabi-border px-3 py-2 bg-white" />
              <div id="thumb-image-preview-wrap" class="mt-2 ${editing?.image ? '' : 'hidden'}">
                <img id="thumb-image-preview" src="${escapeHtml(editing?.image || '')}" class="w-full max-h-40 object-cover rounded-xl border border-wabi-border" />
                <button id="thumb-image-clear-btn" type="button" class="mt-2 px-3 py-1.5 rounded-lg border border-wabi-border text-xs">清除縮圖</button>
              </div>
            </div>

            <div>
              <label class="block text-sm text-wabi-text-secondary mb-1">原圖模式（核銷畫面）</label>
              <input id="original-image-file" type="file" accept="image/*" class="w-full rounded-lg border border-wabi-border px-3 py-2 bg-white" />
              <div id="original-image-preview-wrap" class="mt-2 ${editing?.originalImage ? '' : 'hidden'}">
                <img id="original-image-preview" src="${escapeHtml(editing?.originalImage || '')}" class="w-full max-h-56 object-contain rounded-xl border border-wabi-border bg-slate-50" />
                <button id="original-image-clear-btn" type="button" class="mt-2 px-3 py-1.5 rounded-lg border border-wabi-border text-xs">清除原圖</button>
              </div>
            </div>
            ${editing?.tags?.includes('批量生成') ? `
              <div>
                <label class="block text-sm text-wabi-text-secondary mb-1">名稱上方商品圖（兌換圖片）</label>
                <input id="batch-product-image-file" type="file" accept="image/*" class="w-full rounded-lg border border-wabi-border px-3 py-2 bg-white" />
                <div id="batch-product-image-preview-wrap" class="mt-2 ${editing?.batchProductImage ? '' : 'hidden'}">
                  <img id="batch-product-image-preview" src="${escapeHtml(editing?.batchProductImage || '')}" class="w-full max-h-40 object-contain rounded-xl border border-wabi-border bg-slate-50" alt="商品圖預覽" />
                  <button id="batch-product-image-clear-btn" type="button" class="mt-2 px-3 py-1.5 rounded-lg border border-wabi-border text-xs">清除自訂商品圖</button>
                </div>
              </div>
              <p class="text-xs text-purple-700 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2">
                這是批量生成票券。可替換名稱上方商品圖；修改圖片、名稱、序號或到期日並儲存後，系統會重新產生兌換圖片。
              </p>
            ` : ''}
          </div>

          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-wabi-text-secondary mb-1">序號</label>
              <input id="serial" class="w-full rounded-lg border border-wabi-border px-3 py-2" value="${escapeHtml(editing?.serial || '')}" />
              <p id="serial-duplicate-warning" class="hidden text-xs text-amber-700 mt-1">此序號已存在於其他待用/已用票券</p>
            </div>
            <div>
              <label class="block text-sm text-wabi-text-secondary mb-1">到期日</label>
              <input id="expiry" type="date" class="w-full rounded-lg border border-wabi-border px-3 py-2 bg-white" value="${escapeHtml(defaultExpiryInputValue)}" />
            </div>
          </div>

          <div>
            <label class="block text-sm text-wabi-text-secondary mb-1">條碼格式</label>
            <select id="barcode-format" class="w-full rounded-lg border border-wabi-border px-3 py-2 bg-white">
              ${this.buildBarcodeFormatOptions(editing?.barcodeFormat || '')}
            </select>
          </div>

          <div>
            <label class="block text-sm text-wabi-text-secondary mb-1">兌換網址</label>
            <input id="redeem-url" class="w-full rounded-lg border border-wabi-border px-3 py-2" value="${escapeHtml(editing?.redeemUrl || '')}" />
            <select id="redeem-url-preset" class="mt-2 w-full rounded-lg border border-wabi-border px-3 py-2 bg-white">
              <option value="">套用兌換網址預設</option>
              ${(this.app.state.settings.redeemUrlPresets || []).map((preset) => `<option value="${preset.id}">${escapeHtml(preset.label)}</option>`).join('')}
            </select>
          </div>

          <div class="rounded-lg border border-wabi-border/70 p-3">
            <label class="inline-flex items-center gap-2 text-sm font-medium text-wabi-primary">
              <input id="ticket-pinned" type="checkbox" ${editing?.pinned ? 'checked' : ''} />
              設為置頂票券
            </label>
            <p class="text-xs text-wabi-text-secondary mt-1">置頂票券會優先顯示在主頁前面。</p>
          </div>

          <div>
            <label class="block text-sm text-wabi-text-secondary mb-1">標籤（預設快速選取）</label>
            <input id="tags" type="hidden" value="${escapeHtml(tagsToText(editing?.tags || []))}" />
            ${selectableTags.length ? `
              <div class="mt-2 flex flex-wrap gap-2">
                ${selectableTags.map((tag) => `
                  <button type="button" data-quick-tag="${escapeHtml(tag)}" class="px-2.5 py-1 rounded-full text-xs border ${selectedQuickTagSet.has(tag) ? 'bg-wabi-primary text-white border-wabi-primary' : 'bg-white border-wabi-border text-wabi-primary'}">#${escapeHtml(tag)}</button>
                `).join('')}
              </div>
            ` : '<p class="text-xs text-wabi-text-secondary">尚未設定預設標籤，請先到「設定」填寫快速標籤。</p>'}
            <p id="selected-tags-preview" class="mt-2 text-xs text-wabi-text-secondary"></p>
          </div>

          <div class="ticket-form-actions -mx-2 mt-2 rounded-2xl border border-wabi-border bg-white/95 p-2 shadow-lg backdrop-blur">
            <div class="grid grid-cols-2 gap-2">
              <button id="scan-barcode-btn" type="button" class="min-h-11 rounded-xl bg-wabi-primary/10 px-3 py-2 text-sm font-semibold text-wabi-primary">從原圖讀取條碼</button>
              <button id="save-template-btn" type="button" class="min-h-11 rounded-xl bg-wabi-accent/40 px-3 py-2 text-sm font-semibold text-wabi-primary">儲存為範本</button>
            </div>
            <div class="mt-2 grid grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] gap-2">
              <a id="add-cancel-link" href="#${backRoute}" class="flex min-h-12 items-center justify-center rounded-xl border border-wabi-border px-3 py-2 text-sm font-semibold text-wabi-primary">${editing ? '放棄變更' : '取消'}</a>
              <button class="min-h-12 rounded-xl bg-wabi-primary px-3 py-2 text-sm font-semibold text-white">${editing ? '儲存變更' : '新增票券'}</button>
            </div>
          </div>
        </form>
      </section>
    `);

    this.bindEvents(editing);
  }

  bindEvents(editing) {
    const defaultExpiry = this.getDefaultExpiryAfterMonths(6);
    const root = this.app.getRoot();
    const form = root.querySelector('#ticket-form');
    const thumbImageInput = root.querySelector('#thumb-image-file');
    const thumbImagePreview = root.querySelector('#thumb-image-preview');
    const thumbImageWrap = root.querySelector('#thumb-image-preview-wrap');
    const originalImageInput = root.querySelector('#original-image-file');
    const originalImagePreview = root.querySelector('#original-image-preview');
    const originalImageWrap = root.querySelector('#original-image-preview-wrap');
    const serialInput = root.querySelector('#serial');
    const duplicateWarning = root.querySelector('#serial-duplicate-warning');
    const tagsInput = root.querySelector('#tags');
    const selectedTagsPreview = root.querySelector('#selected-tags-preview');

    let imageData = editing?.image || '';
    let originalImage = editing?.originalImage || '';
    let batchProductImage = editing?.batchProductImage || '';

    const isDuplicateSerial = (serial) => this.app.state.tasks.some((ticket) => {
        if (ticket.isDeleted) return false;
        if (editing && ticket.id === editing.id) return false;
        return (ticket.serial || '').trim() === serial;
      });

    const updateDuplicateSerialHint = () => {
      const serial = (serialInput?.value || '').trim();
      if (!serial) {
        duplicateWarning?.classList.add('hidden');
        return;
      }
      const duplicated = isDuplicateSerial(serial);
      duplicateWarning?.classList.toggle('hidden', !duplicated);
    };

    const syncQuickTagState = () => {
      const selectedTags = new Set(parseTags(tagsInput?.value || ''));
      root.querySelectorAll('[data-quick-tag]').forEach((btn) => {
        const tag = btn.dataset.quickTag;
        if (!tag) return;
        const active = selectedTags.has(tag);
        btn.classList.toggle('bg-wabi-primary', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('border-wabi-primary', active);
        btn.classList.toggle('bg-white', !active);
        btn.classList.toggle('border-wabi-border', !active);
        btn.classList.toggle('text-wabi-primary', !active);
      });
      if (selectedTagsPreview) {
        const selected = [...selectedTags];
        selectedTagsPreview.textContent = selected.length ? `已選標籤：${selected.map((tag) => `#${tag}`).join('、')}` : '尚未選擇標籤';
      }
    };

    const applyBarcodeResult = (selected) => {
      if (!selected || !serialInput) return;
      serialInput.value = selected.content;
      const barcodeFormatSelect = root.querySelector('#barcode-format');
      if (barcodeFormatSelect) barcodeFormatSelect.value = selected.format || '';
      updateDuplicateSerialHint();
      showToast('已帶入條碼序號', 'success');
    };

    const scanAndApplyBarcode = async (scanSource, { allowPick = false } = {}) => {
      if (!scanSource) return false;
      showToast('正在辨識條碼...');
      const { scanMultipleBarcodesFromImage } = await getBarcodeScanner();
      const preferredFormat = root.querySelector('#barcode-format')?.value || '';
      const results = await scanMultipleBarcodesFromImage(scanSource, { preferredFormat });
      if (!results.length) {
        showToast('未找到條碼', 'error');
        return false;
      }

      let selected = results[0];
      if (allowPick && results.length > 1) {
        const picked = await this.pickBarcodeResult(results);
        if (!picked) return false;
        selected = picked;
      }

      applyBarcodeResult(selected);
      return true;
    };

    const applyTemplate = (template, { showAppliedToast = true } = {}) => {
      if (!template) return;

      root.querySelector('#product-name').value = template.productName || '';
      root.querySelector('#serial').value = template.serial || '';
      root.querySelector('#expiry').value = this.toDateInputValue(template.expiry || defaultExpiry);
      root.querySelector('#tags').value = tagsToText(template.tags || []);
      root.querySelector('#barcode-format').value = template.barcodeFormat || '';
      updateDuplicateSerialHint();
      syncQuickTagState();
      if (template.image) {
        imageData = template.image;
        if (thumbImagePreview) thumbImagePreview.src = template.image;
        thumbImageWrap?.classList.remove('hidden');
      }
      if (template.redeemUrlPresetId) {
        root.querySelector('#redeem-url-preset').value = template.redeemUrlPresetId;
        const preset = (this.app.state.settings.redeemUrlPresets || []).find((p) => p.id === template.redeemUrlPresetId);
        if (preset) root.querySelector('#redeem-url').value = preset.url || '';
      } else {
        root.querySelector('#redeem-url-preset').value = '';
      }
      if (showAppliedToast) showToast('已套用範本', 'success');
    };

    root.querySelector('#template-id')?.addEventListener('change', async (event) => {
      const id = event.target.value;
      this.app.state.settings = {
        ...this.app.state.settings,
        defaultTemplateId: id,
      };
      await this.app.persistSettings();

      if (!id) {
        showToast('已改為不套用預設範本', 'success');
        return;
      }

      const tpl = this.app.state.templates.find((t) => t.id === id);
      if (!tpl) {
        showToast('找不到此範本，已取消預設', 'error');
        return;
      }

      applyTemplate(tpl);
    });

    const savedDefaultTemplateId = editing ? '' : this.app.state.settings.defaultTemplateId || '';
    const savedDefaultTemplate = savedDefaultTemplateId
      ? this.app.state.templates.find((tpl) => tpl.id === savedDefaultTemplateId)
      : null;
    if (savedDefaultTemplate) {
      root.querySelector('#template-id').value = savedDefaultTemplate.id;
      applyTemplate(savedDefaultTemplate, { showAppliedToast: false });
    } else if (savedDefaultTemplateId) {
      this.app.state.settings = {
        ...this.app.state.settings,
        defaultTemplateId: '',
      };
      this.app.persistSettings();
    }

    root.querySelector('#redeem-url-preset')?.addEventListener('change', (event) => {
      const presetId = event.target.value;
      if (!presetId) return;
      const preset = (this.app.state.settings.redeemUrlPresets || []).find((p) => p.id === presetId);
      if (!preset) return;
      root.querySelector('#redeem-url').value = preset.url || '';
      showToast(`已套用預設網址：${preset.label}`, 'success');
    });

    root.querySelectorAll('[data-quick-tag]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.quickTag;
        if (!tag) return;
        const tags = new Set(parseTags(tagsInput?.value || ''));
        if (tags.has(tag)) tags.delete(tag);
        else tags.add(tag);
        if (tagsInput) {
          tagsInput.value = tagsToText([...tags]);
        }
        syncQuickTagState();
      });
    });

    thumbImageInput?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        imageData = await compressImage(file, 'thumbnail');
        if (thumbImagePreview) thumbImagePreview.src = imageData;
        thumbImageWrap?.classList.remove('hidden');
      } catch (error) {
        showToast(`圖片處理失敗：${error.message}`, 'error');
      }
    });

    originalImageInput?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        originalImage = await compressImage(file, 'original');
        if (originalImagePreview) originalImagePreview.src = originalImage;
        originalImageWrap?.classList.remove('hidden');
        await scanAndApplyBarcode(originalImage);
      } catch (error) {
        showToast(`原圖處理失敗：${error.message}`, 'error');
      }
    });

    const batchProductImageInput = root.querySelector('#batch-product-image-file');
    const batchProductImagePreview = root.querySelector('#batch-product-image-preview');
    const batchProductImageWrap = root.querySelector('#batch-product-image-preview-wrap');
    batchProductImageInput?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        batchProductImage = await compressImage(file, 'original');
        if (batchProductImagePreview) batchProductImagePreview.src = batchProductImage;
        batchProductImageWrap?.classList.remove('hidden');
        showToast('商品圖已載入，儲存後會替換名稱上方圖案', 'success');
      } catch (error) {
        showToast(`商品圖處理失敗：${error.message}`, 'error');
      } finally {
        event.target.value = '';
      }
    });

    root.querySelector('#batch-product-image-clear-btn')?.addEventListener('click', () => {
      batchProductImage = '';
      if (batchProductImageInput) batchProductImageInput.value = '';
      if (batchProductImagePreview) batchProductImagePreview.src = '';
      batchProductImageWrap?.classList.add('hidden');
      showToast('已清除自訂商品圖，會恢復版型原圖', 'success');
    });

    root.querySelector('#thumb-image-clear-btn')?.addEventListener('click', () => {
      imageData = '';
      if (thumbImageInput) thumbImageInput.value = '';
      if (thumbImagePreview) thumbImagePreview.src = '';
      thumbImageWrap?.classList.add('hidden');
      showToast('已清除縮圖', 'success');
    });

    root.querySelector('#original-image-clear-btn')?.addEventListener('click', () => {
      originalImage = '';
      if (originalImageInput) originalImageInput.value = '';
      if (originalImagePreview) originalImagePreview.src = '';
      originalImageWrap?.classList.add('hidden');
      showToast('已清除原圖', 'success');
    });

    root.querySelector('#scan-barcode-btn')?.addEventListener('click', async () => {
      if (!originalImage && !imageData) {
        showToast('請先選擇原圖或縮圖', 'error');
        return;
      }

      const scanSource = originalImage || imageData;
      await scanAndApplyBarcode(scanSource, { allowPick: true });
    });

    root.querySelector('#save-template-btn')?.addEventListener('click', async () => {
      const productName = root.querySelector('#product-name').value.trim();
      if (!productName) {
        showToast('請先輸入票券名稱', 'error');
        return;
      }

      const label = window.prompt('範本名稱', `${productName} 範本`);
      if (!label) return;
      const normalizedLabel = label.trim();
      if (!normalizedLabel) {
        showToast('範本名稱不可為空', 'error');
        return;
      }
      const existed = this.app.state.templates.some((tpl) => (tpl.label || '').trim().toLowerCase() === normalizedLabel.toLowerCase());
      if (existed) {
        showToast('已有相同名稱範本', 'error');
        return;
      }

      const template = {
        id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        label: normalizedLabel,
        productName,
        expiry: normalizeDateInput(root.querySelector('#expiry').value.trim()),
        tags: parseTags(root.querySelector('#tags').value),
        image: imageData,
        barcodeFormat: root.querySelector('#barcode-format').value || '',
        redeemUrlPresetId: root.querySelector('#redeem-url-preset').value || '',
      };

      this.app.state.templates = [template, ...this.app.state.templates];
      await this.app.persistTemplates();
      showToast('已儲存範本', 'success');
      this.render();
    });

    const clearEditingContext = () => {
      this.app.state.ui.editingTicketId = null;
      this.app.state.ui.editingFromRoute = null;
    };
    root.querySelector('#add-back-link')?.addEventListener('click', clearEditingContext);
    root.querySelector('#add-cancel-link')?.addEventListener('click', clearEditingContext);

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();

      const productName = root.querySelector('#product-name').value.trim();
      const redeemUrl = root.querySelector('#redeem-url').value.trim();

      if (!productName) {
        showToast('票券名稱必填', 'error');
        return;
      }

      const serial = root.querySelector('#serial').value.trim();
      const expiry = normalizeDateInput(root.querySelector('#expiry').value.trim());
      if (serial && isDuplicateSerial(serial)) {
        const ok = window.confirm('此序號已存在於其他票券，仍要繼續儲存嗎？');
        if (!ok) return;
      }

      if (editing?.tags?.includes('批量生成')) {
        try {
          imageData = await renderBatchTicketImage(undefined, productName, serial, expiry, batchProductImage);
        } catch (error) {
          showToast(`兌換圖片重新產生失敗：${error.message}`, 'error');
          return;
        }
      }

      const payload = {
        id: editing?.id || generateId(),
        productName,
        serial,
        expiry,
        image: imageData,
        originalImage,
        images: imageData ? [imageData] : (editing?.images || []),
        batchProductImage: editing?.tags?.includes('批量生成') ? batchProductImage : (editing?.batchProductImage || ''),
        batchImageVersion: editing?.tags?.includes('批量生成') ? BATCH_IMAGE_VERSION : (editing?.batchImageVersion || 0),
        tags: parseTags(root.querySelector('#tags').value),
        note: editing?.note || '',
        barcodeFormat: root.querySelector('#barcode-format').value || '',
        completed: editing?.completed || false,
        completedAt: editing?.completedAt,
        isDeleted: editing?.isDeleted || false,
        deletedAt: editing?.deletedAt,
        createdAt: editing?.createdAt || Date.now(),
        redeemUrl,
        pinned: !!root.querySelector('#ticket-pinned')?.checked,
      };

      if (editing) {
        this.app.state.tasks = this.app.state.tasks.map((item) => item.id === editing.id ? payload : item);
      } else {
        this.app.state.tasks = [payload, ...this.app.state.tasks];
      }

      await this.app.persistTasks();
      this.app.state.ui.editingTicketId = null;
      const nextRoute = editing ? (this.app.state.ui.editingFromRoute || 'active') : 'active';
      const nextRouteLabel = nextRoute === 'completed' ? '已使用' : nextRoute === 'deleted' ? '回收桶' : '待使用';
      this.app.state.ui.editingFromRoute = null;
      showToast(editing ? `票券已更新，已返回${nextRouteLabel}` : '票券已新增', 'success');
      window.location.hash = nextRoute;
    });

    serialInput?.addEventListener('input', updateDuplicateSerialHint);
    updateDuplicateSerialHint();
    syncQuickTagState();
  }
}
