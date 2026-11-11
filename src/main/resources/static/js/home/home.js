/**
 * Smash Badminton (VNB Sports Theme) - Public Product Listing Logic
 * Dynamically fetches and renders real product cards from GET /api/public/products.
 * Connects directly to backend database.
 */

(function () {
  'use strict';

  const currentFilters = {
    keyword: '',
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    brand: null,
    sortBy: 'id,desc',
    page: 0,
    size: 12
  };

  let allProducts = [];

  document.addEventListener('DOMContentLoaded', async function () {
    readUrlParams();
    await loadProducts();
    initFilterEvents();
    initSortEvent();
  });

  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('keyword')) {
      currentFilters.keyword = params.get('keyword');
      const searchInput = document.getElementById('headerSearchInput');
      if (searchInput) searchInput.value = currentFilters.keyword;
    }
    if (params.get('categoryId')) {
      currentFilters.categoryId = parseInt(params.get('categoryId'), 10);
    }
    if (params.get('brand')) {
      currentFilters.brand = params.get('brand');
    }
  }

  /**
   * Constructs image URL with fallback to local static image directory
   */
  function constructProductImageUrl(raw) {
    if (!raw) return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop';
    const trimmed = String(raw).trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('images/')) return trimmed.replace(/^images\//, 'image/');
    if (trimmed.startsWith('/images/')) return trimmed.replace(/^\/images\//, '/image/');
    if (trimmed.startsWith('image/') || trimmed.startsWith('/image/')) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return `image/${trimmed}`;
  }

  /**
   * Fetch real products from API and dynamically render cards
   */
  async function loadProducts() {
    const grid = document.getElementById('publicProductsGrid');
    const countEl = document.getElementById('catalogTotalCount');
    if (!grid) return;

    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: #FFFFFF; border-radius: 8px; border: 1px solid #EBEBEB;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EA5C0B" stroke-width="2.5" style="animation: spin 1s linear infinite; margin-bottom: 12px;">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <p style="color: #666666; font-size: 0.9375rem; font-weight: 600;">Đang tải danh sách sản phẩm nổi bật từ hệ thống...</p>
      </div>
    `;

    try {
      const pageData = await window.HomeAPI.getPublicProducts(currentFilters);
      allProducts = pageData.content || (Array.isArray(pageData) ? pageData : []);

      // Apply client-side brand filter if selected
      let displayProducts = [...allProducts];
      if (currentFilters.brand) {
        displayProducts = displayProducts.filter(p => p.brandName && p.brandName.toLowerCase() === currentFilters.brand.toLowerCase());
      }

      if (countEl) {
        const total = pageData.totalElements !== undefined ? pageData.totalElements : displayProducts.length;
        countEl.textContent = `(Hiển thị ${total} sản phẩm)`;
      }

      renderProductsGrid(displayProducts);
    } catch (err) {
      console.error('Error loading public products:', err);
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 8px;">
          <p style="color: #D32F2F; font-weight: 700; margin-bottom: 8px;">Không thể tải dữ liệu sản phẩm</p>
          <p style="color: #777777; font-size: 0.875rem;">${escapeHtml(err.message || 'Đã xảy ra sự cố khi kết nối tới máy chủ. Vui lòng thử lại sau.')}</p>
        </div>
      `;
    }
  }

  /**
   * Dynamically renders product cards matching VNB Sports layout
   */
  function renderProductsGrid(products) {
    const grid = document.getElementById('publicProductsGrid');
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 8px;">
          <h3 style="font-size: 1.125rem; font-weight: 700; color: #333333; margin-bottom: 8px;">Không tìm thấy sản phẩm phù hợp</h3>
          <p style="color: #888888; font-size: 0.875rem;">Quý khách vui lòng thử tìm kiếm với từ khóa hoặc bộ lọc khác.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map(product => {
      const sellPrice = product.sellPrice ? Number(product.sellPrice) : 0;
      const formattedSellPrice = sellPrice.toLocaleString('vi-VN') + ' ₫';
      const originalPrice = sellPrice * 1.12;
      const formattedOriginalPrice = Math.round(originalPrice).toLocaleString('vi-VN') + ' ₫';
      const rentalRate = product.rentalPricePerDay ? Number(product.rentalPricePerDay).toLocaleString('vi-VN') + ' ₫' : null;

      const rawImg = product.thumbnailImage ||
        (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : '');
      const thumb = constructProductImageUrl(rawImg);
      const isRentalOnly = (sellPrice <= 0 && product.rentalPricePerDay > 0);
      const conditionBadge = (product.condition && product.condition.toLowerCase() === 'used')
        ? '<span class="card-badge-discount" style="background-color: #0284C7;">99% LIKE NEW</span>'
        : '<span class="card-badge-discount">-12%</span>';

      return `
        <article class="vnb-product-card" data-id="${product.id}">
          ${conditionBadge}
          <span class="card-badge-premium">${escapeHtml(product.brandName || 'CHÍNH HÃNG')}</span>

          <a href="product-detail.html?id=${product.id}" class="card-media-wrapper" title="${escapeHtml(product.name)}">
            <img src="${escapeHtml(thumb)}" 
                 alt="${escapeHtml(product.name)}" 
                 class="card-product-img" 
                 loading="lazy"
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop';">
          </a>

          <div class="card-body-content">
            <span class="card-brand-label">${escapeHtml(product.brandName || 'CHÍNH HÃNG')}</span>
            
            <a href="product-detail.html?id=${product.id}" class="card-product-title" title="${escapeHtml(product.name)}">
              ${escapeHtml(product.name)}
            </a>

            <div class="card-price-group">
              ${isRentalOnly 
                ? `<span class="card-price-current" style="color: #0284C7;">Chỉ Cho Thuê</span>` 
                : `<span class="card-price-current">${formattedSellPrice}</span>
                   <span class="card-price-old">${formattedOriginalPrice}</span>`
              }
              ${rentalRate ? `<span class="card-rental-tag">Thuê: ${rentalRate}/ngày</span>` : ''}
            </div>

            <div class="card-action-bar">
              <button type="button" 
                      class="btn-card-add-cart btn-add-to-cart-quick" 
                      data-id="${product.id}" 
                      data-name="${escapeHtml(product.name)}" 
                      data-price="${sellPrice}" 
                      data-image="${escapeHtml(thumb)}">
                THÊM VÀO GIỎ
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    bindAddToCartButtons();
  }

  /**
   * Add to Cart handler
   */
  function bindAddToCartButtons() {
    document.querySelectorAll('.btn-add-to-cart-quick').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const id = this.getAttribute('data-id');
        const name = this.getAttribute('data-name');
        const price = parseFloat(this.getAttribute('data-price')) || 0;
        const image = this.getAttribute('data-image');

        const CART_KEY = 'brm_cart_items';
        let items = [];
        try {
          items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        } catch {
          items = [];
        }

        const existing = items.find(item => item.id == id);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + 1;
        } else {
          items.push({ id, name, price, image, quantity: 1 });
        }

        localStorage.setItem(CART_KEY, JSON.stringify(items));
        if (window.syncCartBadge) window.syncCartBadge();
        if (window.showToast) {
          window.showToast(`Đã thêm "${name}" vào giỏ hàng thành công!`, 'success');
        }
      });
    });
  }

  /**
   * Filter event listeners
   */
  function initFilterEvents() {
    // Price checkboxes
    const priceRadios = document.querySelectorAll('input[name="filterPrice"]');
    priceRadios.forEach(radio => {
      radio.addEventListener('change', function () {
        const val = this.value;
        if (val === 'all') {
          currentFilters.minPrice = null;
          currentFilters.maxPrice = null;
        } else if (val === 'under2m') {
          currentFilters.minPrice = null;
          currentFilters.maxPrice = 2000000;
        } else if (val === '2m-4m') {
          currentFilters.minPrice = 2000000;
          currentFilters.maxPrice = 4000000;
        } else if (val === 'over4m') {
          currentFilters.minPrice = 4000000;
          currentFilters.maxPrice = null;
        }
        loadProducts();
      });
    });

    // Brand checkboxes
    const brandRadios = document.querySelectorAll('input[name="filterBrand"]');
    brandRadios.forEach(radio => {
      radio.addEventListener('change', function () {
        currentFilters.brand = this.value === 'all' ? null : this.value;
        loadProducts();
      });
    });

    // Reset filters
    const resetBtn = document.getElementById('btnResetFilters');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        currentFilters.minPrice = null;
        currentFilters.maxPrice = null;
        currentFilters.brand = null;
        currentFilters.keyword = '';

        document.querySelectorAll('input[name="filterPrice"]').forEach(r => r.checked = r.value === 'all');
        document.querySelectorAll('input[name="filterBrand"]').forEach(r => r.checked = r.value === 'all');

        const searchInput = document.getElementById('headerSearchInput');
        if (searchInput) searchInput.value = '';

        loadProducts();
      });
    }
  }

  /**
   * Sort Dropdown event listener
   */
  function initSortEvent() {
    const sortSelect = document.getElementById('catalogSortSelect');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function () {
      currentFilters.sortBy = this.value;
      loadProducts();
    });
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
})();
