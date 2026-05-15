/* ===== Himalaya Enterprises - Product Catalog (API + localStorage) ===== */

const Catalog = {
  PRODUCTS_KEY: 'he-products',
  _cache: null, // in-memory cache for API products

  init() {
    this.seedProducts();
  },

  /* -- Resolve asset base path depending on page location -- */
  getImageBasePath() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) return '../assets/';
    return 'assets/';
  },

  seedProducts() {
    const SEED_VERSION = 4; // bump to force re-seed with container-bodies category
    if (localStorage.getItem(this.PRODUCTS_KEY) && localStorage.getItem('he-seed-v') === String(SEED_VERSION)) return;
    localStorage.setItem('he-seed-v', String(SEED_VERSION));
    const products = [
      {
        id: 'p1', name: '10-Wheeler Tipper Body', category: 'tippers',
        specs: 'Capacity: 16 cubic meters | Material: High-tensile steel | Hydraulic lift system',
        price: 285000, priceMax: 350000, stock: 5, status: 'available',
        icon: '🚛', image: 'tipper.jpg', description: 'Heavy-duty tipper body designed for mining and construction. Features reinforced floor plates and side walls for maximum durability.'
      },
      {
        id: 'p2', name: '6-Wheeler Tipper Body', category: 'tippers',
        specs: 'Capacity: 10 cubic meters | Mild steel construction | Standard hydraulic',
        price: 185000, priceMax: 230000, stock: 8, status: 'available',
        icon: '🚛', image: 'tipper-1.jpg', description: 'Medium-duty tipper body ideal for sand, gravel, and aggregate transport. Lightweight yet sturdy construction.'
      },
      {
        id: 'p3', name: '12-Wheeler Tipper Body', category: 'tippers',
        specs: 'Capacity: 22 cubic meters | Hardox steel | Heavy hydraulic system',
        price: 420000, priceMax: 520000, stock: 0, status: 'production',
        icon: '🚛', image: 'tip-trailor.jpg', description: 'Extra heavy-duty tipper for large-scale mining operations. Built with imported Hardox steel for extreme wear resistance.'
      },
      {
        id: 'p4', name: '40ft Flatbed Trailer', category: 'trailers',
        specs: 'Length: 40ft | Payload: 35 tons | Multi-axle suspension',
        price: 550000, priceMax: 700000, stock: 3, status: 'available',
        icon: '🚚', image: 'flat-bed-trailor.jpg', description: 'Standard flatbed trailer for general cargo transport. Features robust chassis and reliable suspension system.'
      },
      {
        id: 'p5', name: 'Low-Bed Trailer', category: 'trailers',
        specs: 'Payload: 60 tons | Hydraulic ramps | Detachable gooseneck',
        price: 850000, priceMax: 1100000, stock: 1, status: 'available',
        icon: '🚚', image: 'tip-trailor-2.jpg', description: 'Heavy equipment transport trailer with low deck height. Perfect for machinery, excavators, and oversized cargo.'
      },
      {
        id: 'p6', name: 'Skeletal Container Trailer', category: 'container-bodies',
        specs: '20/40ft container compatible | Twist locks | Lightweight frame',
        price: 380000, priceMax: 480000, stock: 0, status: 'order',
        icon: '📦', image: 'container-bodies.jpg', description: 'Container chassis trailer designed for intermodal transport. Compatible with standard ISO containers.'
      },
      {
        id: 'p7', name: 'Tractor Trolley Body', category: 'tractors',
        specs: 'Capacity: 8 tons | Tipping mechanism | Agricultural grade',
        price: 120000, priceMax: 160000, stock: 12, status: 'available',
        icon: '🚜', image: 'tractor-trolley.jpg', description: 'Agricultural tractor trolley body with hydraulic tipping. Ideal for farm produce, soil, and material transport.'
      },
      {
        id: 'p8', name: 'Heavy Tractor Chassis', category: 'tractors',
        specs: 'For 50+ HP tractors | Reinforced frame | PTO compatible',
        price: 95000, priceMax: 140000, stock: 6, status: 'available',
        icon: '🚜', image: 'tractor-trolley.jpg', description: 'Custom tractor chassis body for heavy-duty agricultural and industrial applications.'
      },
      {
        id: 'p9', name: '10,000L Water Tank', category: 'water-tanks',
        specs: 'Capacity: 10,000 liters | SS304 / MS options | Mounted or standalone',
        price: 175000, priceMax: 250000, stock: 4, status: 'available',
        icon: '💧', image: '10K-water-tanker.jpeg', description: 'Industrial water storage and transport tank. Available in stainless steel or mild steel variants.'
      },
      {
        id: 'p10', name: '20,000L Water Tanker', category: 'water-tanks',
        specs: 'Capacity: 20,000 liters | Vehicle-mounted | Spray system included',
        price: 320000, priceMax: 420000, stock: 2, status: 'available',
        icon: '💧', image: '20k-water-tanker.jpeg', description: 'Large capacity vehicle-mounted water tanker with integrated spray system for municipal and industrial use.'
      },
      {
        id: 'p11', name: '5,000L Water Tank', category: 'water-tanks',
        specs: 'Capacity: 5,000 liters | Compact design | Quick-mount system',
        price: 95000, priceMax: 130000, stock: 0, status: 'production',
        icon: '💧', image: '5k-water-tanker.jpg', description: 'Compact water tank suitable for smaller vehicles and localized water supply needs.'
      },
      {
        id: 'p12', name: 'Custom Truck Body', category: 'container-bodies',
        specs: 'Built to specification | Any vehicle type | Design consultation',
        price: 200000, priceMax: 800000, stock: 0, status: 'order',
        icon: '📦', image: 'container-bodies.jpg', description: 'Fully customized truck body fabrication based on your exact requirements. Includes design consultation and engineering.'
      },
      {
        id: 'p13', name: 'Crane Body Fabrication', category: 'custom',
        specs: 'Crane mounting platform | Outrigger supports | Structural certification',
        price: 450000, priceMax: 900000, stock: 0, status: 'order',
        icon: '🔧', description: 'Specialized crane body and mounting platform fabrication with structural engineering certification.'
      },
      {
        id: 'p14', name: 'Hydraulic Tipper Kit', category: 'custom',
        specs: 'Retrofit kit | 15-ton capacity | Complete hydraulic system',
        price: 85000, priceMax: 120000, stock: 7, status: 'available',
        icon: '🔧', image: 'tip-trailor-34cum.jpg', description: 'Complete hydraulic tipper conversion kit for existing truck bodies. Easy installation with full support.'
      }
    ];
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
  },

  /* -- Normalize API product row to match local format -- */
  _normalize(row) {
    const images = row.images || [];
    return {
      id: row.id,
      name: row.name,
      category: row.category_id || row.category,
      specs: row.specs,
      description: row.description,
      price: Number(row.price_min || row.price || 0),
      priceMax: Number(row.price_max || row.priceMax || 0),
      stock: row.stock,
      status: row.status,
      icon: row.icon || '📦',
      image: images.length > 0 ? images[0] : (row.image || null),
      categoryName: row.category_name
    };
  },

  /* -- Get all products (API first, localStorage fallback) -- */
  async fetchProducts(query) {
    const online = await API.check();
    if (!online) return null; // signal to use local
    let qs = '';
    if (query) {
      const parts = [];
      if (query.category && query.category !== 'all') parts.push('category=' + encodeURIComponent(query.category));
      if (query.search) parts.push('search=' + encodeURIComponent(query.search));
      if (query.status && query.status !== 'all') parts.push('status=' + encodeURIComponent(query.status));
      if (parts.length) qs = '?' + parts.join('&');
    }
    const rows = await API.get('/products' + qs);
    return rows.map(r => this._normalize(r));
  },

  getProducts() {
    return JSON.parse(localStorage.getItem(this.PRODUCTS_KEY) || '[]');
  },

  getProduct(id) {
    return this.getProducts().find(p => p.id === id);
  },

  async fetchProduct(id) {
    const online = await API.check();
    if (!online) return this.getProduct(id);
    try {
      const row = await API.get('/products/' + id);
      return this._normalize(row);
    } catch { return this.getProduct(id); }
  },

  saveProducts(products) {
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
  },

  async addProduct(product) {
    const online = await API.check();
    if (online) {
      try {
        const row = await API.post('/products', {
          name: product.name,
          category_id: product.category,
          specs: product.specs,
          description: product.description || '',
          price_min: product.price,
          price_max: product.priceMax,
          stock: product.stock || 0,
          status: product.status || 'available',
          icon: product.icon || '📦'
        });
        return this._normalize(row);
      } catch (err) {
        App.showToast('API error: ' + err.message, 'error');
      }
    }
    // fallback
    const products = this.getProducts();
    product.id = App.generateId();
    products.push(product);
    this.saveProducts(products);
    return product;
  },

  async updateProduct(id, updates) {
    const online = await API.check();
    if (online) {
      try {
        const current = await API.get('/products/' + id);
        const row = await API.put('/products/' + id, {
          name: updates.name || current.name,
          category_id: updates.category || current.category_id,
          specs: updates.specs || current.specs,
          description: updates.description !== undefined ? updates.description : current.description,
          price_min: updates.price !== undefined ? updates.price : current.price_min,
          price_max: updates.priceMax !== undefined ? updates.priceMax : current.price_max,
          stock: updates.stock !== undefined ? updates.stock : current.stock,
          status: updates.status || current.status,
          icon: updates.icon || current.icon
        });
        return this._normalize(row);
      } catch (err) {
        App.showToast('API error: ' + err.message, 'error');
      }
    }
    // fallback
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...updates };
    this.saveProducts(products);
    return products[idx];
  },

  async updateStock(id, stock) {
    const online = await API.check();
    if (online) {
      try {
        const row = await API.patch('/products/' + id + '/stock', { stock });
        return this._normalize(row);
      } catch (err) {
        App.showToast('API error: ' + err.message, 'error');
      }
    }
    return this.updateProduct(id, { stock, status: stock > 0 ? 'available' : 'order' });
  },

  async deleteProduct(id) {
    const online = await API.check();
    if (online) {
      try { await API.del('/products/' + id); return; }
      catch (err) { App.showToast('API error: ' + err.message, 'error'); }
    }
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
  },

  filterProducts({ category, search, status } = {}) {
    let products = this.getProducts();
    if (category && category !== 'all') {
      products = products.filter(p => p.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.specs.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (status && status !== 'all') {
      products = products.filter(p => p.status === status);
    }
    return products;
  },

  getStockBadge(product) {
    if (product.status === 'available' && product.stock > 0) {
      return `<span class="badge badge-green stock-badge">In Stock (${product.stock})</span>`;
    } else if (product.status === 'production') {
      return '<span class="badge badge-yellow stock-badge">In Production</span>';
    } else {
      return '<span class="badge badge-red stock-badge">Made to Order</span>';
    }
  },

  getCategoryLabel(cat) {
    const labels = {
      tippers: 'Tippers',
      trailers: 'Trailers',
      tractors: 'Tractor Trolley',
      'water-tanks': 'Water Tanks',
      'container-bodies': 'Container Bodies',
      custom: 'Custom Fabrication'
    };
    return labels[cat] || cat;
  },

  renderProductCard(product) {
    const session = Auth.getSession();
    const basePath = this.getImageBasePath();
    const imgContent = product.image
      ? `<img src="${basePath}${product.image}" alt="${product.name}" loading="lazy">`
      : `<span class="product-icon">${product.icon || '📦'}</span>`;
    return `
      <div class="product-card animate-on-scroll" data-id="${product.id}" data-category="${product.category}">
        <div class="product-card-img">
          ${imgContent}
          ${this.getStockBadge(product)}
        </div>
        <div class="product-card-body">
          <span class="category-label">${this.getCategoryLabel(product.category)}</span>
          <h3>${product.name}</h3>
          <p class="specs">${product.specs}</p>
          <p class="price">${App.formatCurrency(product.price)} - ${App.formatCurrency(product.priceMax)}</p>
        </div>
        <div class="product-card-actions">
          <button class="btn btn-outline btn-sm" onclick="Catalog.showProductDetail('${product.id}')">View Details</button>
          ${session && session.role === 'buyer'
            ? `<button class="btn btn-primary btn-sm" onclick="Cart.addItem('${product.id}')">Add to Inquiry</button>`
            : `<button class="btn btn-primary btn-sm" onclick="Auth.showLoginModal()">Request Quote</button>`
          }
        </div>
      </div>
    `;
  },

  async showProductDetail(id) {
    const p = await this.fetchProduct(id);
    if (!p) return;
    const modal = document.getElementById('productModal');
    if (!modal) return;
    const session = Auth.getSession();
    const basePath = this.getImageBasePath();
    const modalImg = p.image
      ? `<img src="${basePath}${p.image}" alt="${p.name}" loading="lazy">`
      : `<span class="product-icon">${p.icon || '📦'}</span>`;
    modal.querySelector('.modal-body').innerHTML = `
      <div class="product-card-img" style="height:260px;border-radius:var(--radius-sm);margin-bottom:20px;">
        ${modalImg}
        ${this.getStockBadge(p)}
      </div>
      <span class="category-label">${this.getCategoryLabel(p.category)}</span>
      <h2 style="margin:8px 0">${p.name}</h2>
      <p class="specs" style="margin-bottom:12px">${p.specs}</p>
      <p style="color:var(--text-light);line-height:1.7;margin-bottom:16px;">${p.description}</p>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
        <div>
          <span style="font-size:0.8rem;color:var(--text-muted);">Price Range</span>
          <p class="price" style="margin:0">${App.formatCurrency(p.price)} - ${App.formatCurrency(p.priceMax)}</p>
        </div>
        <div>
          <span style="font-size:0.8rem;color:var(--text-muted);">Availability</span>
          <p style="margin:4px 0 0">${this.getStockBadge(p)}</p>
        </div>
      </div>
      <div style="display:flex;gap:12px;">
        ${session && session.role === 'buyer'
          ? `<button class="btn btn-primary" onclick="Cart.addItem('${p.id}');App.closeModal('productModal');">Add to Inquiry</button>
             <button class="btn btn-outline" onclick="Cart.addItem('${p.id}');App.closeModal('productModal');Cart.openCart();">Request Quote Now</button>`
          : `<button class="btn btn-primary" onclick="App.closeModal('productModal');Auth.showLoginModal();">Login to Inquire</button>`
        }
      </div>
    `;
    App.openModal('productModal');
  },

  /* --- Catalog Page Rendering (uses API when available) --- */
  renderCatalogPage() {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    const searchInput = document.getElementById('catalogSearch');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const viewBtns = document.querySelectorAll('.view-btn');
    let currentCategory = 'all';
    let currentView = 'grid';

    const render = async () => {
      const search = searchInput ? searchInput.value : '';
      let products;

      // Try API first
      try {
        const apiProducts = await this.fetchProducts({ category: currentCategory, search });
        if (apiProducts) { products = apiProducts; }
      } catch { /* ignore, fall through */ }

      // Fallback to localStorage
      if (!products) {
        products = this.filterProducts({ category: currentCategory, search });
      }

      const countEl = document.getElementById('productCount');
      if (countEl) countEl.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

      if (products.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>`;
        return;
      }
      grid.className = currentView === 'list' ? 'products-grid products-list' : 'products-grid';
      grid.innerHTML = products.map(p => this.renderProductCard(p)).join('');
      App.initScrollAnimations();
    };

    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(render, 250);
      });
    }

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        render();
      });
    });

    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        render();
      });
    });

    render();
  },

  /* --- Home Page Products Preview --- */
  async renderHomeProducts() {
    const grid = document.getElementById('homeProducts');
    if (!grid) return;
    let products;
    try {
      const apiProducts = await this.fetchProducts();
      if (apiProducts) products = apiProducts.slice(0, 8);
    } catch { /* ignore */ }
    if (!products) products = this.getProducts().slice(0, 8);
    grid.innerHTML = products.map(p => this.renderProductCard(p)).join('');
    App.initScrollAnimations();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Catalog.init();
  Catalog.renderHomeProducts();
  Catalog.renderCatalogPage();
});
