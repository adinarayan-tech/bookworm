/* ============================================
   BookWorm — Page Renderers (Supabase Edition)
   All page views for the SPA — async data loading
   ============================================ */

const Pages = {

  // ── HOME PAGE ──
  async home() {
    const page = document.getElementById('page-content');
    Utils.showLoader(page);

    const [books, stats] = await Promise.all([
      DB.searchBooks('', { sort: 'newest' }),
      DB.getStats()
    ]);
    const featured = books.slice(0, 6);

    page.innerHTML = `
      <!-- Hero -->
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="container">
          <div class="hero-content">
            <div class="hero-badge">${Icons.sparkle} For Students, By Students</div>
            <h1>Your Campus<br><span class="text-gradient">Bookshelf</span></h1>
            <p class="hero-subtitle">Find affordable second-hand textbooks from fellow students. Save up to 90% on your semester reading list.</p>
            <div class="hero-search">
              <span class="search-icon">${Icons.search}</span>
              <input type="text" id="hero-search-input" placeholder="Search by title, author, or ISBN..." autocomplete="off" />
            </div>
            <div class="hero-stats">
              <div class="hero-stat">
                <div class="hero-stat-value">${stats.totalBooks}</div>
                <div class="hero-stat-label">Books Listed</div>
              </div>
              <div class="hero-stat">
                <div class="hero-stat-value">${stats.totalStock}</div>
                <div class="hero-stat-label">Copies Available</div>
              </div>
              <div class="hero-stat">
                <div class="hero-stat-value">${stats.totalOrders}</div>
                <div class="hero-stat-label">Orders Placed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Books -->
      <section class="featured-section">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title font-display">Recently Added</h2>
              <p class="section-subtitle">Fresh arrivals for your bookshelf</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('catalog')">
              View All ${Icons.chevronRight}
            </button>
          </div>
          <div class="featured-scroll" id="featured-books"></div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="section">
        <div class="container">
          <div class="section-header" style="justify-content: center;">
            <div class="text-center">
              <h2 class="section-title font-display">How It Works</h2>
              <p class="section-subtitle">Three simple steps to affordable textbooks</p>
            </div>
          </div>
          <div class="book-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; max-width: 800px; margin: 0 auto;">
            <div class="card text-center" style="animation: fadeInUp 0.5s ease-out 0.1s both;">
              <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔍</div>
              <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Search & Find</h3>
              <p class="text-secondary text-sm">Browse our catalog of second-hand textbooks by title, author, or ISBN.</p>
            </div>
            <div class="card text-center" style="animation: fadeInUp 0.5s ease-out 0.2s both;">
              <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🛒</div>
              <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Add to Cart</h3>
              <p class="text-secondary text-sm">Choose your books and pick delivery or reserve for in-store pickup.</p>
            </div>
            <div class="card text-center" style="animation: fadeInUp 0.5s ease-out 0.3s both;">
              <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📦</div>
              <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Get Your Books</h3>
              <p class="text-secondary text-sm">Receive at your doorstep or collect from our campus store.</p>
            </div>
          </div>
        </div>
      </section>
    `;

    // Render featured book cards
    const container = document.getElementById('featured-books');
    featured.forEach((book, i) => {
      container.innerHTML += Components.bookCard(book, i);
    });

    // Hero search handler
    const searchInput = document.getElementById('hero-search-input');
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        Router.navigate('catalog?q=' + encodeURIComponent(searchInput.value.trim()));
      }
    });
    searchInput.addEventListener('input', Utils.debounce((e) => {
      if (searchInput.value.trim().length >= 2) {
        Router.navigate('catalog?q=' + encodeURIComponent(searchInput.value.trim()));
      }
    }, 600));
  },

  // ── CATALOG PAGE ──
  async catalog(initialQuery) {
    const page = document.getElementById('page-content');
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const query = initialQuery || urlParams.get('q') || '';

    // Fetch genres for the filter dropdown
    const genres = await DB.getGenres();

    page.innerHTML = `
      <div class="container section">
        <div class="section-header">
          <div>
            <h1 class="section-title font-display">Book Catalog</h1>
            <p class="section-subtitle" id="catalog-count">Loading...</p>
          </div>
        </div>

        <div class="filter-bar">
          <div class="search-input-wrap">
            <span class="search-icon">${Icons.search}</span>
            <input type="text" id="catalog-search" placeholder="Search titles, authors, ISBN..."
              value="${query.replace(/"/g, '&quot;')}" autocomplete="off" />
          </div>
          <select id="filter-condition">
            <option value="all">All Conditions</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Worn">Worn</option>
          </select>
          <select id="filter-genre">
            <option value="all">All Genres</option>
            ${genres.map(g => `<option value="${g}">${g}</option>`).join('')}
          </select>
          <select id="filter-sort">
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>

        <div class="book-grid" id="catalog-grid"></div>
        <div id="catalog-empty" class="hidden"></div>
      </div>
    `;

    const searchInput = document.getElementById('catalog-search');
    const conditionFilter = document.getElementById('filter-condition');
    const genreFilter = document.getElementById('filter-genre');
    const sortFilter = document.getElementById('filter-sort');
    const grid = document.getElementById('catalog-grid');
    const emptyEl = document.getElementById('catalog-empty');
    const countEl = document.getElementById('catalog-count');

    async function render() {
      const filters = {
        condition: conditionFilter.value,
        genre: genreFilter.value,
        sort: sortFilter.value,
        inStock: false
      };
      const books = await DB.searchBooks(searchInput.value, filters);

      countEl.textContent = `${books.length} book${books.length !== 1 ? 's' : ''} found`;

      if (books.length === 0) {
        grid.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        emptyEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h3 class="empty-state-title">No books found</h3>
            <p class="empty-state-desc">Try adjusting your search or filters.</p>
          </div>`;
      } else {
        grid.classList.remove('hidden');
        emptyEl.classList.add('hidden');
        grid.innerHTML = books.map((book, i) => Components.bookCard(book, i)).join('');
      }
    }

    const debouncedRender = Utils.debounce(() => render(), 300);
    searchInput.addEventListener('input', debouncedRender);
    conditionFilter.addEventListener('change', () => render());
    genreFilter.addEventListener('change', () => render());
    sortFilter.addEventListener('change', () => render());

    await render();
    if (query) searchInput.focus();
  },

  // ── BOOK DETAIL PAGE ──
  async bookDetail(bookId) {
    const page = document.getElementById('page-content');
    Utils.showLoader(page);

    const book = await DB.getBookById(bookId);

    if (!book) {
      page.innerHTML = `
        <div class="container">
          <div class="empty-state" style="padding-top: 4rem;">
            <div class="empty-state-icon">📕</div>
            <h2 class="empty-state-title">Book not found</h2>
            <p class="empty-state-desc">This book may have been removed.</p>
            <button class="btn btn-primary" onclick="Router.navigate('catalog')">Browse Catalog</button>
          </div>
        </div>`;
      return;
    }

    const savings = Utils.calcSavings(book.originalPrice, book.studentPrice);
    const emoji = Utils.getBookEmoji(book.genre);
    const conditionClass = Utils.getConditionBadgeClass(book.condition);
    const coverUrl = book.imageUrl || Utils.getBookCoverLarge(book.isbn);

    page.innerHTML = `
      <div class="container">
        <div class="back-btn" onclick="Router.navigate('catalog')">${Icons.chevronLeft} Back to Catalog</div>

        <div class="book-detail">
          <div class="book-detail-image">
            ${coverUrl ? `
              <img src="${coverUrl}" alt="${book.title}" class="book-detail-cover-img"
                   onload="if(this.naturalWidth<=1){this.style.display='none';this.nextElementSibling.style.display='flex';}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
              <div class="book-cover-fallback detail-fallback" style="display:none; height:100%; width:100%; align-items:center; justify-content:center; font-size:6rem;">${emoji}</div>
            ` : `${emoji}`}
          </div>
          <div class="book-detail-info">
            <span class="badge ${conditionClass}" style="margin-bottom: 0.75rem;">${book.condition}</span>
            <h1>${book.title}</h1>
            <p class="book-detail-author">by ${book.author}</p>

            <div class="book-detail-meta">
              ${book.isbn ? `<span class="book-detail-meta-item">${Icons.book} ISBN: ${book.isbn}</span>` : ''}
              ${book.genre ? `<span class="book-detail-meta-item">📂 ${book.genre}</span>` : ''}
              <span class="book-detail-meta-item">${Icons.clock} Listed ${Utils.formatDate(book.listedAt)}</span>
            </div>

            <div class="book-detail-price">
              <span class="book-detail-price-current">${Utils.formatPrice(book.studentPrice)}</span>
              ${book.originalPrice ? `<span class="book-detail-price-original">${Utils.formatPrice(book.originalPrice)}</span>` : ''}
            </div>
            ${savings > 0 ? `<p class="book-detail-savings">💰 You save ${savings}% compared to retail!</p>` : ''}

            ${book.description ? `<p class="book-detail-description">${book.description}</p>` : ''}

            <p class="text-sm mb-1" style="color: ${book.quantity > 0 ? (book.quantity <= 2 ? 'var(--rose-400)' : 'var(--emerald-400)') : 'var(--rose-500)'}">
              ${book.quantity > 0 ? `${book.quantity} cop${book.quantity !== 1 ? 'ies' : 'y'} available` + (book.quantity <= 2 ? ' — hurry!' : '') : 'Out of stock'}
            </p>

            <div class="book-detail-actions">
              ${book.quantity > 0 ? `
                <div class="qty-control" id="detail-qty">
                  <button onclick="Pages._detailAdjustQty(-1)">−</button>
                  <span id="detail-qty-val">1</span>
                  <button onclick="Pages._detailAdjustQty(1)">+</button>
                </div>
                <button class="btn btn-primary btn-lg" id="detail-add-cart" onclick="Pages._detailAddToCart('${book.id}')">
                  ${Icons.cart} Add to Cart
                </button>
              ` : `
                <button class="btn btn-secondary btn-lg" disabled>Out of Stock</button>
              `}
              <button class="btn btn-secondary" onclick="Router.navigate('catalog')">Continue Shopping</button>
            </div>
          </div>
        </div>

        <!-- Related Books -->
        <section class="section">
          <h2 class="section-title font-display mb-1">You Might Also Like</h2>
          <div class="featured-scroll" id="related-books"></div>
        </section>
      </div>
    `;

    // Related books
    const relatedBooks = (await DB.searchBooks('', { genre: book.genre }))
      .filter(b => b.id !== book.id)
      .slice(0, 4);
    const relatedContainer = document.getElementById('related-books');
    if (relatedBooks.length > 0) {
      relatedContainer.innerHTML = relatedBooks.map((b, i) => Components.bookCard(b, i)).join('');
    } else {
      relatedContainer.parentElement.style.display = 'none';
    }

    // Store book ref for qty control
    this._detailBook = book;
    this._detailQty = 1;
  },

  _detailBook: null,
  _detailQty: 1,

  _detailAdjustQty(delta) {
    const max = this._detailBook ? this._detailBook.quantity : 1;
    this._detailQty = Math.max(1, Math.min(max, this._detailQty + delta));
    const el = document.getElementById('detail-qty-val');
    if (el) el.textContent = this._detailQty;
  },

  async _detailAddToCart(bookId) {
    if (!Auth.isLoggedIn) {
      Toast.info('Please sign in to add items to your cart.');
      Router.navigate('login');
      return;
    }
    const book = await DB.getBookById(bookId);
    if (!book) return;
    Cart.addItem(book, this._detailQty);
    Toast.success(`"${book.title}" added to cart!`);
    Router._updateNavbar();
  },

  // ── CART & CHECKOUT PAGE ──
  async cart() {
    const page = document.getElementById('page-content');
    Utils.showLoader(page);

    const issues = await Cart.validate();
    if (issues.length) {
      issues.forEach(msg => Toast.info(msg));
    }

    const renderCart = () => {
      const items = Cart.items;

      if (items.length === 0) {
        page.innerHTML = `
          <div class="container">
            <div class="empty-state" style="padding-top: 4rem;">
              <div class="empty-state-icon">🛒</div>
              <h2 class="empty-state-title">Your cart is empty</h2>
              <p class="empty-state-desc">Browse our catalog and find your next great read.</p>
              <button class="btn btn-primary" onclick="Router.navigate('catalog')">Browse Catalog</button>
            </div>
          </div>`;
        return;
      }

      page.innerHTML = `
        <div class="container section">
          <div class="back-btn" onclick="Router.navigate('catalog')">${Icons.chevronLeft} Continue Shopping</div>
          <h1 class="section-title font-display mb-2">Your Cart</h1>

          <div class="checkout-grid">
            <div>
              <div class="card" style="padding: 0; overflow: hidden;">
                <div id="cart-items-list">
                  ${items.map(item => `
                    <div class="cart-item" data-book-id="${item.bookId}">
                      <div class="cart-item-image">${Utils.getBookEmoji(item.genre)}</div>
                      <div class="cart-item-info">
                        <div class="cart-item-title">${item.title}</div>
                        <div class="cart-item-author">${item.author}</div>
                        <div class="cart-item-price">${Utils.formatPrice(item.price)}</div>
                      </div>
                      <div class="qty-control">
                        <button onclick="Cart.updateQty('${item.bookId}', ${item.quantity - 1}); Pages.cart();">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="Cart.updateQty('${item.bookId}', ${item.quantity + 1}); Pages.cart();" ${item.quantity >= item.maxQty ? 'disabled' : ''}>+</button>
                      </div>
                      <button class="btn btn-ghost btn-icon text-rose" onclick="Cart.removeItem('${item.bookId}'); Pages.cart(); Router._updateNavbar();" title="Remove">
                        ${Icons.trash}
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Fulfillment Selection -->
              <div class="card mt-2">
                <h3 class="card-title mb-1">How would you like to get your books?</h3>
                <div class="fulfillment-selector">
                  <div class="fulfillment-option ${Pages._fulfillment === 'delivery' ? 'selected' : ''}"
                       onclick="Pages._setFulfillment('delivery')">
                    <div class="fulfillment-option-icon">🚚</div>
                    <div class="fulfillment-option-title">Delivery</div>
                    <div class="fulfillment-option-desc">Shipped to your address</div>
                  </div>
                  <div class="fulfillment-option ${Pages._fulfillment === 'collect' ? 'selected' : ''}"
                       onclick="Pages._setFulfillment('collect')">
                    <div class="fulfillment-option-icon">🏪</div>
                    <div class="fulfillment-option-title">Reserve & Collect</div>
                    <div class="fulfillment-option-desc">Pick up at our store</div>
                  </div>
                </div>

                <!-- Delivery Form -->
                <div id="delivery-form" class="${Pages._fulfillment === 'delivery' ? '' : 'hidden'}">
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Full Name *</label>
                      <input type="text" class="form-input" id="ship-name" placeholder="Your full name" value="${Auth.user?.name || ''}" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Phone *</label>
                      <input type="tel" class="form-input" id="ship-phone" placeholder="10-digit phone number" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Address *</label>
                    <textarea class="form-textarea" id="ship-address" placeholder="Street address, hostel name, room number..." rows="2"></textarea>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">City *</label>
                      <input type="text" class="form-input" id="ship-city" placeholder="City" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">PIN Code *</label>
                      <input type="text" class="form-input" id="ship-zip" placeholder="6-digit PIN" maxlength="6" />
                    </div>
                  </div>
                </div>

                <!-- Collect Form -->
                <div id="collect-form" class="${Pages._fulfillment === 'collect' ? '' : 'hidden'}">
                  <div class="card" style="background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.15); margin-bottom: 1rem;">
                    <p class="text-sm" style="display: flex; align-items: center; gap: 0.5rem;">
                      ${Icons.mapPin} <strong>Store Location:</strong> BookWorm Store, Gate 4, University Campus
                    </p>
                    <p class="text-sm text-muted mt-1">Open Mon–Sat, 9:00 AM – 6:00 PM</p>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Preferred Collection Date *</label>
                      <input type="date" class="form-input" id="collect-date"
                        min="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}"
                        max="${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Time Slot *</label>
                      <select class="form-select" id="collect-time">
                        <option value="">Select a time slot</option>
                        <option value="9:00 AM - 11:00 AM">9:00 AM – 11:00 AM</option>
                        <option value="11:00 AM - 1:00 PM">11:00 AM – 1:00 PM</option>
                        <option value="2:00 PM - 4:00 PM">2:00 PM – 4:00 PM</option>
                        <option value="4:00 PM - 6:00 PM">4:00 PM – 6:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div>
              <div class="cart-summary" style="position: sticky; top: 90px;">
                <h3 class="card-title" style="margin-bottom: 1rem;">Order Summary</h3>
                ${items.map(item => `
                  <div class="cart-summary-row">
                    <span class="text-secondary text-sm" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.title} × ${item.quantity}</span>
                    <span class="text-sm">${Utils.formatPrice(item.price * item.quantity)}</span>
                  </div>
                `).join('')}
                ${Pages._fulfillment === 'delivery' ? `
                  <div class="cart-summary-row">
                    <span class="text-secondary text-sm">Shipping</span>
                    <span class="text-sm">${Cart.total >= 500 ? '<span class="text-emerald">FREE</span>' : Utils.formatPrice(49)}</span>
                  </div>
                ` : ''}
                <div class="cart-summary-row total">
                  <span>Total</span>
                  <span class="cart-total-amount">${Utils.formatPrice(Cart.total + (Pages._fulfillment === 'delivery' && Cart.total < 500 ? 49 : 0))}</span>
                </div>
                ${Pages._fulfillment === 'delivery' && Cart.total < 500 ? `
                  <p class="text-xs text-amber mb-1">💡 Add ₹${(500 - Cart.total).toFixed(0)} more for free shipping!</p>
                ` : ''}
                <button class="btn btn-primary w-full btn-lg" onclick="Pages._placeOrder()">
                  ${Pages._fulfillment === 'delivery' ? '🚚 Place Order' : '🏪 Reserve Books'}
                </button>
                <p class="text-xs text-muted text-center mt-1">
                  ${Pages._fulfillment === 'collect' ? 'Pay at the store during pickup' : 'Cash on delivery available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      `;
    };

    renderCart();
  },

  _fulfillment: 'delivery',

  _setFulfillment(type) {
    this._fulfillment = type;
    this.cart(); // re-render
  },

  async _placeOrder() {
    const items = Cart.items;
    if (items.length === 0) return;

    // Validate fulfillment details
    if (this._fulfillment === 'delivery') {
      const name = document.getElementById('ship-name')?.value.trim();
      const phone = document.getElementById('ship-phone')?.value.trim();
      const address = document.getElementById('ship-address')?.value.trim();
      const city = document.getElementById('ship-city')?.value.trim();
      const zip = document.getElementById('ship-zip')?.value.trim();

      if (!name || !phone || !address || !city || !zip) {
        Toast.error('Please fill in all shipping fields.');
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        Toast.error('Please enter a valid 10-digit phone number.');
        return;
      }
      if (!/^\d{6}$/.test(zip)) {
        Toast.error('Please enter a valid 6-digit PIN code.');
        return;
      }

      const shippingCost = Cart.total >= 500 ? 0 : 49;
      const result = await DB.createOrder({
        userId: Auth.user.id,
        fulfillmentType: 'delivery',
        items: items.map(i => ({ bookId: i.bookId, quantity: i.quantity, priceAtPurchase: i.price })),
        totalAmount: Cart.total + shippingCost,
        shippingName: name,
        shippingAddress: address,
        shippingCity: city,
        shippingZip: zip,
        shippingPhone: phone
      });

      if (result.error) { Toast.error(result.error); return; }

      Cart.clear();
      Router._updateNavbar();
      Toast.success('🎉 Order placed successfully! Your books will be delivered soon.');
      Router.navigate('orders');

    } else {
      const date = document.getElementById('collect-date')?.value;
      const time = document.getElementById('collect-time')?.value;

      if (!date || !time) {
        Toast.error('Please select a collection date and time slot.');
        return;
      }

      const result = await DB.createOrder({
        userId: Auth.user.id,
        fulfillmentType: 'collect',
        items: items.map(i => ({ bookId: i.bookId, quantity: i.quantity, priceAtPurchase: i.price })),
        totalAmount: Cart.total,
        collectDate: date,
        collectTimeSlot: time
      });

      if (result.error) { Toast.error(result.error); return; }

      Cart.clear();
      Router._updateNavbar();
      Toast.success('🎉 Books reserved! Pick them up at the store on your chosen date.');
      Router.navigate('orders');
    }
  },

  // ── MY ORDERS PAGE ──
  async orders() {
    const page = document.getElementById('page-content');
    Utils.showLoader(page);

    const orders = await DB.getOrders(Auth.user?.id);

    page.innerHTML = `
      <div class="container section">
        <div class="section-header">
          <div>
            <h1 class="section-title font-display">My Orders</h1>
            <p class="section-subtitle">${orders.length} order${orders.length !== 1 ? 's' : ''}</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('catalog')">
            ${Icons.book} Browse Books
          </button>
        </div>

        ${orders.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3 class="empty-state-title">No orders yet</h3>
            <p class="empty-state-desc">Start shopping to see your orders here.</p>
            <button class="btn btn-primary" onclick="Router.navigate('catalog')">Browse Catalog</button>
          </div>
        ` : ''}

        <div id="orders-list">
          ${await Promise.all(orders.map(async order => {
            const statusClass = Utils.getStatusBadgeClass(order.status);
            const itemDetails = await Promise.all(order.items.map(async item => {
              const book = await DB.getBookById(item.bookId);
              return `<li>📕 ${book ? book.title : 'Unknown Book'} × ${item.quantity} — ${Utils.formatPrice(item.priceAtPurchase * item.quantity)}</li>`;
            }));
            return `
              <div class="order-card">
                <div class="order-card-header">
                  <div>
                    <span class="order-id">#${order.id.slice(-8).toUpperCase()}</span>
                    <span class="order-date" style="margin-left: 0.75rem;">${Utils.formatDateTime(order.createdAt)}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="badge badge-status ${statusClass}">${order.status}</span>
                    <span class="badge badge-status" style="background: rgba(148,163,184,0.1); color: var(--text-muted); border: 1px solid var(--border-color);">
                      ${order.fulfillmentType === 'delivery' ? '🚚 Delivery' : '🏪 Collect'}
                    </span>
                  </div>
                </div>
                <ul class="order-items-list">
                  ${itemDetails.join('')}
                </ul>
                <div class="order-card-footer">
                  <span class="order-total">Total: ${Utils.formatPrice(order.totalAmount)}</span>
                  ${order.fulfillmentType === 'collect' && order.status === 'pending' ? `
                    <span class="text-sm text-secondary">📅 Pickup: ${Utils.formatDate(order.collectDate)} at ${order.collectTimeSlot}</span>
                  ` : ''}
                  ${order.fulfillmentType === 'delivery' && order.shippingCity ? `
                    <span class="text-sm text-secondary">📍 ${order.shippingCity}</span>
                  ` : ''}
                </div>
              </div>
            `;
          })).then(cards => cards.join(''))}
        </div>
      </div>
    `;
  },

  // ── LOGIN PAGE ──
  login() {
    const page = document.getElementById('page-content');
    Pages._selectedRole = 'student';

    page.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div style="text-align: center; margin-bottom: 1rem;">
            <span style="font-size: 2.5rem;">📚</span>
          </div>
          <h1>Welcome to BookWorm</h1>
          <p class="login-subtitle">Sign in to start shopping or manage your store.</p>

          <div class="role-selector">
            <div class="role-option selected" id="role-student" onclick="Pages._selectRole('student')">
              <div class="role-option-icon">🎓</div>
              <div class="role-option-label">Student</div>
            </div>
            <div class="role-option" id="role-admin" onclick="Pages._selectRole('admin')">
              <div class="role-option-icon">🔧</div>
              <div class="role-option-label">Store Admin</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Your Name *</label>
            <input type="text" class="form-input" id="login-name" placeholder="e.g. Aarav Patel" />
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input type="email" class="form-input" id="login-email" placeholder="you@university.edu" />
          </div>

          <button class="btn btn-primary w-full btn-lg" onclick="Pages._handleLogin()">
            Sign In
          </button>

          <p class="text-xs text-muted text-center mt-1">
            Use admin@bookworm.com for admin access.
          </p>
        </div>
      </div>
    `;
  },

  _selectedRole: 'student',

  _selectRole(role) {
    this._selectedRole = role;
    document.getElementById('role-student').classList.toggle('selected', role === 'student');
    document.getElementById('role-admin').classList.toggle('selected', role === 'admin');
  },

  async _handleLogin() {
    const name = document.getElementById('login-name')?.value.trim();
    const email = document.getElementById('login-email')?.value.trim();

    if (!name || !email) {
      Toast.error('Please enter your name and email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Toast.error('Please enter a valid email address.');
      return;
    }

    Toast.info('Signing in...');
    const user = await Auth.login(name, email, this._selectedRole);
    if (!user) {
      Toast.error('Login failed. Please try again.');
      return;
    }

    Toast.success(`Welcome, ${user.name}! Signed in as ${user.role}.`);
    Router.navigate(user.role === 'admin' ? 'admin' : 'catalog');
    Router._updateNavbar();
  },

  // ── ADMIN DASHBOARD ──
  async adminDashboard() {
    const page = document.getElementById('page-content');
    Utils.showLoader(page);

    const [stats, allOrders, allBooks] = await Promise.all([
      DB.getStats(),
      DB.getOrders(),
      DB.getBooks()
    ]);
    const recentOrders = allOrders.slice(0, 5);
    const lowStockBooks = allBooks.filter(b => b.quantity > 0 && b.quantity <= 2);

    page.innerHTML = `
      <div class="admin-layout">
        ${Components.adminSidebar('dashboard')}
        <div class="admin-content">
          <h1 class="section-title font-display mb-2">Dashboard</h1>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: rgba(245, 158, 11, 0.12); color: var(--amber-400);">📚</div>
              <div class="stat-card-value">${stats.totalBooks}</div>
              <div class="stat-card-label">Total Books</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: rgba(52, 211, 153, 0.12); color: var(--emerald-400);">📦</div>
              <div class="stat-card-value">${stats.totalStock}</div>
              <div class="stat-card-label">Copies in Stock</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: rgba(251, 191, 36, 0.12); color: var(--amber-400);">⏳</div>
              <div class="stat-card-value">${stats.pendingOrders}</div>
              <div class="stat-card-label">Pending Orders</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: rgba(167, 139, 250, 0.12); color: var(--violet-400);">💰</div>
              <div class="stat-card-value">${Utils.formatPrice(stats.revenue)}</div>
              <div class="stat-card-label">Total Revenue</div>
            </div>
          </div>

          <!-- Alerts Row -->
          ${stats.lowStock > 0 || stats.outOfStock > 0 ? `
            <div class="card mb-2" style="border-color: rgba(251, 191, 36, 0.3); background: rgba(251, 191, 36, 0.04);">
              <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--amber-400);">
                ${Icons.alertTriangle}
                <strong class="text-sm">Inventory Alerts</strong>
              </div>
              <p class="text-sm text-secondary mt-1">
                ${stats.lowStock > 0 ? `${stats.lowStock} book(s) with low stock (≤ 2).` : ''}
                ${stats.outOfStock > 0 ? ` ${stats.outOfStock} book(s) out of stock.` : ''}
              </p>
            </div>
          ` : ''}

          <div style="display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 1.5rem;">
            <!-- Recent Orders -->
            <div>
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Recent Orders</h3>
                  <button class="btn btn-ghost btn-sm" onclick="Router.navigate('admin/orders')">View All ${Icons.chevronRight}</button>
                </div>
                ${recentOrders.length === 0 ? '<p class="text-muted text-sm">No orders yet.</p>' : `
                  <div class="data-table-wrapper">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${recentOrders.map(o => `
                          <tr>
                            <td class="text-sm" style="font-family: monospace;">#${o.id.slice(-8).toUpperCase()}</td>
                            <td><span class="text-sm">${o.fulfillmentType === 'delivery' ? '🚚' : '🏪'} ${o.fulfillmentType}</span></td>
                            <td><span class="badge badge-status ${Utils.getStatusBadgeClass(o.status)}">${o.status}</span></td>
                            <td class="text-sm font-semibold">${Utils.formatPrice(o.totalAmount)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                `}
              </div>
            </div>

            <!-- Low Stock -->
            <div>
              <div class="card">
                <h3 class="card-title mb-1">⚠️ Low Stock</h3>
                ${lowStockBooks.length === 0 ? '<p class="text-muted text-sm">All books are well-stocked!</p>' : `
                  ${lowStockBooks.map(b => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                      <div>
                        <div class="text-sm font-medium">${b.title.length > 25 ? b.title.slice(0, 25) + '…' : b.title}</div>
                        <div class="text-xs text-muted">${b.author}</div>
                      </div>
                      <span class="badge badge-worn">${b.quantity} left</span>
                    </div>
                  `).join('')}
                `}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ── ADMIN: INVENTORY MANAGEMENT ──
  async adminInventory() {
    const page = document.getElementById('page-content');
    Utils.showLoader(page);

    let books = await DB.getBooks();

    const renderInventory = (filteredBooks) => {
      const content = document.getElementById('admin-inventory-content');
      if (!content) return;

      content.innerHTML = `
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Condition</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBooks.map(b => `
                <tr>
                  <td>
                    <div class="flex items-center gap-05">
                      <span style="font-size: 1.25rem;">${Utils.getBookEmoji(b.genre)}</span>
                      <span class="text-sm font-medium">${b.title.length > 30 ? b.title.slice(0, 30) + '…' : b.title}</span>
                    </div>
                  </td>
                  <td class="text-sm text-secondary">${b.author}</td>
                  <td class="text-sm text-muted" style="font-family: monospace; font-size: 0.75rem;">${b.isbn || '—'}</td>
                  <td><span class="badge ${Utils.getConditionBadgeClass(b.condition)}">${b.condition}</span></td>
                  <td class="text-sm font-semibold text-emerald">${Utils.formatPrice(b.studentPrice)}</td>
                  <td>
                    <span class="text-sm ${b.quantity === 0 ? 'text-rose' : b.quantity <= 2 ? 'text-amber' : ''}">${b.quantity}</span>
                  </td>
                  <td>
                    <div class="flex gap-05">
                      <button class="btn btn-ghost btn-sm btn-icon" onclick="Pages._editBook('${b.id}')" title="Edit">${Icons.edit}</button>
                      <button class="btn btn-ghost btn-sm btn-icon text-rose" onclick="Pages._deleteBook('${b.id}')" title="Delete">${Icons.trash}</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    page.innerHTML = `
      <div class="admin-layout">
        ${Components.adminSidebar('inventory')}
        <div class="admin-content">
          <div class="section-header">
            <div>
              <h1 class="section-title font-display">Inventory</h1>
              <p class="section-subtitle">${books.length} books in catalog</p>
            </div>
            <button class="btn btn-primary" onclick="Pages._addBook()">
              ${Icons.plus} Add Book
            </button>
          </div>

          <div class="filter-bar">
            <div class="search-input-wrap">
              <span class="search-icon">${Icons.search}</span>
              <input type="text" id="admin-search" placeholder="Search inventory..." autocomplete="off" />
            </div>
          </div>

          <div id="admin-inventory-content"></div>
        </div>
      </div>
    `;

    renderInventory(books);

    // Search
    const searchInput = document.getElementById('admin-search');
    searchInput.addEventListener('input', Utils.debounce(() => {
      const q = searchInput.value.toLowerCase();
      const filtered = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.includes(q))
      );
      renderInventory(filtered);
    }, 300));
  },

  _addBook() {
    this._showBookModal(null);
  },

  async _editBook(bookId) {
    const book = await DB.getBookById(bookId);
    if (book) this._showBookModal(book);
  },

  async _deleteBook(bookId) {
    const book = await DB.getBookById(bookId);
    if (!book) return;
    if (confirm(`Delete "${book.title}"? This cannot be undone.`)) {
      await DB.deleteBook(bookId);
      Toast.success('Book deleted.');
      this.adminInventory();
    }
  },

  _showBookModal(book) {
    const isEdit = !!book;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'book-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Edit Book' : 'Add New Book'}</h3>
          <button class="modal-close" onclick="document.getElementById('book-modal-overlay').remove()">${Icons.x}</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" class="form-input" id="modal-title" placeholder="Book title" value="${isEdit ? book.title : ''}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Author *</label>
              <input type="text" class="form-input" id="modal-author" placeholder="Author name" value="${isEdit ? book.author : ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">ISBN</label>
              <input type="text" class="form-input" id="modal-isbn" placeholder="978-XXXXXXXXXX" value="${isEdit ? (book.isbn || '') : ''}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Condition *</label>
              <select class="form-select" id="modal-condition">
                <option value="Like New" ${isEdit && book.condition === 'Like New' ? 'selected' : ''}>Like New</option>
                <option value="Good" ${isEdit && book.condition === 'Good' ? 'selected' : ''}>Good</option>
                <option value="Fair" ${isEdit && book.condition === 'Fair' ? 'selected' : ''}>Fair</option>
                <option value="Worn" ${isEdit && book.condition === 'Worn' ? 'selected' : ''}>Worn</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Genre</label>
              <select class="form-select" id="modal-genre">
                <option value="">Select genre</option>
                ${['Computer Science','Mathematics','Physics','Engineering','Chemistry','Biology','Psychology','Economics','Literature','History','Art','Philosophy','Business','Music','Other'].map(g =>
                  `<option value="${g}" ${isEdit && book.genre === g ? 'selected' : ''}>${g}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Student Price (₹) *</label>
              <input type="number" class="form-input" id="modal-price" placeholder="250" min="1" value="${isEdit ? book.studentPrice : ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Original Price (₹)</label>
              <input type="number" class="form-input" id="modal-original" placeholder="1200" min="0" value="${isEdit ? (book.originalPrice || '') : ''}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Quantity *</label>
              <input type="number" class="form-input" id="modal-qty" placeholder="1" min="0" value="${isEdit ? book.quantity : '1'}" />
            </div>
            <div class="form-group">
              <label class="form-label">Cover Photo (Optional)</label>
              <input type="file" class="form-input" id="modal-image" accept="image/*" style="padding: 0.5rem 1rem;" />
            </div>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" id="modal-description" placeholder="Book condition details, highlights, etc.">${isEdit ? (book.description || '') : ''}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('book-modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" id="modal-save-btn">${isEdit ? 'Save Changes' : 'Add Book'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('modal-save-btn').addEventListener('click', async () => {
      const title = document.getElementById('modal-title').value.trim();
      const author = document.getElementById('modal-author').value.trim();
      const isbn = document.getElementById('modal-isbn').value.trim();
      const condition = document.getElementById('modal-condition').value;
      const genre = document.getElementById('modal-genre').value;
      const studentPrice = parseFloat(document.getElementById('modal-price').value);
      const originalPrice = parseFloat(document.getElementById('modal-original').value) || null;
      const quantity = parseInt(document.getElementById('modal-qty').value) || 0;
      const description = document.getElementById('modal-description').value.trim();

      if (!title || !author || !condition || isNaN(studentPrice) || studentPrice <= 0) {
        Toast.error('Please fill in all required fields with valid values.');
        return;
      }

      const data = { title, author, isbn, condition, genre, studentPrice, originalPrice, quantity, description };
      if (isEdit) data.imageUrl = book.imageUrl; // Keep existing if not changed

      const imageFile = document.getElementById('modal-image').files[0];
      if (imageFile) {
        document.getElementById('modal-save-btn').innerText = 'Uploading Image...';
        document.getElementById('modal-save-btn').disabled = true;
        const uploadedUrl = await DB.uploadImage(imageFile);
        if (uploadedUrl) {
          data.imageUrl = uploadedUrl;
        } else {
          Toast.error('Image upload failed. Saving without photo.');
        }
      }

      if (isEdit) {
        await DB.updateBook(book.id, data);
        Toast.success('Book updated successfully!');
      } else {
        await DB.addBook(data);
        Toast.success('Book added to inventory!');
      }

      overlay.remove();
      Pages.adminInventory();
    });
  },

  // ── ADMIN: ORDER MANAGEMENT ──
  async adminOrders() {
    const page = document.getElementById('page-content');
    Utils.showLoader(page);

    const allOrders = await DB.getOrders();
    const allUsers = await DB.getUsers();

    Pages._adminOrderFilter = Pages._adminOrderFilter || 'all';

    const filteredOrders = Pages._adminOrderFilter === 'all'
      ? allOrders
      : allOrders.filter(o => o.status === Pages._adminOrderFilter);

    const statusCounts = {
      all: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      confirmed: allOrders.filter(o => o.status === 'confirmed').length,
      shipped: allOrders.filter(o => o.status === 'shipped').length,
      collected: allOrders.filter(o => o.status === 'collected').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length
    };

    // Pre-fetch book titles for all order items
    const allBookIds = [...new Set(filteredOrders.flatMap(o => o.items.map(i => i.bookId)))];
    const bookMap = {};
    for (const bid of allBookIds) {
      const bk = await DB.getBookById(bid);
      bookMap[bid] = bk;
    }

    page.innerHTML = `
      <div class="admin-layout">
        ${Components.adminSidebar('orders')}
        <div class="admin-content">
          <h1 class="section-title font-display mb-2">Order Management</h1>

          <!-- Status Tabs -->
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
            ${Object.entries(statusCounts).map(([status, count]) => `
              <button class="btn btn-sm ${Pages._adminOrderFilter === status ? 'btn-primary' : 'btn-secondary'}"
                onclick="Pages._adminOrderFilter = '${status}'; Pages.adminOrders();">
                ${status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} (${count})
              </button>
            `).join('')}
          </div>

          ${filteredOrders.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <h3 class="empty-state-title">No ${Pages._adminOrderFilter !== 'all' ? Pages._adminOrderFilter + ' ' : ''}orders</h3>
            </div>
          ` : ''}

          <div>
            ${filteredOrders.map(order => {
              const user = allUsers.find(u => u.id === order.userId);
              const statusClass = Utils.getStatusBadgeClass(order.status);
              const nextStatuses = Pages._getNextStatuses(order);

              return `
                <div class="order-card">
                  <div class="order-card-header">
                    <div>
                      <span class="order-id">#${order.id.slice(-8).toUpperCase()}</span>
                      <span class="order-date" style="margin-left: 0.75rem;">${Utils.formatDateTime(order.createdAt)}</span>
                      <span class="text-sm text-secondary" style="margin-left: 0.75rem;">by ${user ? user.name : 'Unknown'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span class="badge badge-status ${statusClass}">${order.status}</span>
                      <span class="text-sm text-muted">${order.fulfillmentType === 'delivery' ? '🚚 Delivery' : '🏪 Collect'}</span>
                    </div>
                  </div>

                  <ul class="order-items-list">
                    ${order.items.map(item => {
                      const bk = bookMap[item.bookId];
                      return `<li>📕 ${bk ? bk.title : 'Deleted Book'} × ${item.quantity} — ${Utils.formatPrice(item.priceAtPurchase * item.quantity)}</li>`;
                    }).join('')}
                  </ul>

                  ${order.fulfillmentType === 'delivery' && order.shippingAddress ? `
                    <p class="text-xs text-muted mb-1">📍 ${order.shippingName}, ${order.shippingAddress}, ${order.shippingCity} - ${order.shippingZip} | 📞 ${order.shippingPhone}</p>
                  ` : ''}
                  ${order.fulfillmentType === 'collect' && order.collectDate ? `
                    <p class="text-xs text-muted mb-1">📅 Collection: ${Utils.formatDate(order.collectDate)} at ${order.collectTimeSlot}</p>
                  ` : ''}

                  <div class="order-card-footer">
                    <span class="order-total">Total: ${Utils.formatPrice(order.totalAmount)}</span>
                    <div class="flex gap-05">
                      ${nextStatuses.map(s => `
                        <button class="btn btn-sm ${s.class}" onclick="Pages._updateOrderStatus('${order.id}', '${s.value}')">
                          ${s.label}
                        </button>
                      `).join('')}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  _adminOrderFilter: 'all',

  _getNextStatuses(order) {
    const actions = [];
    if (order.status === 'pending') {
      actions.push({ value: 'confirmed', label: '✅ Confirm', class: 'btn-primary' });
      actions.push({ value: 'cancelled', label: '✕ Cancel', class: 'btn-danger' });
    }
    if (order.status === 'confirmed' && order.fulfillmentType === 'delivery') {
      actions.push({ value: 'shipped', label: '🚚 Mark Shipped', class: 'btn-primary' });
      actions.push({ value: 'cancelled', label: '✕ Cancel', class: 'btn-danger' });
    }
    if (order.status === 'confirmed' && order.fulfillmentType === 'collect') {
      actions.push({ value: 'collected', label: '🏪 Mark Collected', class: 'btn-primary' });
      actions.push({ value: 'cancelled', label: '✕ Cancel', class: 'btn-danger' });
    }
    return actions;
  },

  async _updateOrderStatus(orderId, status) {
    const labels = { confirmed: 'confirmed', shipped: 'shipped', collected: 'collected', cancelled: 'cancelled' };
    if (status === 'cancelled' && !confirm('Cancel this order? Stock will be restored.')) return;

    await DB.updateOrderStatus(orderId, status);
    Toast.success(`Order marked as ${labels[status]}.`);
    this.adminOrders();
  }
};
