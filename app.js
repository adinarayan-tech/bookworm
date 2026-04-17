/* ============================================
   BookWorm — Application Core (Supabase Edition)
   Data layer, state management, utilities
   ============================================ */

// ── Utility Functions ──
const Utils = {
  generateId() {
    return 'bw_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },
  formatPrice(price) {
    return '₹' + Number(price).toFixed(2);
  },
  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  },
  formatDateTime(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },
  getConditionBadgeClass(condition) {
    const map = {
      'Like New': 'badge-new',
      'Good': 'badge-good',
      'Fair': 'badge-fair',
      'Worn': 'badge-worn'
    };
    return map[condition] || 'badge-fair';
  },
  getStatusBadgeClass(status) {
    return 'badge-' + status;
  },
  getBookEmoji(genre) {
    const map = {
      'Computer Science': '💻',
      'Mathematics': '📐',
      'Physics': '⚛️',
      'Engineering': '⚙️',
      'Literature': '📖',
      'Business': '📊',
      'Psychology': '🧠',
      'Biology': '🧬',
      'Chemistry': '🧪',
      'History': '🏛️',
      'Art': '🎨',
      'Music': '🎵',
      'Philosophy': '💭',
      'Economics': '💰'
    };
    return map[genre] || '📚';
  },
  calcSavings(original, current) {
    if (!original || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  },
  // OpenLibrary cover URLs (free, no API key)
  getBookCover(isbn, size = 'M') {
    if (!isbn) return null;
    const clean = isbn.replace(/-/g, '');
    return `https://covers.openlibrary.org/b/isbn/${clean}-${size}.jpg`;
  },
  getBookCoverLarge(isbn) {
    return this.getBookCover(isbn, 'L');
  },
  // Show a loading spinner inside a container
  showLoader(container) {
    container.innerHTML = `
      <div class="page-loader">
        <div class="loader-spinner"></div>
        <p class="text-secondary">Loading...</p>
      </div>`;
  }
};

// ── Snake ↔ Camel Case Transform (Supabase uses snake_case, JS uses camelCase) ──
const _snakeToCamel = (str) => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const _camelToSnake = (str) => str.replace(/[A-Z]/g, c => '_' + c.toLowerCase());

function _transformKeys(obj, fn) {
  if (Array.isArray(obj)) return obj.map(item => _transformKeys(item, fn));
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => [fn(key), _transformKeys(val, fn)])
    );
  }
  return obj;
}

const _toCamel = (data) => _transformKeys(data, _snakeToCamel);
const _toSnake = (data) => _transformKeys(data, _camelToSnake);

