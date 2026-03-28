export class Router {
  constructor(app) {
    this.app = app;
    this.routes = new Map();
    this.currentHash = null;
  }

  register(hash, page) {
    this.routes.set(hash, page);
  }

  start() {
    window.addEventListener('hashchange', () => this.renderRoute());
    this.renderRoute();
  }

  getCurrentHash() {
    const hash = (window.location.hash || '#active').replace(/^#/, '');
    if (hash === 'home') return 'active';
    return hash;
  }

  async renderRoute() {
    const route = this.getCurrentHash();
    if (!this.routes.has(route)) {
      window.location.hash = 'active';
      return;
    }

    if (this.currentHash === 'add' && route !== 'add' && this.app?.state?.ui) {
      this.app.state.ui.editingTicketId = null;
      this.app.state.ui.editingFromRoute = null;
    }

    this.currentHash = route;
    this.app.setActiveNav(route);

    const page = this.routes.get(route);
    await page.render();
  }
}
