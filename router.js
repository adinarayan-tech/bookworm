/* ============================================
   BookWorm — SPA Router
   Hash-based routing (no server required)
   Async-aware for Supabase data fetching
   ============================================ */

const Router = {
  _routes: {},
  _current: '',

  init() {
    // Register routes (all return promises now)
    this._routes = {
      '': () => Pages.home(),
      'catalog': () => Pages.catalog(),
      'book': (params) => Pages.bookDetail(params.id),
      'cart': () => Pages.cart(),
      'orders': () => Pages.orders(),
      'login': () => Pages.login(),
      'admin': () => Pages.adminDashboard(),
      'admin/inventory': () => Pages.adminInventory(),
      'admin/orders': () => Pages.adminOrders()
    };

    window.addEventListener('hashchange', () => this._handleRoute());
    this._handleRoute();
  },

  navigate(path) {
    window.location.hash = '#/' + path;
  },

  async _handleRoute() {
    const hash = window.location.hash.slice(2) || ''; // remove #/
    const [path, queryStr] = hash.split('?');
    const params = {};

    // Parse query params
    if (queryStr) {
      queryStr.split('&').forEach(p => {
        const [k, v] = p.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }

    // Check auth for protected routes
    if (path.startsWith('admin') && !Auth.isAdmin) {
      this.navigate('login');
      return;
    }
    if ((path === 'cart' || path === 'orders') && !Auth.isLoggedIn) {
      this.navigate('login');
      return;
    }

    // Find matching route
    const routeKey = Object.keys(this._routes).find(r => {
      if (r === path) return true;
      // Handle dynamic routes like 'book' matching 'book?id=xxx'
      if (r === path.split('/')[0] && params.id) return true;
      return false;
    });

    const pageContent = document.getElementById('page-content');
    if (!pageContent) return;

    if (routeKey !== undefined && this._routes[routeKey]) {
      this._current = path;
      pageContent.innerHTML = '';
      pageContent.className = 'page-content page-enter';
      // Await the async page renderer
      await this._routes[routeKey](params);
      this._updateNavbar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      pageContent.innerHTML = `
        <div class="container">
          <div class="empty-state" style="padding-top: 6rem;">
            <div class="empty-state-icon">🔍</div>
            <h2 class="empty-state-title">Page Not Found</h2>
            <p class="empty-state-desc">The page you're looking for doesn't exist.</p>
            <button class="btn btn-primary" onclick="Router.navigate('')">Go Home</button>
          </div>
        </div>`;
    }
  },

  _updateNavbar() {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('data-route') || '';
      link.classList.toggle('active', href === this._current ||
        (this._current.startsWith('catalog') && href === 'catalog') ||
        (this._current.startsWith('admin') && href === 'admin'));
    });

    // Update cart badge
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      const count = Cart.count;
      badge.textContent = count;
      badge.classList.toggle('show', count > 0);
    }

    // Update user button
    this._renderUserButton();
  },

  _renderUserButton() {
    const container = document.getElementById('nav-user-area');
    if (!container) return;

    if (Auth.isLoggedIn) {
      const initials = Auth.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      container.innerHTML = `
        <button class="nav-user-btn" onclick="Router.navigate(Auth.isAdmin ? 'admin' : 'orders')" title="${Auth.user.name}">
          <span class="nav-user-avatar">${initials}</span>
          <span>${Auth.user.name.split(' ')[0]}</span>
        </button>
        <button class="btn btn-ghost btn-icon" onclick="Auth.logout(); Router.navigate(''); Router._updateNavbar();" title="Logout">
          ${Icons.logout}
        </button>`;
    } else {
      container.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="Router.navigate('login')">
          ${Icons.user} Sign In
        </button>`;
    }
  }
};
