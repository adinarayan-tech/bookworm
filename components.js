/* ============================================
   BookWorm — Reusable Components
   ============================================ */

const Components = {

  // ── Book Card ──
  bookCard(book, index = 0) {
    const emoji = Utils.getBookEmoji(book.genre);
    const conditionClass = Utils.getConditionBadgeClass(book.condition);
    const savings = Utils.calcSavings(book.originalPrice, book.studentPrice);
    const coverUrl = book.imageUrl || Utils.getBookCover(book.isbn);

    return `
      <div class="book-card" onclick="Router.navigate('book?id=${book.id}')"
           style="animation: fadeInUp 0.4s ease-out ${index * 0.06}s both;">
        <div class="book-card-image">
          ${coverUrl ? `
            <img src="${coverUrl}" alt="${book.title}" class="book-cover-img"
                 onload="if(this.naturalWidth<=1){this.style.display='none';this.nextElementSibling.style.display='flex';}"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
            <span class="book-cover-emoji book-cover-fallback">${emoji}</span>
          ` : `
            <span class="book-cover-emoji">${emoji}</span>
          `}
          <div class="book-card-condition">
            <span class="badge ${conditionClass}">${book.condition}</span>
          </div>
        </div>
        <div class="book-card-body">
          <div class="book-card-title">${book.title}</div>
          <div class="book-card-author">by ${book.author}</div>
          <div class="book-card-footer">
            <div class="book-price">
              <span class="book-price-current">${Utils.formatPrice(book.studentPrice)}</span>
              ${book.originalPrice ? `<span class="book-price-original">${Utils.formatPrice(book.originalPrice)}</span>` : ''}
            </div>
            <span class="book-stock ${book.quantity <= 2 ? 'low' : ''}">
              ${book.quantity > 0 ? `${book.quantity} left` : 'Out of stock'}
            </span>
          </div>
          ${savings > 0 ? `<div class="text-xs text-amber" style="margin-top: 0.4rem;">Save ${savings}%</div>` : ''}
        </div>
      </div>
    `;
  },

  // ── Admin Sidebar ──
  adminSidebar(active) {
    const links = [
      { key: 'dashboard', icon: Icons.dashboard, label: 'Dashboard', route: 'admin' },
      { key: 'inventory', icon: Icons.book, label: 'Inventory', route: 'admin/inventory' },
      { key: 'orders', icon: Icons.package, label: 'Orders', route: 'admin/orders' }
    ];

    return `
      <div class="admin-sidebar">
        ${links.map(l => `
          <div class="admin-sidebar-link ${active === l.key ? 'active' : ''}"
               onclick="Router.navigate('${l.route}')">
            ${l.icon}
            <span>${l.label}</span>
          </div>
        `).join('')}
        <div style="flex: 1;"></div>
        <div class="admin-sidebar-link" onclick="Router.navigate('')">
          ${Icons.chevronLeft}
          <span>Back to Store</span>
        </div>
      </div>
    `;
  }
};
