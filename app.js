/* ============================================
   BookWorm — Application Core
   Data layer, state management, seed data
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
  }
};

// ── Seed Data ──
const SEED_BOOKS = [
  {
    id: 'book_001', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen',
    isbn: '978-0262033848', condition: 'Good', studentPrice: 450, originalPrice: 4200,
    description: 'The classic comprehensive textbook covering a broad range of algorithms. Highlights at the start of each chapter, minor wear on spine.',
    genre: 'Computer Science', quantity: 3, listedAt: '2026-03-15T10:00:00Z'
  },
  {
    id: 'book_002', title: 'Discrete Mathematics and Its Applications', author: 'Kenneth H. Rosen',
    isbn: '978-0073383095', condition: 'Like New', studentPrice: 380, originalPrice: 3800,
    description: 'Barely used copy from previous semester. No markings, clean pages. Perfect for CS/Math students.',
    genre: 'Mathematics', quantity: 2, listedAt: '2026-03-18T14:00:00Z'
  },
  {
    id: 'book_003', title: 'Clean Code', author: 'Robert C. Martin',
    isbn: '978-0132350884', condition: 'Good', studentPrice: 320, originalPrice: 2900,
    description: 'A handbook of Agile software craftsmanship. Some sticky notes inside, otherwise excellent condition.',
    genre: 'Computer Science', quantity: 5, listedAt: '2026-03-20T09:30:00Z'
  },
  {
    id: 'book_004', title: 'Engineering Mechanics: Statics', author: 'R.C. Hibbeler',
    isbn: '978-0133918922', condition: 'Fair', studentPrice: 280, originalPrice: 3500,
    description: 'Some highlighting in early chapters, all pages intact. Good enough for coursework reference.',
    genre: 'Engineering', quantity: 4, listedAt: '2026-03-22T11:00:00Z'
  },
  {
    id: 'book_005', title: 'Organic Chemistry', author: 'Paula Yurkanis Bruice',
    isbn: '978-0134042282', condition: 'Worn', studentPrice: 200, originalPrice: 4100,
    description: 'Heavy use but fully functional. Cover has creases, some pages dog-eared. Great deal for budget-conscious students.',
    genre: 'Chemistry', quantity: 2, listedAt: '2026-03-25T08:00:00Z'
  },
  {
    id: 'book_006', title: 'Psychology: Themes and Variations', author: 'Wayne Weiten',
    isbn: '978-1337408219', condition: 'Like New', studentPrice: 350, originalPrice: 3200,
    description: 'Pristine condition — bought for an elective and never opened after the midterm.',
    genre: 'Psychology', quantity: 1, listedAt: '2026-03-28T16:00:00Z'
  },
  {
    id: 'book_007', title: 'Principles of Economics', author: 'N. Gregory Mankiw',
    isbn: '978-1305585126', condition: 'Good', studentPrice: 390, originalPrice: 3600,
    description: 'Standard introductory economics textbook. Minor pencil notes in margins, easily erasable.',
    genre: 'Economics', quantity: 3, listedAt: '2026-04-01T12:00:00Z'
  },
  {
    id: 'book_008', title: 'The Design of Everyday Things', author: 'Don Norman',
    isbn: '978-0465050659', condition: 'Like New', studentPrice: 250, originalPrice: 1800,
    description: 'Essential read for UX/UI students. Clean copy, no markings.',
    genre: 'Art', quantity: 6, listedAt: '2026-04-02T10:00:00Z'
  },
  {
    id: 'book_009', title: 'Calculus: Early Transcendentals', author: 'James Stewart',
    isbn: '978-1285741550', condition: 'Fair', studentPrice: 340, originalPrice: 4500,
    description: 'Solutions worked out in pencil for first 5 chapters. Binding intact, no missing pages.',
    genre: 'Mathematics', quantity: 2, listedAt: '2026-04-03T14:30:00Z'
  },
  {
    id: 'book_010', title: 'Fundamentals of Physics', author: 'David Halliday & Robert Resnick',
    isbn: '978-1118230718', condition: 'Good', studentPrice: 420, originalPrice: 4000,
    description: 'The definitive university physics textbook. Minor cover wear, excellent interior.',
    genre: 'Physics', quantity: 3, listedAt: '2026-04-05T09:00:00Z'
  },
  {
    id: 'book_011', title: 'Molecular Biology of the Cell', author: 'Bruce Alberts',
    isbn: '978-0815345244', condition: 'Good', studentPrice: 480, originalPrice: 5200,
    description: 'Comprehensive coverage of cell biology. Some tabs attached, minor highlighting.',
    genre: 'Biology', quantity: 1, listedAt: '2026-04-07T11:00:00Z'
  },
  {
    id: 'book_012', title: 'Data Structures Using C++', author: 'D.S. Malik',
    isbn: '978-1133626381', condition: 'Worn', studentPrice: 180, originalPrice: 2800,
    description: 'Well-loved copy. Spine cracked but pages all present. Budget-friendly option.',
    genre: 'Computer Science', quantity: 4, listedAt: '2026-04-08T15:00:00Z'
  },
  {
    id: 'book_013', title: 'A Brief History of Time', author: 'Stephen Hawking',
    isbn: '978-0553380163', condition: 'Like New', studentPrice: 150, originalPrice: 800,
    description: 'Classic popular science read. Great condition, perfect for a light semester read.',
    genre: 'Physics', quantity: 7, listedAt: '2026-04-09T10:00:00Z'
  },
  {
    id: 'book_014', title: 'The Art of War', author: 'Sun Tzu',
    isbn: '978-1599869773', condition: 'Good', studentPrice: 80, originalPrice: 400,
    description: 'Compact edition. Perfect for philosophy and strategy enthusiasts.',
    genre: 'Philosophy', quantity: 10, listedAt: '2026-04-10T08:00:00Z'
  },
  {
    id: 'book_015', title: 'Computer Networking: A Top-Down Approach', author: 'James Kurose',
    isbn: '978-0133594140', condition: 'Good', studentPrice: 410, originalPrice: 3900,
    description: 'Excellent networking textbook, minor wear. Includes Wireshark lab inserts.',
    genre: 'Computer Science', quantity: 2, listedAt: '2026-04-11T13:00:00Z'
  }
];

// ── LocalStorage Adapter ──
const DB = {
  _getStore(key) {
    try {
      return JSON.parse(localStorage.getItem('bookworm_' + key)) || null;
    } catch { return null; }
  },
  _setStore(key, data) {
    localStorage.setItem('bookworm_' + key, JSON.stringify(data));
  },

  // Initialize with seed data if first run
  init() {
    if (!this._getStore('initialized')) {
      this._setStore('books', SEED_BOOKS);
      this._setStore('orders', []);
      this._setStore('users', [
        { id: 'admin_001', email: 'admin@bookworm.com', name: 'Store Admin', role: 'admin', phone: '9876543210', createdAt: new Date().toISOString() }
      ]);
      this._setStore('initialized', true);
    }
  },

  // Books CRUD
  getBooks() {
    return this._getStore('books') || [];
  },
  getBookById(id) {
    return this.getBooks().find(b => b.id === id) || null;
  },
  searchBooks(query, filters = {}) {
    let books = this.getBooks();
    if (query) {
      const q = query.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.includes(q)) ||
        (b.genre && b.genre.toLowerCase().includes(q))
      );
    }
    if (filters.condition && filters.condition !== 'all') {
      books = books.filter(b => b.condition === filters.condition);
    }
    if (filters.genre && filters.genre !== 'all') {
      books = books.filter(b => b.genre === filters.genre);
    }
    if (filters.minPrice) {
      books = books.filter(b => b.studentPrice >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      books = books.filter(b => b.studentPrice <= Number(filters.maxPrice));
    }
    if (filters.inStock) {
      books = books.filter(b => b.quantity > 0);
    }
    // Sort
    if (filters.sort === 'price-asc') books.sort((a, b) => a.studentPrice - b.studentPrice);
    else if (filters.sort === 'price-desc') books.sort((a, b) => b.studentPrice - a.studentPrice);
    else if (filters.sort === 'newest') books.sort((a, b) => new Date(b.listedAt) - new Date(a.listedAt));
    else if (filters.sort === 'title') books.sort((a, b) => a.title.localeCompare(b.title));
    else books.sort((a, b) => new Date(b.listedAt) - new Date(a.listedAt)); // default: newest

    return books;
  },
  addBook(book) {
    const books = this.getBooks();
    const newBook = {
      id: Utils.generateId(),
      ...book,
      listedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    books.push(newBook);
    this._setStore('books', books);
    return newBook;
  },
  updateBook(id, updates) {
    const books = this.getBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return null;
    books[idx] = { ...books[idx], ...updates, updatedAt: new Date().toISOString() };
    this._setStore('books', books);
    return books[idx];
  },
  deleteBook(id) {
    const books = this.getBooks().filter(b => b.id !== id);
    this._setStore('books', books);
  },

  // Orders CRUD
  getOrders(userId) {
    const orders = this._getStore('orders') || [];
    if (userId) return orders.filter(o => o.userId === userId);
    return orders;
  },
  getOrderById(id) {
    return (this._getStore('orders') || []).find(o => o.id === id) || null;
  },
  createOrder(orderData) {
    const orders = this.getOrders();
    const books = this.getBooks();

    // Validate and decrement stock
    for (const item of orderData.items) {
      const book = books.find(b => b.id === item.bookId);
      if (!book || book.quantity < item.quantity) {
        return { error: `"${book ? book.title : 'Unknown book'}" is out of stock or insufficient quantity.` };
      }
    }

    // Decrement stock
    for (const item of orderData.items) {
      const book = books.find(b => b.id === item.bookId);
      book.quantity -= item.quantity;
    }
    this._setStore('books', books);

    const newOrder = {
      id: Utils.generateId(),
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    orders.push(newOrder);
    this._setStore('orders', orders);
    return newOrder;
  },
  updateOrderStatus(orderId, status) {
    const orders = this._getStore('orders') || [];
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    // If cancelling, restore stock
    if (status === 'cancelled' && orders[idx].status !== 'cancelled') {
      const books = this.getBooks();
      for (const item of orders[idx].items) {
        const book = books.find(b => b.id === item.bookId);
        if (book) book.quantity += item.quantity;
      }
      this._setStore('books', books);
    }

    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    this._setStore('orders', orders);
    return orders[idx];
  },

  // Users
  getUsers() {
    return this._getStore('users') || [];
  },
  getUserById(id) {
    return this.getUsers().find(u => u.id === id) || null;
  },

  // Stats (Admin)
  getStats() {
    const books = this.getBooks();
    const orders = this.getOrders();
    return {
      totalBooks: books.length,
      totalStock: books.reduce((sum, b) => sum + b.quantity, 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      totalOrders: orders.length,
      revenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0),
      lowStock: books.filter(b => b.quantity > 0 && b.quantity <= 2).length,
      outOfStock: books.filter(b => b.quantity === 0).length
    };
  },

  // Genres list
  getGenres() {
    const books = this.getBooks();
    return [...new Set(books.map(b => b.genre).filter(Boolean))].sort();
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
  login(name, email, role) {
    const users = DB.getUsers();
    let user = users.find(u => u.email === email);
    if (!user) {
      user = {
        id: Utils.generateId(),
        name, email, role,
        phone: '',
        createdAt: new Date().toISOString()
      };
      users.push(user);
      DB._setStore('users', users);
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
  // Validate cart against current inventory
  validate() {
    const issues = [];
    const books = DB.getBooks();
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
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  Auth.init();
  Cart.init();
  Toast.init();
  Router.init();
});
