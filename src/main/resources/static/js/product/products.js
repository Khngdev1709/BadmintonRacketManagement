/**
 * Smash Badminton System - Public Products Catalog Page Logic
 * Fetches real product data from GET /api/public/products, parses filters, and dynamically renders cards.
 * No hardcoded product items.
 */

(function () {
  'use strict';

  // State object reflecting active filters and pagination
  const state = {
    keyword: '',
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    condition: 'all',
    sortBy: 'id,desc',
    page: 0,
    size: 12
  };

  let totalPages = 1;

  document.addEventListener('DOMContentLoaded', async function () {
    parseUrlParameters();
    await loadCategoriesFilter();
    initFilterEventListeners();
    initSortEventListener();
    initPaginationListeners();
    initResetButton();
    await fetchProducts();
  });

  /**
   * Parse incoming URL query parameters (e.g. ?keyword=yonex&categoryId=2)
   */
  function parseUrlParameters() {
    const params = new URLSearchParams(window.location.search);

    state.keyword = params.get('keyword') || '';
    state.categoryId = params.get('categoryId') ? parseInt(params.get('categoryId'), 10) : null;
    state.minPrice = params.get('minPrice') ? parseFloat(params.get('minPrice')) : null;
    state.maxPrice = params.get('maxPrice') ? parseFloat(params.get('maxPrice')) : null;
    state.condition = params.get('condition') || 'all';
    state.sortBy = params.get('sortBy') || 'id,desc';
    state.page = params.get('page') ? parseInt(params.get('page'), 10) : 0;

    // Sync header search input value if keyword is present
    const headerInput = document.getElementById('headerSearchInput');
    if (headerInput && state.keyword) {
      headerInput.value = state.keyword;
    }

    // Sync sort dropdown value
    const sortSelect = document.getElementById('catalogSortSelect');
    if (sortSelect && state.sortBy) {
      sortSelect.value = state.sortBy;
    }
  }

  /**
   * Update browser URL without triggering full page reload
   */
  function syncBrowserUrl() {
    const params = new URLSearchParams();

    if (state.keyword) params.set('keyword', state.keyword);
    if (state.categoryId) params.set('categoryId', state.categoryId);
    if (state.minPrice !== null) params.set('minPrice', state.minPrice);
    if (state.maxPrice !== null) params.set('maxPrice', state.maxPrice);
    if (state.condition && state.condition !== 'all') params.set('condition', state.condition);
    if (state.sortBy && state.sortBy !== 'id,desc') params.set('sortBy', state.sortBy);
    if (state.page > 0) params.set('page', state.page);

    const newQuery = params.toString();
    const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }

  /**
   * Load categories from backend Category API and render radio options
   */
  async function loadCategoriesFilter() {
    const container = document.getElementById('categoryFilterList');
    if (!container) return;

    try {
      const categories = await window.ProductAPI.getCategories();

      const itemsHtml = `
        <li>
          <label class="filter-checkbox-item">
            <input type="radio" name="filterCategory" value="" ${!state.categoryId ? 'checked' : ''}>
            <span>Tất cả danh mục</span>
          </label>
        </li>
        ${categories.map(cat => `
          <li>
            <label class="filter-checkbox-item">
              <input type="radio" name="filterCategory" value="${cat.id}" ${state.categoryId === cat.id ? 'checked' : ''}>
              <span>${escapeHtml(cat.name)}</span>
            </label>
          </li>
        `).join('')}
      `;

      container.innerHTML = itemsHtml;

      container.querySelectorAll('input[name="filterCategory"]').forEach(input => {
        input.addEventListener('change', function () {
          state.categoryId = this.value ? parseInt(this.value, 10) : null;
          state.page = 0;
          syncBrowserUrl();
          fetchProducts();
        });
      });
    } catch (err) {
      console.warn('Failed to load categories filter:', err.message);
    }
  }

  /**
   * Initialize price and condition filter listeners
   */
  function initFilterEventListeners() {
    // Price range filters
    document.querySelectorAll('input[name="filterPrice"]').forEach(input => {
      input.addEventListener('change', function () {
        const val = this.value;
        if (val === 'under2m') {
          state.minPrice = null;
          state.maxPrice = 2000000;
        } else if (val === '2m-4m') {
          state.minPrice = 2000000;
          state.maxPrice = 4000000;
        } else if (val === 'over4m') {
          state.minPrice = 4000000;
          state.maxPrice = null;
        } else {
          state.minPrice = null;
          state.maxPrice = null;
        }
        state.page = 0;
        syncBrowserUrl();
        fetchProducts();
      });
    });

    // Condition filters
    document.querySelectorAll('input[name="filterCondition"]').forEach(input => {
      input.addEventListener('change', function () {
        state.condition = this.value;
        state.page = 0;
        syncBrowserUrl();
        fetchProducts();
      });
    });
  }

  /**
   * Sorting select dropdown change
   */
  function initSortEventListener() {
    const sortSelect = document.getElementById('catalogSortSelect');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function () {
      state.sortBy = this.value;
      state.page = 0;
      syncBrowserUrl();
      fetchProducts();
    });
  }

  /**
   * Pagination Prev/Next triggers
   */
  function initPaginationListeners() {
    const prevBtn = document.getElementById('btnCatalogPrev');
    const nextBtn = document.getElementById('btnCatalogNext');

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (state.page > 0) {
          state.page--;
          syncBrowserUrl();
          fetchProducts();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (state.page < totalPages - 1) {
          state.page++;
          syncBrowserUrl();
          fetchProducts();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  /**
   * Reset filter button
   */
  function initResetButton() {
    const btnReset = document.getElementById('btnResetFilters');
    if (!btnReset) return;

    btnReset.addEventListener('click', function () {
      state.keyword = '';
      state.categoryId = null;
      state.minPrice = null;
      state.maxPrice = null;
      state.condition = 'all';
      state.sortBy = 'id,desc';
      state.page = 0;

      // Reset DOM controls
      const allCat = document.querySelector('input[name="filterCategory"][value=""]');
      if (allCat) allCat.checked = true;

      const allPrice = document.querySelector('input[name="filterPrice"][value="all"]');
      if (allPrice) allPrice.checked = true;

      const allCond = document.querySelector('input[name="filterCondition"][value="all"]');
      if (allCond) allCond.checked = true;

      const sortSelect = document.getElementById('catalogSortSelect');
      if (sortSelect) sortSelect.value = 'id,desc';

      const headerInput = document.getElementById('headerSearchInput');
      if (headerInput) headerInput.value = '';

      syncBrowserUrl();
      fetchProducts();
    });
  }

  /**
   * Task 1: Fetch products from backend GET /api/public/products
   */
  async function fetchProducts() {
    const grid = document.getElementById('product-grid') || document.getElementById('publicProductsGrid');
    const totalCountEl = document.getElementById('catalogTotalCount');
    const activeSearchWrapper = document.getElementById('activeSearchChipWrapper');

    if (!grid) return;

    // Loading State
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #777777;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin-animation" style="margin-bottom: 12px; color: #EA5C0B; animation: spin 1s linear infinite;">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <div style="font-weight: 600;">Đang tải danh sách vợt cầu lông...</div>
      </div>
    `;

    // Active Search Chip
    if (activeSearchWrapper) {
      if (state.keyword) {
        activeSearchWrapper.innerHTML = `
          <div class="search-active-chip">
            <span>Tìm kiếm: "${escapeHtml(state.keyword)}"</span>
            <button type="button" id="btnClearKeyword" aria-label="Xóa từ khóa">&times;</button>
          </div>
        `;
        const btnClear = document.getElementById('btnClearKeyword');
        if (btnClear) {
          btnClear.addEventListener('click', function () {
            state.keyword = '';
            const headerInput = document.getElementById('headerSearchInput');
            if (headerInput) headerInput.value = '';
            syncBrowserUrl();
            fetchProducts();
          });
        }
      } else {
        activeSearchWrapper.innerHTML = '';
      }
    }

    try {
      // Build query string
      const query = new URLSearchParams();
      if (state.keyword) query.append('keyword', state.keyword);
      if (state.categoryId) query.append('categoryId', state.categoryId);
      if (state.minPrice !== null && state.minPrice !== undefined) query.append('minPrice', state.minPrice);
      if (state.maxPrice !== null && state.maxPrice !== undefined) query.append('maxPrice', state.maxPrice);
      if (state.page !== undefined && state.page !== null) query.append('page', state.page);
      if (state.size !== undefined && state.size !== null) query.append('size', state.size);
      if (state.sortBy) query.append('sortBy', state.sortBy);

      const response = await fetch(`/api/public/products?${query.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch products`);
      }

      const json = await response.json();
      const pageData = json && json.data ? json.data : json;
      const products = Array.isArray(pageData) ? pageData : (pageData.content || []);
      const totalElements = pageData.totalElements !== undefined ? pageData.totalElements : products.length;
      totalPages = pageData.totalPages || 1;

      if (totalCountEl) {
        totalCountEl.textContent = `(Hiển thị ${totalElements} sản phẩm)`;
      }

      // Filter by condition locally if specified and not 'all'
      let displayProducts = products;
      if (state.condition && state.condition !== 'all') {
        displayProducts = products.filter(p => {
          const cond = (p.condition || '').toLowerCase();
          if (state.condition === 'new') return cond === 'new';
          if (state.condition === 'used') return cond === 'used';
          if (state.condition === 'rental') return (p.rentalPricePerDay && Number(p.rentalPricePerDay) > 0);
          return true;
        });
      }

      renderProducts(displayProducts);
      updatePaginationBar(pageData);

    } catch (err) {
      console.error('fetchProducts failed:', err);
      grid.innerHTML = `
        <div class="catalog-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <div class="empty-state-title" style="color: #D32F2F; font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">Không thể tải dữ liệu sản phẩm</div>
          <p class="empty-state-desc" style="color: #666666; font-size: 0.875rem; margin-bottom: 20px;">
            ${escapeHtml(err.message || 'Đã xảy ra sự cố khi kết nối tới máy chủ. Vui lòng thử lại sau.')}
          </p>
          <button type="button" class="btn-reset-filters" style="width: auto; padding: 8px 24px;" onclick="location.reload();">
            TẢI LẠI TRANG
          </button>
        </div>
      `;
    }
  }

  /**
   * Task 1: Render product list into #product-grid
   * @param {Array} products
   */
  function renderProducts(products) {
    const grid = document.getElementById('product-grid') || document.getElementById('publicProductsGrid');
    if (!grid) return;

    if (!products || products.length === 0) {
      grid.innerHTML = `
        <div class="catalog-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.8" style="margin: 0 auto 12px; display: block;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <div class="empty-state-title" style="font-size: 1.25rem; font-weight: 700; color: #333333; margin-bottom: 8px;">Không tìm thấy sản phẩm nào</div>
          <p class="empty-state-desc" style="font-size: 0.875rem; color: #666666; margin-bottom: 20px;">
            Rất tiếc, hiện tại không có cây vợt nào phù hợp với bộ lọc bạn đã chọn. Vui lòng thử thay đổi khoảng giá hoặc tìm kiếm với từ khóa khác.
          </p>
          <button type="button" class="btn-reset-filters" id="btnEmptyReset" style="width: auto; padding: 8px 24px;">
            XÓA BỘ LỌC
          </button>
        </div>
      `;
      const btnEmptyReset = document.getElementById('btnEmptyReset');
      if (btnEmptyReset) {
        btnEmptyReset.addEventListener('click', () => {
          document.getElementById('btnResetFilters')?.click();
        });
      }
      return;
    }

    const htmlString = products.map(renderProductCard).join('');
    grid.innerHTML = htmlString;
    bindCardActionEvents(products);
  }

  /**
   * Resolve image path pointing to static image directory
   * @param {string} img
   * @returns {string}
   */
  function constructProductImageUrl(img) {
    if (!img) {
      return 'image/Yonex Astrox 100ZZ.jpg';
    }
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    let clean = img.startsWith('/') ? img.substring(1) : img;
    if (clean.startsWith('images/')) {
      clean = 'image/' + clean.substring('images/'.length);
    } else if (!clean.startsWith('image/')) {
      clean = 'image/' + clean;
    }
    return clean;
  }

  /**
   * Render single product card HTML
   */
  function renderProductCard(prod) {
    const isNew = (prod.condition || 'New').toLowerCase() === 'new';
    const conditionBadgeText = isNew ? 'Mới 100%' : 'Đã Lướt 98%';
    const sellPrice = prod.sellPrice || 0;
    const formattedSellPrice = window.formatVND ? window.formatVND(sellPrice) : formatCurrency(sellPrice);
    const oldPrice = sellPrice * 1.15;
    const formattedOldPrice = window.formatVND ? window.formatVND(oldPrice) : formatCurrency(oldPrice);

    const thumb = constructProductImageUrl(prod.thumbnailImage || (prod.imageUrls && prod.imageUrls[0]));
    const brandName = prod.brandName || 'CHÍNH HÃNG';

    const rentalBadge = prod.rentalPricePerDay
      ? `<span class="card-rental-tag">Thuê: ${window.formatVND ? window.formatVND(prod.rentalPricePerDay) : formatCurrency(prod.rentalPricePerDay)}/ngày</span>`
      : '';

    return `
      <article class="product-card" data-id="${prod.id}">
        <!-- Red Percentage Discount Badge on Top Left -->
        <span class="card-badge-discount">-15%</span>

        <!-- Premium / Authentic Badge on Top Right -->
        <span class="card-badge-premium">Chính Hãng</span>

        <!-- Condition Badge -->
        <span class="card-badge-condition">${conditionBadgeText}</span>

        <!-- Product Image -->
        <a href="product-detail.html?id=${prod.id}" class="card-media-wrapper" title="${escapeHtml(prod.name)}">
          <img src="${thumb}" 
               alt="${escapeHtml(prod.name)}" 
               class="card-product-img" 
               loading="lazy"
               onerror="this.onerror=null; this.src='image/Yonex Astrox 100ZZ.jpg';">
        </a>

        <!-- Product Information (Center Aligned) -->
        <div class="card-info-pane">
          <span class="card-brand-tag">${escapeHtml(brandName)}</span>
          <a href="product-detail.html?id=${prod.id}" class="card-product-title" title="${escapeHtml(prod.name)}">
            ${escapeHtml(prod.name)}
          </a>

          <div class="card-price-group">
            <span class="card-price-sell">${formattedSellPrice}</span>
            <span class="card-price-old">${formattedOldPrice}</span>
            ${rentalBadge}
          </div>

          <div class="card-action-bar">
            <a href="product-detail.html?id=${prod.id}" class="btn-card-action btn-card-detail">
              Chi tiết
            </a>
            <button type="button" class="btn-card-action btn-card-cart btn-quick-add" data-id="${prod.id}">
              Thêm giỏ
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Bind quick Add To Cart triggers
   */
  function bindCardActionEvents(products) {
    document.querySelectorAll('.btn-quick-add').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const id = parseInt(this.getAttribute('data-id'), 10);
        const prod = products.find(p => p.id === id);
        if (!prod) return;

        addToCart(prod, 1);
        if (window.showToast) {
          window.showToast(`Đã thêm "${prod.name}" vào giỏ hàng!`, 'success');
        }
      });
    });
  }

  /**
   * Save item to localStorage cart
   */
  function addToCart(product, quantity) {
    const CART_KEY = 'brm_cart_items';
    let items = [];
    try {
      items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
      items = [];
    }

    const existing = items.find(item => item.id == product.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + quantity;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.sellPrice,
        image: constructProductImageUrl(product.thumbnailImage || (product.imageUrls && product.imageUrls[0])),
        quantity: quantity
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (typeof window.syncCartBadge === 'function') {
      window.syncCartBadge();
    }
  }

  /**
   * Update bottom pagination bar
   */
  function updatePaginationBar(pageData) {
    const prevBtn = document.getElementById('btnCatalogPrev');
    const nextBtn = document.getElementById('btnCatalogNext');
    const pageIndicator = document.getElementById('catalogPageIndicator');

    const curPage = (pageData.number !== undefined ? pageData.number : state.page) + 1;
    const total = pageData.totalPages !== undefined ? pageData.totalPages : totalPages;

    if (pageIndicator) {
      pageIndicator.textContent = `Trang ${curPage} / ${Math.max(total, 1)}`;
    }

    if (prevBtn) {
      prevBtn.disabled = curPage <= 1;
    }

    if (nextBtn) {
      nextBtn.disabled = curPage >= total;
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.fetchProducts = fetchProducts;
  window.renderProducts = renderProducts;

})();