// ── Supabase DB Adapter ──
const DB = {
  async init() {
    // No-op — data lives in Supabase, no local seeding needed
  },

  // ── Books CRUD ──
  async getBooks() {
    const { data, error } = await supabaseClient
      .from('books').select('*').order('listed_at', { ascending: false });
    if (error) { console.error('getBooks:', error); return []; }
    return _toCamel(data);
  },

  async getBookById(id) {
    const { data, error } = await supabaseClient
      .from('books').select('*').eq('id', id).single();
    if (error) { console.error('getBookById:', error); return null; }
    return _toCamel(data);
  },

  async searchBooks(query, filters = {}) {
    let q = supabaseClient.from('books').select('*');

    if (query) {
      q = q.or(`title.ilike.%${query}%,author.ilike.%${query}%,isbn.ilike.%${query}%,genre.ilike.%${query}%`);
    }
    if (filters.condition && filters.condition !== 'all') {
      q = q.eq('condition', filters.condition);
    }
    if (filters.genre && filters.genre !== 'all') {
      q = q.eq('genre', filters.genre);
    }
    if (filters.minPrice) {
      q = q.gte('student_price', Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      q = q.lte('student_price', Number(filters.maxPrice));
    }
    if (filters.inStock) {
      q = q.gt('quantity', 0);
    }

    // Sort
    if (filters.sort === 'price-asc') q = q.order('student_price', { ascending: true });
    else if (filters.sort === 'price-desc') q = q.order('student_price', { ascending: false });
    else if (filters.sort === 'title') q = q.order('title', { ascending: true });
    else q = q.order('listed_at', { ascending: false });

    const { data, error } = await q;
    if (error) { console.error('searchBooks:', error); return []; }
    return _toCamel(data);
  },

  async addBook(book) {
    const snakeBook = _toSnake(book);
    delete snakeBook.id;
    snakeBook.listed_at = new Date().toISOString();
    snakeBook.updated_at = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from('books').insert(snakeBook).select().single();
    if (error) { console.error('addBook:', error); return null; }
    return _toCamel(data);
  },

  async updateBook(id, updates) {
    const snakeUpdates = _toSnake(updates);
    snakeUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from('books').update(snakeUpdates).eq('id', id).select().single();
    if (error) { console.error('updateBook:', error); return null; }
    return _toCamel(data);
  },

  async deleteBook(id) {
    const { error } = await supabaseClient.from('books').delete().eq('id', id);
    if (error) console.error('deleteBook:', error);
  },

  async uploadImage(file) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('book-covers')
      .upload(filePath, file);

    if (uploadError) {
      console.error('uploadImage error:', uploadError);
      return null;
    }

    const { data } = supabaseClient.storage
      .from('book-covers')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // ── Orders CRUD ──
  async getOrders(userId) {
    let q = supabaseClient.from('orders').select('*, order_items(*)');
    if (userId) q = q.eq('user_id', userId);
    q = q.order('created_at', { ascending: false });

    const { data, error } = await q;
    if (error) { console.error('getOrders:', error); return []; }

    // Transform keys and map order_items → items for backward compatibility
    return data.map(order => {
      const camelOrder = _toCamel(order);
      camelOrder.items = camelOrder.orderItems || [];
      delete camelOrder.orderItems;
      return camelOrder;
    });
  },

  async getOrderById(id) {
    const { data, error } = await supabaseClient
      .from('orders').select('*, order_items(*)').eq('id', id).single();
    if (error) { console.error('getOrderById:', error); return null; }
    const camelOrder = _toCamel(data);
    camelOrder.items = camelOrder.orderItems || [];
    delete camelOrder.orderItems;
    return camelOrder;
  },

  async createOrder(orderData) {
    // 1. Validate stock
    for (const item of orderData.items) {
      const { data: book } = await supabaseClient
        .from('books').select('id, title, quantity').eq('id', item.bookId).single();
      if (!book || book.quantity < item.quantity) {
        return { error: `"${book ? book.title : 'Unknown book'}" is out of stock or insufficient quantity.` };
      }
    }

    // 2. Decrement stock
    for (const item of orderData.items) {
      const { data: book } = await supabaseClient
        .from('books').select('quantity').eq('id', item.bookId).single();
      await supabaseClient.from('books')
        .update({ quantity: book.quantity - item.quantity, updated_at: new Date().toISOString() })
        .eq('id', item.bookId);
    }

    // 3. Create order row
    const orderPayload = {
      user_id: orderData.userId,
      fulfillment_type: orderData.fulfillmentType,
      status: 'pending',
      total_amount: orderData.totalAmount,
      shipping_name: orderData.shippingName || null,
      shipping_address: orderData.shippingAddress || null,
      shipping_city: orderData.shippingCity || null,
      shipping_zip: orderData.shippingZip || null,
      shipping_phone: orderData.shippingPhone || null,
      collect_date: orderData.collectDate || null,
      collect_time_slot: orderData.collectTimeSlot || null
    };

    const { data: newOrder, error } = await supabaseClient
      .from('orders').insert(orderPayload).select().single();
    if (error) { console.error('createOrder:', error); return { error: 'Failed to create order.' }; }

    // 4. Create order items
    const itemsPayload = orderData.items.map(item => ({
      order_id: newOrder.id,
      book_id: item.bookId,
      quantity: item.quantity,
      price_at_purchase: item.priceAtPurchase
    }));

    const { error: itemsError } = await supabaseClient.from('order_items').insert(itemsPayload);
    if (itemsError) console.error('createOrderItems:', itemsError);

    const result = _toCamel(newOrder);
    result.items = orderData.items;
    return result;
  },

  async updateOrderStatus(orderId, status) {
    // If cancelling, restore stock
    if (status === 'cancelled') {
      const order = await this.getOrderById(orderId);
      if (order && order.status !== 'cancelled') {
        for (const item of order.items) {
          const { data: book } = await supabaseClient
            .from('books').select('quantity').eq('id', item.bookId).single();
          if (book) {
            await supabaseClient.from('books')
              .update({ quantity: book.quantity + item.quantity, updated_at: new Date().toISOString() })
              .eq('id', item.bookId);
          }
        }
      }
    }

    const { data, error } = await supabaseClient
      .from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId).select().single();
    if (error) { console.error('updateOrderStatus:', error); return null; }
    return _toCamel(data);
  },

  // ── Users ──
  async getUsers() {
    const { data, error } = await supabaseClient.from('users').select('*');
    if (error) { console.error('getUsers:', error); return []; }
    return _toCamel(data);
  },

  async getUserById(id) {
    const { data, error } = await supabaseClient
      .from('users').select('*').eq('id', id).single();
    if (error) return null;
    return _toCamel(data);
  },

  // ── Stats (Admin) ──
  async getStats() {
    const books = await this.getBooks();
    const orders = await this.getOrders();
    return {
      totalBooks: books.length,
      totalStock: books.reduce((sum, b) => sum + b.quantity, 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      totalOrders: orders.length,
      revenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.totalAmount), 0),
      lowStock: books.filter(b => b.quantity > 0 && b.quantity <= 2).length,
      outOfStock: books.filter(b => b.quantity === 0).length
    };
  },

  // ── Genres list ──
  async getGenres() {
    const { data, error } = await supabaseClient.from('books').select('genre');
    if (error) return [];
    return [...new Set(data.map(b => b.genre).filter(Boolean))].sort();
  }
};

