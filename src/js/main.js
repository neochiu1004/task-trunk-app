import { DataService } from './services/dataService.js';
import { Router } from './router.js';
import { TicketsPage } from './pages/ticketsPage.js';
import { AddPage } from './pages/addPage.js';
import { SettingsPage } from './pages/settingsPage.js';
import {
  checkIsExpiringSoon,
  DB_KEYS,
  defaultSettings,
  formatDateTime,
  sendTelegramMessage,
  showToast,
  todayISO,
} from './utils.js';

class TicketTrunkJijunApp {
  constructor() {
    this.dataService = new DataService();
    this.root = document.getElementById('app-container');

    this.state = {
      tasks: [],
      settings: { ...defaultSettings },
      templates: [],
      bgHistory: [],
      expiryNotified: {},
      ui: {
        search: '',
        sort: 'expiring',
        activeTags: [],
        selectionMode: false,
        keepSelectionMode: false,
        selectedIds: new Set(),
        editingTicketId: null,
        editingFromRoute: null,
      },
    };

    this.router = new Router(this);
    this.pages = {
      active: new TicketsPage(this, 'active'),
      completed: new TicketsPage(this, 'completed'),
      deleted: new TicketsPage(this, 'deleted'),
      add: new AddPage(this),
      settings: new SettingsPage(this),
    };
  }

  async init() {
    await this.dataService.init();
    const state = await this.dataService.loadState();
    this.state = {
      ...this.state,
      ...state,
      settings: {
        ...defaultSettings,
        ...(state.settings || {}),
      },
    };

    await this.ensureRequiredKeys();
    await this.sendExpiryReminderIfNeeded();

    this.router.register('active', this.pages.active);
    this.router.register('completed', this.pages.completed);
    this.router.register('deleted', this.pages.deleted);
    this.router.register('add', this.pages.add);
    this.router.register('settings', this.pages.settings);

    this.router.start();
    this.bindGlobalNavEvents();
    showToast('輕鬆票券已就緒', 'success');
  }

  getRoot() {
    return this.root;
  }

  mount(html) {
    this.root.innerHTML = html;
  }

  setActiveNav(route) {
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.page === route);
    });
  }

  bindGlobalNavEvents() {
    const addNav = document.querySelector('.nav-item[data-page="add"]');
    addNav?.addEventListener('click', () => {
      this.state.ui.editingTicketId = null;
      this.state.ui.editingFromRoute = null;
    });
  }

  async ensureRequiredKeys() {
    const keys = await this.dataService.getAllKeys();
    const jobs = [];
    if (!keys.includes(DB_KEYS.TASKS)) jobs.push(this.dataService.setItem(DB_KEYS.TASKS, []));
    if (!keys.includes(DB_KEYS.SETTINGS)) jobs.push(this.dataService.setItem(DB_KEYS.SETTINGS, this.state.settings));
    if (!keys.includes(DB_KEYS.TEMPLATES)) jobs.push(this.dataService.setItem(DB_KEYS.TEMPLATES, this.state.templates));
    if (!keys.includes(DB_KEYS.BG_HISTORY)) jobs.push(this.dataService.setItem(DB_KEYS.BG_HISTORY, this.state.bgHistory));
    if (!keys.includes(DB_KEYS.EXPIRY_NOTIFIED)) jobs.push(this.dataService.setItem(DB_KEYS.EXPIRY_NOTIFIED, this.state.expiryNotified));
    await Promise.all(jobs);
  }

  async persistTasks() {
    await this.dataService.saveState({ tasks: this.state.tasks });
  }

  async persistSettings() {
    await this.dataService.saveState({ settings: this.state.settings });
  }

  async persistTemplates() {
    await this.dataService.saveState({ templates: this.state.templates });
  }

  async sendRedeemNotification(ticket) {
    const { tgToken, tgChatId } = this.state.settings;
    if (!tgToken || !tgChatId) return;
    if (!ticket?.completed) return;

    const text = `✅ *[已核銷]* ${ticket.productName}\n🔢 序號: ${ticket.serial || '無'}\n⏰ 時間: ${formatDateTime(ticket.completedAt || Date.now())}`;
    await sendTelegramMessage(tgToken, tgChatId, text);
  }

  async sendBatchRedeemNotification(tickets) {
    const { tgToken, tgChatId } = this.state.settings;
    if (!tgToken || !tgChatId) return;
    if (!Array.isArray(tickets) || tickets.length === 0) return;

    if (tickets.length === 1) {
      await this.sendRedeemNotification(tickets[0]);
      return;
    }

    const lines = tickets
      .slice(0, 8)
      .map((ticket) => `• ${ticket.productName} (${ticket.serial || '無序號'})`)
      .join('\n');
    const tail = tickets.length > 8 ? `\n…其餘 ${tickets.length - 8} 張略` : '';
    const text = `✅ *[批次核銷]* 共 ${tickets.length} 張票券\n${lines}${tail}`;
    await sendTelegramMessage(tgToken, tgChatId, text);
  }

  async sendExpiryReminderIfNeeded() {
    const { tgToken, tgChatId, notifyDays } = this.state.settings;
    if (!tgToken || !tgChatId) return;

    const today = todayISO();
    const expiring = this.state.tasks.filter(
      (t) => !t.completed && !t.isDeleted && t.expiry && checkIsExpiringSoon(t.expiry, notifyDays) && this.state.expiryNotified[t.id] !== today
    );

    if (!expiring.length) return;

    const lines = expiring
      .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1))
      .map((t) => `• ${t.pinned ? '📌 ' : ''}${t.productName}（${t.expiry}）`)
      .join('\n');

    const pinnedCount = expiring.filter((x) => x.pinned).length;
    const text = `⏰ *[到期提醒]* 共 ${expiring.length} 張快到期${pinnedCount ? `（含 ${pinnedCount} 張優先）` : ''}：\n${lines}`;

    const result = await sendTelegramMessage(tgToken, tgChatId, text);
    if (!result.success) return;

    expiring.forEach((ticket) => {
      this.state.expiryNotified[ticket.id] = today;
    });

    const validIds = new Set(this.state.tasks.map((t) => t.id));
    Object.keys(this.state.expiryNotified).forEach((id) => {
      if (!validIds.has(id)) delete this.state.expiryNotified[id];
    });

    await this.dataService.saveState({ expiryNotified: this.state.expiryNotified });
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const app = new TicketTrunkJijunApp();
  window.app = app;
  try {
    await app.init();
  } catch (error) {
    console.error(error);
    showToast(`啟動失敗：${error.message}`, 'error');
    document.getElementById('app-container').innerHTML = `
      <div class="p-6 text-center">
        <h1 class="text-xl font-bold text-red-700 mb-2">啟動失敗</h1>
        <p class="text-sm text-slate-600">${error.message}</p>
      </div>
    `;
  }
});
