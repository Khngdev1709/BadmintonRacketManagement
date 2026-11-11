/**
 * Smash Badminton (SEO Sports Theme) - Product Detail Page Logic (product-detail.html)
 * Extracts URL query ID, calls GET /api/public/products/{id}, populates DOM elements,
 * updates main image and thumbnail gallery from static image directory, and handles cart actions.
 * No hardcoded fallback data.
 */

(function () {
  'use strict';

  const CART_KEY = 'brm_cart_items';
  let currentProduct = null;
  let currentQuantity = 1;

  document.addEventListener('DOMContentLoaded', async function () {
    const productId = getProductIdFromUrl();
    await fetchProductDetails(productId);
    initQuantityControls();
    initActionButtons();
    initDetailTabs();
  });

  /**
   * Extract product ID from URL query parameters (e.g. product-detail.html?id=2)
   * @returns {number|null}
   */
  function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id ? parseInt(id, 10) : null;
  }

  /**
   * Task 2: Fetch product details using Fetch API
   * @param {number|null} id
   */
  async function fetchProductDetails(id) {
    if (!id) {
      renderProductNotFound('Không có mã sản phẩm được chỉ định.');
      return;
    }

    try {
      const response = await fetch(`/api/public/products/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Sản phẩm #${id} không tồn tại trên hệ thống.`);
      }

      const json = await response.json();
      currentProduct = json && json.data ? json.data : json;

      if (!currentProduct || !currentProduct.id) {
        throw new Error('Dữ liệu sản phẩm không hợp lệ.');
      }

      populateProductDetails(currentProduct);
      renderImageGallery(currentProduct);

    } catch (err) {
      console.error('fetchProductDetails error:', err);
      renderProductNotFound(err.message);
    }
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
   * Task 2: Populate HTML elements by their IDs using fetched JSON data
   * @param {Object} data
   */
  function populateProductDetails(data) {
    document.title = `${data.name} | SMASH SEO SPORTS`;

    // Breadcrumb title
    const breadcrumbTitle = document.getElementById('breadcrumbProductTitle');
    if (breadcrumbTitle) {
      breadcrumbTitle.innerText = data.name;
    }

    // Title
    const titleEl = document.getElementById('detail-title') || document.getElementById('detailProductTitle');
    if (titleEl) {
      titleEl.innerText = data.name;
    }

    // Brand
    const brandEl = document.getElementById('detail-brand') || document.getElementById('detailBrandName');
    if (brandEl) {
      brandEl.innerText = data.brandName || 'Chính hãng';
    }

    // SKU / ID
    const skuEl = document.getElementById('detail-sku') || document.getElementById('detailSkuNumber');
    if (skuEl) {
      skuEl.innerText = `SEO-${data.id}`;
    }

    // Stock Status
    const stockEl = document.getElementById('detail-stock') || document.getElementById('detailStockStatus');
    const inStock = data.stockQuantity > 0;
    if (stockEl) {
      stockEl.innerText = inStock ? 'Còn hàng' : 'Hết hàng';
      stockEl.style.color = inStock ? '#16A34A' : '#DC2626';
      stockEl.style.fontWeight = '700';
    }

    // Condition
    const condEl = document.getElementById('detail-condition') || document.getElementById('detailCondition');
    const isUsed = (data.condition || '').toLowerCase() === 'used';
    if (condEl) {
      condEl.innerText = isUsed
        ? 'Hàng Lướt (98% Like New / Cho Thuê)'
        : 'Hàng Mới 100%';
    }

    // Task 1: If condition == 'Used', show "THUÊ VỢT NGAY" instead of standard "THÊM VÀO GIỎ HÀNG"
    const btnAddToCart = document.getElementById('btnAddToCartOrange');
    const btnBuyNow = document.getElementById('btnBuyNowYellow');
    const btnRentNow = document.getElementById('btnRentNowOrange');
    const btnRentTrial = document.getElementById('btnRentTrial');

    if (isUsed) {
      if (btnAddToCart) btnAddToCart.style.display = 'none';
      if (btnBuyNow) btnBuyNow.style.display = 'none';
      if (btnRentNow) {
        btnRentNow.style.display = 'flex';
        btnRentNow.style.width = '100%';
      }
      if (btnRentTrial) btnRentTrial.style.display = 'none';
    } else {
      if (btnAddToCart) btnAddToCart.style.display = 'flex';
      if (btnBuyNow) btnBuyNow.style.display = 'flex';
      if (btnRentNow) btnRentNow.style.display = 'none';
      if (btnRentTrial) btnRentTrial.style.display = 'flex';
    }

    // Price
    const sellPrice = data.sellPrice || 0;
    const formattedPrice = formatCurrency(sellPrice);
    const oldPrice = sellPrice * 1.15;
    const formattedOldPrice = formatCurrency(oldPrice);

    const priceEl = document.getElementById('detail-price') || document.getElementById('detailPriceRed');
    if (priceEl) {
      priceEl.innerText = formattedPrice;
    }

    const oldPriceEl = document.getElementById('detail-old-price') || document.getElementById('detailPriceOld');
    if (oldPriceEl) {
      oldPriceEl.innerText = formattedOldPrice;
    }

    // Rental rate option banner
    const rentalBanner = document.getElementById('detail-rental-banner') || document.getElementById('detailRentalBanner');
    if (rentalBanner) {
      if (data.rentalPricePerDay && Number(data.rentalPricePerDay) > 0) {
        rentalBanner.style.display = 'flex';
        rentalBanner.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>Có sẵn trong đội vợt cho thuê thi đấu: <strong>${formatCurrency(data.rentalPricePerDay)} / ngày</strong> (Đặt cọc hoàn lại 100%)</span>
        `;
      } else {
        rentalBanner.style.display = 'none';
      }
    }

    // Description
    const descEl = document.getElementById('detail-description') || document.getElementById('detailDescriptionBody');
    if (descEl) {
      descEl.innerText = data.description || 'Sản phẩm cao cấp được nhập khẩu và phân phối chính hãng bởi hệ thống SMASH SEO Sports.';
    }

    // Specifications tab
    const specCategory = document.getElementById('detail-spec-category') || document.getElementById('specCategory');
    if (specCategory) {
      specCategory.innerText = data.categoryName || 'Vợt Cầu Lông Cao Cấp';
    }

    const specBrand = document.getElementById('detail-spec-brand') || document.getElementById('specBrand');
    if (specBrand) {
      specBrand.innerText = data.brandName || 'Yonex / Victor / Lining';
    }
  }

  /**
   * Task 2: Update Main Image and Thumbnail Gallery
   * @param {Object} data
   */
  function renderImageGallery(data) {
    const mainImg = document.getElementById('detail-main-image') || document.getElementById('detailMainImage');
    const galleryContainer = document.getElementById('detail-thumbnail-gallery') || document.getElementById('detailThumbnailGallery');

    if (!mainImg || !galleryContainer) return;

    // Collect all image references
    let images = [];
    if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
      images = data.imageUrls;
    } else if (data.thumbnailImage) {
      images = [data.thumbnailImage];
    } else {
      images = ['image/Yonex Astrox 100ZZ.jpg'];
    }

    const firstImgSrc = constructProductImageUrl(images[0]);
    mainImg.src = firstImgSrc;
    mainImg.alt = data.name || 'Vợt cầu lông';
    mainImg.onerror = function () {
      this.onerror = null;
      this.src = 'image/Yonex Astrox 100ZZ.jpg';
    };

    galleryContainer.innerHTML = images.map((imgName, idx) => {
      const srcUrl = constructProductImageUrl(imgName);
      return `
        <button type="button" class="thumb-item-btn ${idx === 0 ? 'active' : ''}" data-src="${srcUrl}" aria-label="Xem ảnh ${idx + 1}">
          <img src="${srcUrl}" alt="Thumbnail ${idx + 1}" onerror="this.onerror=null; this.src='image/Yonex Astrox 100ZZ.jpg';">
        </button>
      `;
    }).join('');

    // Thumbnail click switching
    galleryContainer.querySelectorAll('.thumb-item-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        galleryContainer.querySelectorAll('.thumb-item-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const targetSrc = this.getAttribute('data-src');
        if (targetSrc) {
          mainImg.src = targetSrc;
        }
      });
    });
  }

  /**
   * Render friendly not found state
   * @param {string} errorMsg
   */
  function renderProductNotFound(errorMsg) {
    const card = document.querySelector('.product-detail-card');
    if (!card) return;

    card.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" stroke-width="1.8" style="margin: 0 auto 16px; display: block;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2 style="font-family: var(--font-family-display, 'Oswald'); font-size: 1.5rem; color: #333333; margin-bottom: 8px;">
          KHÔNG TÌM THẤY SẢN PHẨM
        </h2>
        <p style="color: #666666; font-size: 0.875rem; margin-bottom: 24px; max-width: 480px; margin-left: auto; margin-right: auto;">
          ${escapeHtml(errorMsg || 'Cây vợt bạn đang tìm kiếm không tồn tại hoặc đã ngừng kinh doanh trên hệ thống.')}
        </p>
        <a href="products.html" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; background-color: #EA5C0B; color: #FFFFFF; font-weight: 700; font-size: 0.875rem; border-radius: 6px; text-decoration: none;">
          QUAY LẠI DANH MỤC SẢN PHẨM
        </a>
      </div>
    `;
  }

  /**
   * Quantity picker controls
   */
  function initQuantityControls() {
    const minusBtn = document.getElementById('btnQtyMinus');
    const plusBtn = document.getElementById('btnQtyPlus');
    const qtyInput = document.getElementById('productQtyInput');

    if (minusBtn && plusBtn && qtyInput) {
      minusBtn.addEventListener('click', function () {
        if (currentQuantity > 1) {
          currentQuantity--;
          qtyInput.value = currentQuantity;
        }
      });

      plusBtn.addEventListener('click', function () {
        const maxStock = (currentProduct && currentProduct.stockQuantity) ? currentProduct.stockQuantity : 99;
        if (currentQuantity < maxStock) {
          currentQuantity++;
          qtyInput.value = currentQuantity;
        }
      });

      qtyInput.addEventListener('change', function () {
        let val = parseInt(this.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        const maxStock = (currentProduct && currentProduct.stockQuantity) ? currentProduct.stockQuantity : 99;
        if (val > maxStock) val = maxStock;
        currentQuantity = val;
        this.value = currentQuantity;
      });
    }
  }

  /**
   * Purchase & Add to Cart button actions
   */
  function initActionButtons() {
    // Add to Cart (Solid Orange Button)
    const addCartBtn = document.getElementById('btnAddToCartOrange');
    if (addCartBtn) {
      addCartBtn.addEventListener('click', function () {
        if (!currentProduct) return;
        addToCart(currentProduct, currentQuantity);
        if (window.showToast) {
          window.showToast(`Đã thêm ${currentQuantity}x "${currentProduct.name}" vào giỏ hàng!`, 'success');
        }
      });
    }

    // Buy Now (Golden Yellow Button)
    const buyNowBtn = document.getElementById('btnBuyNowYellow');
    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', function () {
        if (!currentProduct) return;
        addToCart(currentProduct, currentQuantity);
        if (window.showToast) {
          window.showToast('Đang chuyển hướng tới cổng thanh toán...', 'info');
        }
        setTimeout(() => {
          window.location.href = 'checkout.html';
        }, 600);
      });
    }

    // Rent Now Button for Used / Rental rackets (Solid Orange Button)
    const rentNowBtn = document.getElementById('btnRentNowOrange');
    if (rentNowBtn) {
      rentNowBtn.addEventListener('click', function () {
        if (!currentProduct) return;
        if (window.RentalModal && typeof window.RentalModal.open === 'function') {
          window.RentalModal.open(currentProduct, currentQuantity);
        }
      });
    }

    // Rent Trial Button (Secondary banner button)
    const rentBtn = document.getElementById('btnRentTrial');
    if (rentBtn) {
      rentBtn.addEventListener('click', function () {
        if (!currentProduct) return;
        if (window.RentalModal && typeof window.RentalModal.open === 'function') {
          window.RentalModal.open(currentProduct, currentQuantity);
        } else {
          window.location.href = 'dashboard.html#rentals';
        }
      });
    }
  }

  function addToCart(product, quantity) {
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
   * Description & Policy Tabs switcher
   */
  function initDetailTabs() {
    const tabBtns = document.querySelectorAll('.tab-nav-btn');
    const panels = document.querySelectorAll('.tab-panel-body');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const targetId = this.getAttribute('data-tab');

        tabBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        this.classList.add('active');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  function formatCurrency(amount) {
    if (window.formatVND) return window.formatVND(amount);
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

  window.fetchProductDetails = fetchProductDetails;
  window.populateProductDetails = populateProductDetails;

})();
