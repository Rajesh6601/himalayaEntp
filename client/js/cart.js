/* ===== Himalaya Enterprises - Cart & Inquiry (API + localStorage) ===== */

const Cart = {
  CART_KEY: 'he-cart',
  ORDERS_KEY: 'he-orders',
  FAVORITES_KEY: 'he-favorites',

  getItems() {
    return JSON.parse(localStorage.getItem(this.CART_KEY) || '[]');
  },

  saveItems(items) {
    localStorage.setItem(this.CART_KEY, JSON.stringify(items));
    this.updateBadge();
  },

  addItem(productId) {
    if (!Auth.isLoggedIn()) {
      Auth.showLoginModal();
      return;
    }
    const items = this.getItems();
    if (items.find(i => i.productId === productId)) {
      App.showToast('Already in your inquiry basket.', 'info');
      return;
    }
    const product = Catalog.getProduct(productId);
    if (!product) return;
    items.push({
      productId,
      name: product.name,
      category: product.category,
      price: product.price,
      priceMax: product.priceMax,
      icon: product.icon,
      addedAt: new Date().toISOString()
    });
    this.saveItems(items);
    App.showToast(`${product.name} added to inquiry basket.`, 'success');
  },

  removeItem(productId) {
    const items = this.getItems().filter(i => i.productId !== productId);
    this.saveItems(items);
    this.renderCart();
    App.showToast('Item removed from inquiry.', 'info');
  },

  clearCart() {
    this.saveItems([]);
    this.renderCart();
  },

  updateBadge() {
    const badge = document.getElementById('cartBadge');
    const count = this.getItems().length;
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  openCart() {
    const sidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.cart-overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('show');
    this.renderCart();
  },

  closeCart() {
    const sidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.cart-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  },

  renderCart() {
    const container = document.querySelector('.cart-items');
    if (!container) return;
    const items = this.getItems();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No items yet</h3>
          <p>Browse products and add items to your inquiry basket.</p>
        </div>`;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">${item.icon || '📦'}</div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${App.formatCurrency(item.price)} - ${App.formatCurrency(item.priceMax)}</p>
        </div>
        <button class="cart-item-remove" onclick="Cart.removeItem('${item.productId}')" title="Remove">&#10005;</button>
      </div>
    `).join('');
    this.updateBadge();
  },

  /* --- Submit Inquiry / RFQ --- */
  async submitInquiry(notes) {
    const items = this.getItems();
    if (items.length === 0) {
      App.showToast('Your inquiry basket is empty.', 'warning');
      return;
    }
    const session = Auth.getSession();
    if (!session) {
      Auth.showLoginModal();
      return;
    }

    // Try API
    const online = await API.check();
    if (online) {
      try {
        const apiItems = items.map(i => ({
          product_id: i.productId,
          name: i.name,
          category: i.category,
          quantity: 1,
          price: i.price,
          price_max: i.priceMax
        }));
        const result = await API.post('/orders', { type: 'inquiry', items: apiItems, notes: notes || '' });
        this.clearCart();
        this.closeCart();
        App.showToast(`Inquiry ${result.id} submitted successfully!`, 'success');
        return result;
      } catch (err) {
        App.showToast('API error: ' + err.message, 'error');
      }
    }

    // Fallback to localStorage
    const order = {
      id: 'ORD-' + App.generateId().toUpperCase(),
      buyerId: session.id,
      buyerName: session.name,
      buyerEmail: session.email,
      items: items,
      notes: notes || '',
      status: 'pending',
      type: 'inquiry',
      createdAt: new Date().toISOString()
    };
    const orders = this.getOrders();
    orders.push(order);
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
    this.clearCart();
    this.closeCart();
    App.showToast(`Inquiry ${order.id} submitted successfully!`, 'success');
    return order;
  },

  async submitRFQ(formData) {
    const session = Auth.getSession();
    if (!session) return;

    const online = await API.check();
    if (online) {
      try {
        const result = await API.post('/orders', {
          type: 'rfq',
          items: [{
            name: formData.productName,
            category: formData.category,
            specs: formData.specifications,
            quantity: parseInt(formData.quantity) || 1,
            price: 0,
            price_max: 0
          }],
          notes: formData.notes || ''
        });
        App.showToast(`RFQ ${result.id} submitted successfully!`, 'success');
        return result;
      } catch (err) {
        App.showToast('API error: ' + err.message, 'error');
      }
    }

    // Fallback
    const order = {
      id: 'RFQ-' + App.generateId().toUpperCase(),
      buyerId: session.id,
      buyerName: session.name,
      buyerEmail: session.email,
      items: [{
        name: formData.productName,
        category: formData.category,
        specs: formData.specifications,
        quantity: formData.quantity,
        icon: '🔧'
      }],
      notes: formData.notes || '',
      status: 'pending',
      type: 'rfq',
      createdAt: new Date().toISOString()
    };
    const orders = this.getOrders();
    orders.push(order);
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
    App.showToast(`RFQ ${order.id} submitted successfully!`, 'success');
    return order;
  },

  /* --- Orders --- */
  getOrders() {
    return JSON.parse(localStorage.getItem(this.ORDERS_KEY) || '[]');
  },

  async fetchOrders() {
    const online = await API.check();
    if (!online) return null;
    try {
      const orders = await API.get('/orders');
      // Normalize to match local format
      return orders.map(o => ({
        id: o.id,
        buyerId: o.buyer_id,
        buyerName: o.buyer_name || '',
        buyerEmail: o.buyer_email || '',
        items: (o.items || []).map(i => ({
          productId: i.product_id,
          name: i.name,
          category: i.category,
          specs: i.specs,
          quantity: i.quantity,
          price: Number(i.price || 0),
          priceMax: Number(i.price_max || 0),
          icon: i.icon || '📦'
        })),
        notes: o.notes,
        status: o.status,
        type: o.type,
        createdAt: o.created_at
      }));
    } catch { return null; }
  },

  getOrdersByBuyer(buyerId) {
    return this.getOrders().filter(o => o.buyerId === buyerId);
  },

  async updateOrderStatus(orderId, status) {
    const online = await API.check();
    if (online) {
      try {
        await API.patch('/orders/' + orderId + '/status', { status });
        return;
      } catch (err) {
        App.showToast('API error: ' + err.message, 'error');
      }
    }
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = status;
      localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
    }
  },

  /* --- Favorites --- */
  getFavorites() {
    return JSON.parse(localStorage.getItem(this.FAVORITES_KEY) || '[]');
  },

  async toggleFavorite(productId) {
    const online = await API.check();
    let favs = this.getFavorites();

    if (favs.includes(productId)) {
      favs = favs.filter(f => f !== productId);
      if (online) { try { await API.del('/favorites/' + productId); } catch {} }
      App.showToast('Removed from favorites.', 'info');
    } else {
      favs.push(productId);
      if (online) { try { await API.post('/favorites/' + productId); } catch {} }
      App.showToast('Added to favorites!', 'success');
    }
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favs));
  },

  isFavorite(productId) {
    return this.getFavorites().includes(productId);
  },

  /* --- Order Detail & Negotiation --- */
  async fetchOrderDetail(orderId) {
    try {
      const o = await API.get('/orders/' + orderId);
      return {
        id: o.id,
        buyerId: o.buyer_id,
        buyerName: o.buyer_name || '',
        buyerEmail: o.buyer_email || '',
        buyerPhone: o.buyer_phone || '',
        buyerCompany: o.buyer_company || '',
        items: (o.items || []).map(i => ({
          productId: i.product_id,
          name: i.name,
          category: i.category,
          specs: i.specs,
          quantity: i.quantity,
          price: Number(i.price || 0),
          priceMax: Number(i.price_max || 0)
        })),
        notes: o.notes,
        status: o.status,
        type: o.type,
        totalValue: Number(o.total_value || 0),
        latestQuote: o.latest_quote,
        messageCount: o.message_count,
        createdAt: o.created_at,
        updatedAt: o.updated_at
      };
    } catch (err) {
      App.showToast('Failed to load order details: ' + err.message, 'error');
      return null;
    }
  },

  async fetchOrderMessages(orderId) {
    try {
      const msgs = await API.get('/orders/' + orderId + '/messages');
      return msgs.map(m => ({
        id: m.id,
        orderId: m.order_id,
        senderId: m.sender_id,
        senderRole: m.sender_role,
        senderName: m.sender_name || '',
        senderCompany: m.sender_company || '',
        type: m.type,
        quotedPrice: m.quoted_price ? Number(m.quoted_price) : null,
        deliveryEstimate: m.delivery_estimate,
        message: m.message,
        createdAt: m.created_at
      }));
    } catch (err) {
      App.showToast('Failed to load messages: ' + err.message, 'error');
      return [];
    }
  },

  async sendOrderMessage(orderId, data) {
    try {
      const result = await API.post('/orders/' + orderId + '/messages', data);
      return result;
    } catch (err) {
      App.showToast('Failed to send message: ' + err.message, 'error');
      return null;
    }
  },

  getStatusLabel(status) {
    const labels = {
      pending: '<span class="badge badge-yellow">Pending</span>',
      quoted: '<span class="badge badge-blue">Quoted</span>',
      negotiating: '<span class="badge badge-purple">Negotiating</span>',
      accepted: '<span class="badge badge-green">Accepted</span>',
      po_issued: '<span class="badge badge-green">PO Issued</span>',
      confirmed: '<span class="badge badge-blue">Confirmed</span>',
      'in-progress': '<span class="badge badge-blue">In Progress</span>',
      completed: '<span class="badge badge-green">Completed</span>',
      cancelled: '<span class="badge badge-red">Cancelled</span>'
    };
    return labels[status] || status;
  },

  renderStatusTimeline(status) {
    const steps = [
      { key: 'pending', label: 'Submitted' },
      { key: 'quoted', label: 'Quoted' },
      { key: 'negotiating', label: 'Negotiating' },
      { key: 'accepted', label: 'Accepted' },
      { key: 'po_issued', label: 'PO Issued' },
      { key: 'in-progress', label: 'In Progress' },
      { key: 'completed', label: 'Completed' }
    ];
    const statusOrder = steps.map(s => s.key);
    let currentIdx = statusOrder.indexOf(status);
    // Map confirmed to in-progress position for display
    if (status === 'confirmed') currentIdx = statusOrder.indexOf('in-progress');
    if (status === 'cancelled') currentIdx = -1;
    return `<div class="status-timeline">
      ${steps.map((s, i) => `
        <div class="status-step">
          <div class="status-dot ${i < currentIdx ? 'completed' : ''} ${i === currentIdx ? 'current' : ''} ${status === 'cancelled' && i === 0 ? 'current' : ''}"></div>
          <span class="status-label">${s.label}</span>
        </div>
        ${i < steps.length - 1 ? `<div class="status-line ${i < currentIdx ? 'completed' : ''}"></div>` : ''}
      `).join('')}
    </div>`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
  Cart.renderCart();
});
