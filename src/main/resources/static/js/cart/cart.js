/**
 * Smash Badminton System - Shopping Cart Page Logic (cart.html)
 * Manages cart rendering, quantity increment/decrement, item deletion, subtotal calculation, and voucher handling.
 */

(function () {
  'use strict';

  const CART_KEY = 'brm_cart_items';
  let discountAmount = 0;

  document.addEventListener('DOMContentLoaded', function () {
    renderCart();
    initCouponHandler();
  });

  /**
   * Read cart array from localStorage
   * @returns {Array}
   */
  function getCartItems() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Save cart array to localStorage and sync badge
   * @param {Array} items
   */
  function saveCartItems(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (typeof window.syncCartBadge === 'function') {
      window.syncCartBadge();
    }
  }

  /**
   * Render cart items or empty state
   */
  function renderCart() {
    const container = document.getElementById('cartContentContainer');
    const badgeEl = document.getElementById('cartItemCountBadge');
    if (!container) return;

    const items = getCartItems();
    const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (badgeEl) {
      badgeEl.textContent = `${totalCount} sản phẩm`;
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-container">
          <svg class="cart-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <h2 class="cart-empty-title">Giỏ hàng của bạn đang trống</h2>
          <p class="cart-empty-desc">
            Chưa có cây vợt nào trong giỏ hàng. Hãy khám phá ngay các siêu phẩm vợt thi đấu Yonex, Victor, Li-Ning chính hãng với nhiều ưu đãi hấp dẫn.
          </p>
          <a href="products.html" class="btn-empty-shopping">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            <span>TIẾP TỤC MUA SẮM</span>
          </a>
        </div>
      `;
      return;
    }

    // Render 2-column layout
    container.innerHTML = `
      <div class="cart-layout-grid">
        
        <!-- Left: Cart Items Table -->
        <div class="cart-table-card">
          <table class="cart-table">
            <thead>
              <tr>
                <th style="min-width: 280px;">Sản phẩm</th>
                <th style="width: 140px;">Đơn giá</th>
                <th style="width: 130px;">Số lượng</th>
                <th style="width: 150px;">Tạm tính</th>
                <th style="width: 60px; text-align: center;">Xóa</th>
              </tr>
            </thead>
            <tbody id="cartTableBody">
              ${items.map(renderCartRow).join('')}
            </tbody>
          </table>

          <div class="cart-table-footer">
            <a href="products.html" class="btn-continue-shopping">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              <span>Tiếp tục mua hàng</span>
            </a>
            <button type="button" class="btn-clear-cart" id="btnClearAllCart">
              Xóa toàn bộ giỏ hàng
            </button>
          </div>
        </div>

        <!-- Right: Order Summary Card -->
        <aside class="cart-summary-card">
          <h3 class="summary-card-title">TỔNG TIỀN ĐƠN HÀNG</h3>
          
          <div class="summary-rows-group">
            <div class="summary-row">
              <span>Tạm tính hàng hóa:</span>
              <strong id="cartSubtotalAmount">0 ₫</strong>
            </div>

            <div class="summary-row">
              <span>Phí vận chuyển:</span>
              <span style="color: #16A34A; font-weight: 700;">Miễn phí toàn quốc</span>
            </div>

            <div class="summary-row" id="couponDiscountRow" style="display: none;">
              <span>Mã giảm giá (SEO50K):</span>
              <strong style="color: #16A34A;" id="couponDiscountAmount">-50.000 ₫</strong>
            </div>

            <div class="summary-grand-total-row">
              <span class="grand-total-label">Tổng thanh toán:</span>
              <span class="grand-total-val" id="cartGrandTotalAmount">0 ₫</span>
            </div>
            <div class="grand-total-vat-hint">(Đã bao gồm VAT & phiếu bảo hành chính hãng)</div>
          </div>

          <!-- Coupon Box -->
          <div class="coupon-input-group">
            <input type="text" id="couponCodeInput" class="coupon-input" placeholder="Mã giảm giá (ví dụ: SEO50K)">
            <button type="button" class="btn-apply-coupon" id="btnApplyCoupon">ÁP DỤNG</button>
          </div>

          <!-- Checkout CTA (Solid Bright Orange) -->
          <a href="checkout.html" class="btn-proceed-checkout" id="btnProceedCheckout">
            <span>TIẾN HÀNH THANH TOÁN</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>

          <!-- Trust Perks -->
          <div class="cart-trust-perks">
            <div class="trust-perk-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Cam kết 100% vợt chính hãng, có tem chống giả</span>
            </div>
            <div class="trust-perk-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Bảo hành nứt cán & khung 90 ngày chính hãng</span>
            </div>
            <div class="trust-perk-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Miễn phí căng cước điện tử chuẩn LBS quốc tế</span>
            </div>
          </div>
        </aside>

      </div>
    `;

    bindCartRowEvents();
    bindClearAllEvent();
    updateSummaryCalculations();
  }

  /**
   * Render single row in cart table
   */
  function renderCartRow(item) {
    const unitPrice = item.price || 0;
    const subtotal = unitPrice * (item.quantity || 1);
    const thumb = item.image || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=300&auto=format&fit=crop';

    return `
      <tr data-id="${item.id}">
        <td>
          <div class="cart-product-cell">
            <img src="${thumb}" alt="${escapeHtml(item.name)}" class="cart-thumb-img">
            <div class="cart-item-meta">
              <a href="product-detail.html?id=${item.id}" class="cart-item-name">${escapeHtml(item.name)}</a>
              <span class="cart-item-tag">Chính hãng 100%</span>
            </div>
          </div>
        </td>
        <td class="cart-price-cell">
          ${formatCurrency(unitPrice)}
        </td>
        <td>
          <div class="cart-qty-picker">
            <button type="button" class="btn-qty-step btn-cart-minus" data-id="${item.id}" aria-label="Giảm">-</button>
            <input type="number" class="cart-qty-input" data-id="${item.id}" value="${item.quantity || 1}" min="1" max="99">
            <button type="button" class="btn-qty-step btn-cart-plus" data-id="${item.id}" aria-label="Tăng">+</button>
          </div>
        </td>
        <td class="cart-subtotal-cell" id="subtotal-${item.id}">
          ${formatCurrency(subtotal)}
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-remove-item" data-id="${item.id}" title="Xóa khỏi giỏ hàng" aria-label="Xóa">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </td>
      </tr>
    `;
  }

  /**
   * Bind events for plus/minus/input/delete buttons
   */
  function bindCartRowEvents() {
    // Minus Button
    document.querySelectorAll('.btn-cart-minus').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        updateItemQuantity(id, -1, true);
      });
    });

    // Plus Button
    document.querySelectorAll('.btn-cart-plus').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        updateItemQuantity(id, 1, true);
      });
    });

    // Direct input change
    document.querySelectorAll('.cart-qty-input').forEach(input => {
      input.addEventListener('change', function () {
        const id = this.getAttribute('data-id');
        let val = parseInt(this.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        setItemQuantityDirect(id, val);
      });
    });

    // Remove Item Button
    document.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        removeItemFromCart(id);
      });
    });
  }

  /**
   * Increment or decrement item quantity
   */
  function updateItemQuantity(productId, delta, isRelative) {
    const items = getCartItems();
    const item = items.find(i => String(i.id) === String(productId));
    if (!item) return;

    if (isRelative) {
      item.quantity = (item.quantity || 1) + delta;
    } else {
      item.quantity = delta;
    }

    if (item.quantity <= 0) {
      removeItemFromCart(productId);
      return;
    }

    saveCartItems(items);
    renderCart();
  }

  function setItemQuantityDirect(productId, newQty) {
    const items = getCartItems();
    const item = items.find(i => String(i.id) === String(productId));
    if (!item) return;

    item.quantity = newQty;
    saveCartItems(items);
    renderCart();
  }

  /**
   * Remove item from cart
   */
  function removeItemFromCart(productId) {
    let items = getCartItems();
    const removedItem = items.find(i => String(i.id) === String(productId));
    items = items.filter(i => String(i.id) !== String(productId));

    saveCartItems(items);
    renderCart();

    if (window.showToast && removedItem) {
      window.showToast(`Đã xóa "${removedItem.name}" khỏi giỏ hàng.`, 'info');
    }
  }

  /**
   * Clear all items
   */
  function bindClearAllEvent() {
    const btnClearAll = document.getElementById('btnClearAllCart');
    if (!btnClearAll) return;

    btnClearAll.addEventListener('click', function () {
      if (confirm('Quý khách có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?')) {
        saveCartItems([]);
        renderCart();
        if (window.showToast) {
          window.showToast('Đã dọn sạch giỏ hàng.', 'info');
        }
      }
    });
  }

  /**
   * Update subtotal and grand total figures
   */
  function updateSummaryCalculations() {
    const subtotalEl = document.getElementById('cartSubtotalAmount');
    const grandTotalEl = document.getElementById('cartGrandTotalAmount');
    const discountRow = document.getElementById('couponDiscountRow');
    if (!subtotalEl || !grandTotalEl) return;

    const items = getCartItems();
    const rawSubtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const finalTotal = Math.max(0, rawSubtotal - discountAmount);

    subtotalEl.textContent = formatCurrency(rawSubtotal);
    grandTotalEl.textContent = formatCurrency(finalTotal);

    if (discountRow) {
      discountRow.style.display = discountAmount > 0 ? 'flex' : 'none';
    }
  }

  /**
   * Coupon code validation
   */
  function initCouponHandler() {
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'btnApplyCoupon') {
        const input = document.getElementById('couponCodeInput');
        if (!input) return;

        const code = input.value.trim().toUpperCase();
        if (!code) {
          if (window.showToast) window.showToast('Vui lòng nhập mã giảm giá.', 'error');
          return;
        }

        if (code === 'SEO50K' || code === 'VNB50K') {
          discountAmount = 50000;
          updateSummaryCalculations();
          if (window.showToast) {
            window.showToast('Áp dụng mã giảm giá 50.000 ₫ thành công!', 'success');
          }
        } else {
          discountAmount = 0;
          updateSummaryCalculations();
          if (window.showToast) {
            window.showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn.', 'error');
          }
        }
      }
    });
  }

  function formatCurrency(val) {
    if (typeof window.formatVND === 'function') {
      return window.formatVND(val);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
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
