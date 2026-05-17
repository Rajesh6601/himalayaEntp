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
    const SEED_VERSION = 6; // bump to force re-seed with new product images
    if (localStorage.getItem(this.PRODUCTS_KEY) && localStorage.getItem('he-seed-v') === String(SEED_VERSION)) return;
    localStorage.setItem('he-seed-v', String(SEED_VERSION));
    const products = [
      // ── Tippers ──
      {
        id: 'p1', name: '24 Cum Tipper Body', category: 'tippers',
        specs: 'Capacity: 24 cubic meters | High-tensile steel | Heavy hydraulic system',
        price: 380000, priceMax: 480000, stock: 3, status: 'available',
        icon: '🚛', image: 'tipper-24cum.jpeg', description: 'Heavy-duty 24 cubic meter tipper body for large-scale mining and construction operations.'
      },
      {
        id: 'p2', name: '20 Cum Tipper Body (BharatBenz 3118)', category: 'tippers',
        specs: 'Capacity: 20 cubic meters | BharatBenz 3118 compatible | Reinforced floor',
        price: 340000, priceMax: 420000, stock: 4, status: 'available',
        icon: '🚛', image: 'tipper-20cum-3118.jpeg', description: '20 cubic meter tipper body designed for BharatBenz 3118 chassis. Heavy-duty construction for mining and infrastructure.'
      },
      {
        id: 'p3', name: '20 Cum Tipper Body', category: 'tippers',
        specs: 'Capacity: 20 cubic meters | Hardox steel | Standard hydraulic',
        price: 320000, priceMax: 400000, stock: 5, status: 'available',
        icon: '🚛', image: 'tipper-20cum.jpeg', description: '20 cubic meter tipper body built with high-tensile steel for aggregate and material transport.'
      },
      {
        id: 'p4', name: '16 Cum Tipper Body', category: 'tippers',
        specs: 'Capacity: 16 cubic meters | High-tensile steel | Hydraulic lift system',
        price: 285000, priceMax: 350000, stock: 5, status: 'available',
        icon: '🚛', image: 'tipper-16cum-01.jpeg', description: 'Heavy-duty 16 cubic meter tipper body designed for mining and construction. Reinforced floor plates and side walls.'
      },
      {
        id: 'p5', name: '16 Cum Tipper Body (Creative)', category: 'tippers',
        specs: 'Capacity: 16 cubic meters | Creative design | Premium finish',
        price: 295000, priceMax: 365000, stock: 3, status: 'available',
        icon: '🚛', image: 'tipper-16cum-02.jpeg', description: '16 cubic meter tipper with creative body design. Premium finish with enhanced durability.'
      },
      {
        id: 'p6', name: '14 Cum Tipper Body', category: 'tippers',
        specs: 'Capacity: 14 cubic meters | Mild steel construction | Standard hydraulic',
        price: 245000, priceMax: 310000, stock: 6, status: 'available',
        icon: '🚛', image: 'tipper-14cum.jpeg', description: '14 cubic meter tipper body ideal for medium-duty sand, gravel, and aggregate transport.'
      },
      {
        id: 'p7', name: '8.5 Cum Tipper SK1613', category: 'tippers',
        specs: 'Capacity: 8.5 cubic meters | Tata SK1613 compatible | Compact design',
        price: 185000, priceMax: 230000, stock: 8, status: 'available',
        icon: '🚛', image: 'tipper-8.5cum-sk1613.jpeg', description: '8.5 cubic meter tipper body for Tata SK1613 chassis. Compact yet robust for urban and semi-urban operations.'
      },
      {
        id: 'p8', name: 'Tata Ace Tipper', category: 'tippers',
        specs: 'Tata Ace compatible | Light-duty | Hydraulic tipping',
        price: 75000, priceMax: 110000, stock: 10, status: 'available',
        icon: '🚛', image: 'tata-ace-tipper.jpeg', description: 'Light-duty tipper body for Tata Ace mini trucks. Perfect for small-scale construction and material transport.'
      },
      {
        id: 'p9', name: 'Tipper Components Set 1', category: 'tippers',
        specs: 'Floor plates | Side panels | Tail gate | Mounting brackets',
        price: 45000, priceMax: 85000, stock: 15, status: 'available',
        icon: '🚛', image: 'tipper-components-01.jpeg', description: 'Complete tipper component set including floor plates, side panels, tail gate, and mounting brackets.'
      },
      {
        id: 'p10', name: 'Tipper Components Set 2', category: 'tippers',
        specs: 'Hydraulic cylinders | Hinge assembly | Locking mechanism',
        price: 55000, priceMax: 95000, stock: 12, status: 'available',
        icon: '🚛', image: 'tipper-components-02.jpeg', description: 'Tipper hydraulic and mechanical component set including cylinders, hinge assemblies, and locking mechanisms.'
      },
      // ── Trailers ──
      {
        id: 'p11', name: 'Trailer Side Wall 32 FT', category: 'trailers',
        specs: 'Length: 32ft | Side wall type | Multi-axle suspension',
        price: 500000, priceMax: 650000, stock: 2, status: 'available',
        icon: '🚚', image: 'trailer-sidewall-32ft.jpeg', description: '32 feet side wall trailer for bulk cargo transport. Robust construction with multi-axle suspension system.'
      },
      {
        id: 'p12', name: 'Tip Trailer 28 Cum', category: 'trailers',
        specs: 'Capacity: 28 cubic meters | Hydraulic tipping | Heavy-duty chassis',
        price: 750000, priceMax: 950000, stock: 1, status: 'available',
        icon: '🚚', image: 'tip-trailer-28cum.jpeg', description: '28 cubic meter tip trailer with hydraulic tipping mechanism. Heavy-duty chassis for mining and large-scale transport.'
      },
      {
        id: 'p13', name: '40ft Flatbed Trailer', category: 'trailers',
        specs: 'Length: 40ft | Payload: 35 tons | Multi-axle suspension',
        price: 550000, priceMax: 700000, stock: 3, status: 'available',
        icon: '🚚', image: 'flat-bed-trailor.jpg', description: 'Standard flatbed trailer for general cargo transport. Robust chassis and reliable suspension system.'
      },
      // ── Tracter Trolleys ──
      {
        id: 'p14', name: 'Tracter Trolley Type 1', category: 'tractors',
        specs: 'Capacity: 8 tons | Tipping mechanism | Agricultural grade',
        price: 120000, priceMax: 160000, stock: 12, status: 'available',
        icon: '🚜', image: 'tracter-trolley-01.jpeg', description: 'Agricultural tracter trolley body with hydraulic tipping. Ideal for farm produce, soil, and material transport.'
      },
      {
        id: 'p15', name: 'Tracter Trolley Type 2', category: 'tractors',
        specs: 'Heavy-duty | Reinforced frame | Higher payload',
        price: 140000, priceMax: 185000, stock: 8, status: 'available',
        icon: '🚜', image: 'tracter-trolley-02.jpeg', description: 'Heavy-duty tracter trolley with reinforced frame for higher payload capacity. Suitable for industrial and agricultural use.'
      },
      {
        id: 'p16', name: 'Tracter Trolley Type 3', category: 'tractors',
        specs: 'Extended body | Multi-purpose | Tipping capable',
        price: 155000, priceMax: 200000, stock: 5, status: 'available',
        icon: '🚜', image: 'tracter-trolley-03.jpeg', description: 'Extended body tracter trolley for versatile applications. Multi-purpose design with tipping capability.'
      },
      {
        id: 'p17', name: 'Tractor Adjustable Hitch', category: 'tractors',
        specs: 'Universal fit | Adjustable height | Heavy-duty steel',
        price: 25000, priceMax: 45000, stock: 20, status: 'available',
        icon: '🚜', image: 'tractor-adjustable-hitch.jpeg', description: 'Universal adjustable hitch for tractor trolley connection. Heavy-duty steel construction with adjustable height mechanism.'
      },
      // ── Water Tanker ──
      {
        id: 'p18', name: '10,000L Water Tanker', category: 'water-tanks',
        specs: 'Capacity: 10,000 liters | SS304 / MS options | Mounted or standalone',
        price: 175000, priceMax: 250000, stock: 4, status: 'available',
        icon: '💧', image: '10K-water-tanker.jpeg', description: 'Industrial water storage and transport tanker. Available in stainless steel or mild steel variants.'
      },
      {
        id: 'p19', name: '20,000L Water Tanker', category: 'water-tanks',
        specs: 'Capacity: 20,000 liters | Vehicle-mounted | Spray system included',
        price: 320000, priceMax: 420000, stock: 2, status: 'available',
        icon: '💧', image: '20k-water-tanker.jpeg', description: 'Large capacity vehicle-mounted water tanker with integrated spray system for municipal and industrial use.'
      },
      {
        id: 'p20', name: '5,000L Water Tanker', category: 'water-tanks',
        specs: 'Capacity: 5,000 liters | Compact design | Quick-mount system',
        price: 95000, priceMax: 130000, stock: 0, status: 'production',
        icon: '💧', image: '5k-water-tanker.jpg', description: 'Compact water tanker suitable for smaller vehicles and localized water supply needs.'
      },
      // ── Load Body ──
      {
        id: 'p21', name: 'Tata 720 Load Body', category: 'load-body',
        specs: 'Tata 720 compatible | MS construction | Side-open design',
        price: 150000, priceMax: 210000, stock: 5, status: 'available',
        icon: '📐', image: 'tata-720-load-body.jpeg', description: 'Load body designed for Tata 720 trucks. Mild steel construction with side-open configuration for easy loading/unloading.'
      },
      {
        id: 'p22', name: 'Eicher Load Body', category: 'load-body',
        specs: 'Eicher compatible | Heavy-duty | High side walls',
        price: 165000, priceMax: 230000, stock: 4, status: 'available',
        icon: '📐', image: 'eicher-load-body.jpeg', description: 'Heavy-duty load body for Eicher trucks. High side walls for bulk cargo with durable steel construction.'
      },
      // ── Containers ──
      {
        id: 'p23', name: 'Container Body', category: 'containers',
        specs: 'Standard ISO compatible | Weather-proof | Lockable doors',
        price: 350000, priceMax: 480000, stock: 2, status: 'available',
        icon: '📦', image: 'container.jpeg', description: 'Standard container body fabrication with weather-proof construction and secure lockable doors for cargo transport.'
      },
      {
        id: 'p24', name: 'Skeletal Container Trailer', category: 'containers',
        specs: '20/40ft container compatible | Twist locks | Lightweight frame',
        price: 380000, priceMax: 480000, stock: 0, status: 'order',
        icon: '📦', image: 'container-bodies.jpg', description: 'Container chassis trailer designed for intermodal transport. Compatible with standard ISO containers.'
      },
      // ── Waste Management Solutions ──
      {
        id: 'p25', name: 'Garbage Tipper', category: 'waste-management',
        specs: 'Municipal grade | Hydraulic tipping | Covered design',
        price: 450000, priceMax: 650000, stock: 2, status: 'available',
        icon: '♻️', image: 'garbage-tipper.jpeg', description: 'Municipal grade garbage tipper with hydraulic tipping mechanism. Covered design for hygienic waste collection and transport.'
      },
      {
        id: 'p26', name: 'Prefabricated Modular Toilet', category: 'waste-management',
        specs: 'Prefabricated | Modular design | Easy installation',
        price: 180000, priceMax: 300000, stock: 0, status: 'order',
        icon: '♻️', image: 'prefab-modular-toilet.jpeg', description: 'Prefabricated modular toilet unit for municipal and construction site deployment. Easy installation and relocation.'
      },
      // ── All kinds of Automobile Body Building work ──
      {
        id: 'p27', name: 'Concrete Mixer Body', category: 'custom',
        specs: 'Drum type | Vehicle-mounted | Heavy-duty rotation system',
        price: 550000, priceMax: 800000, stock: 0, status: 'order',
        icon: '🔧', image: 'concrete-mixer.jpeg', description: 'Vehicle-mounted concrete mixer body with heavy-duty drum and rotation system for construction applications.'
      },
      {
        id: 'p28', name: 'Food Van Body', category: 'custom',
        specs: 'Food-grade interior | Insulated | Custom layout',
        price: 350000, priceMax: 550000, stock: 0, status: 'order',
        icon: '🔧', image: 'food-van.jpeg', description: 'Custom food van body with food-grade interior, insulated walls, and customizable layout for mobile food business.'
      },
      {
        id: 'p29', name: 'Custom Automobile Body Building', category: 'custom',
        specs: 'Built to specification | Any vehicle type | Design consultation',
        price: 200000, priceMax: 800000, stock: 0, status: 'order',
        icon: '🔧', image: 'automobile-bodybuilding-01.jpeg', description: 'All kinds of automobile body building, repairing and fabrication work. Fully customized to your exact requirements.'
      },
      {
        id: 'p30', name: 'Special Purpose Vehicle Body', category: 'custom',
        specs: 'Custom design | Any application | Engineering consultation',
        price: 300000, priceMax: 1000000, stock: 0, status: 'order',
        icon: '🔧', image: 'automobile-bodybuilding-02.jpeg', description: 'Special purpose vehicle body fabrication for unique applications. Includes complete design and engineering consultation.'
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
      tractors: 'Tracter Trolleys',
      'water-tanks': 'Water Tanker',
      'load-body': 'Load Body',
      containers: 'Containers',
      'waste-management': 'Waste Management Solutions',
      custom: 'All kinds of Automobile Body Building work'
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