// ── Auth State ──
const Auth = {
  _current: null,

  init() {
    const stored = localStorage.getItem('bookworm_currentUser');
    if (stored) {
      try { this._current = JSON.parse(stored); } catch { this._current = null; }
    }
  },

  async login(name, email, role) {
    // Check if user exists in Supabase
    const { data: existingUsers } = await supabaseClient
      .from('users').select('*').eq('email', email);

    let user;
    if (existingUsers && existingUsers.length > 0) {
      user = _toCamel(existingUsers[0]);
    } else {
      // Create new user in Supabase
      const { data: newUser, error } = await supabaseClient
        .from('users').insert({ name, email, role, phone: '' }).select().single();
      if (error) { console.error('login create user:', error); return null; }
      user = _toCamel(newUser);
    }

    this._current = user;
    localStorage.setItem('bookworm_currentUser', JSON.stringify(user));
    return user;
  },

  logout() {
    this._current = null;
    localStorage.removeItem('bookworm_currentUser');
  },

  get user() { return this._current; },
  get isLoggedIn() { return !!this._current; },
  get isAdmin() { return this._current?.role === 'admin'; }
};

// ── Cart State ──
const Cart = {
  _items: [],
  _listeners: [],

  init() {
    const stored = localStorage.getItem('bookworm_cart');
    if (stored) {
      try { this._items = JSON.parse(stored); } catch { this._items = []; }
    }
  },
  _save() {
    localStorage.setItem('bookworm_cart', JSON.stringify(this._items));
    this._notify();
  },
  _notify() {
    this._listeners.forEach(fn => fn(this._items));
  },
  onChange(fn) {
    this._listeners.push(fn);
  },
  get items() { return this._items; },
  get count() { return this._items.reduce((sum, i) => sum + i.quantity, 0); },
  get total() { return this._items.reduce((sum, i) => sum + i.price * i.quantity, 0); },

  addItem(book, qty = 1) {
    const existing = this._items.find(i => i.bookId === book.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      this._items.push({
        bookId: book.id,
        title: book.title,
        author: book.author,
        price: book.studentPrice,
        genre: book.genre,
        quantity: qty,
        maxQty: book.quantity
      });
    }
    this._save();
  },
  updateQty(bookId, qty) {
    const item = this._items.find(i => i.bookId === bookId);
    if (item) {
      item.quantity = Math.max(1, qty);
      this._save();
    }
  },
  removeItem(bookId) {
    this._items = this._items.filter(i => i.bookId !== bookId);
    this._save();
  },
  clear() {
    this._items = [];
    this._save();
  },
  // Validate cart against current inventory (async — talks to Supabase)
  async validate() {
    const issues = [];
    const books = await DB.getBooks();
    this._items = this._items.filter(item => {
      const book = books.find(b => b.id === item.bookId);
      if (!book) {
        issues.push(`"${item.title}" is no longer available and was removed.`);
        return false;
      }
      if (book.quantity === 0) {
        issues.push(`"${item.title}" is out of stock and was removed.`);
        return false;
      }
      if (item.quantity > book.quantity) {
        item.quantity = book.quantity;
        item.maxQty = book.quantity;
        issues.push(`"${item.title}" quantity adjusted to ${book.quantity} (max available).`);
      }
      return true;
    });
    if (issues.length) this._save();
    return issues;
  }
};

// ── Toast System ──
const Toast = {
  _container: null,

  init() {
    this._container = document.getElementById('toast-container');
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.id = 'toast-container';
      this._container.className = 'toast-container';
      document.body.appendChild(this._container);
    }
  },
  show(message, type = 'info', duration = 3000) {
    if (!this._container) this.init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    this._container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); }
};

// ── SVG Icons (inline, no dependencies) ──
const Icons = {
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  cart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  book: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  minus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  x: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  chevronLeft: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
  chevronRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
  package: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  truck: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
  store: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`,
  dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
  list: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`,
  edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
  menu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
  sparkle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  mapPin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  alertTriangle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  checkCircle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`
};

// ── Initialize everything on DOM ready ──
document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  Auth.init();
  Cart.init();
  Toast.init();
  Router.init();
});
