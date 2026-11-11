/**
 * Smash Badminton System - Checkout Page Logic (checkout.html)
 * Manages customer shipping form, payment method toggles, order summary calculations,
 * and calls OrderAPI.createOrder() to create real orders in the database.
 */

(function () {
  'use strict';

  const CART_KEY = 'brm_cart_items';
  const AUTH_TOKEN_KEY = 'brm_auth_token';
  const AUTH_USER_KEY = 'brm_auth_user';

  let selectedPaymentMethod = 'COD';
  let cartItems = [];
  let subtotalAmount = 0;
  let finalGrandTotal = 0;

  document.addEventListener('DOMContentLoaded', function () {
    initCheckoutPage();
  });

  /**
   * Main initializer
   */
  function initCheckoutPage() {
    loadCartData();
    if (cartItems.length === 0) {
      renderEmptyCartState();
      return;
    }

    checkAuthStatus();
    renderSummaryItems();
    initPaymentMethodToggles();
    initFormSubmission();
  }

  /**
   * Load and validate cart items from localStorage
   */
  function loadCartData() {
    try {
      cartItems = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
      cartItems = [];
    }
  }

  /**
   * Check login state and prefill form
   */
  function checkAuthStatus() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const authBox = document.getElementById('checkoutAuthNotice');
    const userRaw = localStorage.getItem(AUTH_USER_KEY);

    if (!token) {
      if (authBox) {
        authBox.style.display = 'flex';
      }
      return;
    }

    if (authBox) {
      authBox.style.display = 'none';
    }

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const nameInput = document.getElementById('checkoutFullName');
        const phoneInput = document.getElementById('checkoutPhone');
        const addressInput = document.getElementById('checkoutAddress');

        if (nameInput && !nameInput.value && (user.fullName || user.username)) {
          nameInput.value = user.fullName || user.username;
        }
        if (phoneInput && !phoneInput.value && user.phone) {
          phoneInput.value = user.phone;
        }
        if (addressInput && !addressInput.value && user.address) {
          addressInput.value = user.address;
        }
      } catch (e) {
        console.warn('Failed to parse cached auth user:', e);
      }
    }
  }

  /**
   * Render cart items in right column summary
   */
  function renderSummaryItems() {
    const listContainer = document.getElementById('checkoutSummaryItemsList');
    const subtotalEl = document.getElementById('summarySubtotal');
    const grandTotalEl = document.getElementById('summaryGrandTotal');
    const totalCountBadge = document.getElementById('summaryItemCountBadge');

    if (!listContainer) return;

    let subtotal = 0;
    let totalItems = 0;

    const html = cartItems.map(item => {
      const price = item.price || 0;
      const qty = item.quantity || 1;
      const lineTotal = price * qty;
      subtotal += lineTotal;
      totalItems += qty;

      const thumb = item.image || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=200&auto=format&fit=crop';

      return `
        <div class="summary-item-row">
          <img src="${thumb}" alt="${escapeHtml(item.name)}" class="summary-item-thumb">
          <div class="summary-item-info">
            <div class="summary-item-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
            <div class="summary-item-meta">Số lượng: <strong>x${qty}</strong> • ${formatCurrency(price)}</div>
          </div>
          <div class="summary-item-price">
            ${formatCurrency(lineTotal)}
          </div>
        </div>
      `;
    }).join('');

    listContainer.innerHTML = html;

    subtotalAmount = subtotal;
    finalGrandTotal = subtotal; // Free shipping standard

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotalAmount);
    if (grandTotalEl) grandTotalEl.textContent = formatCurrency(finalGrandTotal);
    if (totalCountBadge) totalCountBadge.textContent = `${totalItems} món`;
  }

  /**
   * Payment method selection interactions
   */
  function initPaymentMethodToggles() {
    const options = document.querySelectorAll('.payment-method-option');
    const bankPanel = document.getElementById('bankInfoPanel');

    options.forEach(option => {
      option.addEventListener('click', function () {
        options.forEach(opt => opt.classList.remove('selected'));
        const radio = this.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        this.classList.add('selected');

        selectedPaymentMethod = this.getAttribute('data-method') || 'COD';

        if (bankPanel) {
          if (selectedPaymentMethod === 'BankTransfer') {
            bankPanel.classList.add('visible');
          } else {
            bankPanel.classList.remove('visible');
          }
        }
      });
    });
  }

  /**
   * Order form submission & API call
   */
  function initFormSubmission() {
    const form = document.getElementById('checkoutOrderForm');
    const submitBtn = document.getElementById('btnSubmitOrder');

    if (!form || !submitBtn) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Check authentication first
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        if (window.showToast) {
          window.showToast('Vui lòng đăng nhập để hoàn tất đặt hàng!', 'error');
        } else {
          alert('Vui lòng đăng nhập để hoàn tất đặt hàng!');
        }
        setTimeout(() => {
          window.location.href = 'login.html?redirect=checkout.html';
        }, 1200);
        return;
      }

      // Check cart validity
      if (!cartItems || cartItems.length === 0) {
        if (window.showToast) window.showToast('Giỏ hàng của bạn đang trống!', 'error');
        return;
      }

      // Read form fields
      const fullName = (document.getElementById('checkoutFullName')?.value || '').trim();
      const phone = (document.getElementById('checkoutPhone')?.value || '').trim();
      const address = (document.getElementById('checkoutAddress')?.value || '').trim();
      const notes = (document.getElementById('checkoutNotes')?.value || '').trim();

      if (!fullName) {
        alert('Vui lòng nhập Họ và tên người nhận.');
        document.getElementById('checkoutFullName')?.focus();
        return;
      }

      if (!phone || phone.length < 9) {
        alert('Vui lòng nhập số điện thoại hợp lệ.');
        document.getElementById('checkoutPhone')?.focus();
        return;
      }

      if (!address || address.length < 8) {
        alert('Vui lòng nhập địa chỉ giao hàng cụ thể (Số nhà, đường, phường/xã, quận/huyện).');
        document.getElementById('checkoutAddress')?.focus();
        return;
      }

      // Build shippingAddress string
      let fullShippingAddress = `${fullName} | SĐT: ${phone} | Địa chỉ: ${address}`;
      if (notes) {
        fullShippingAddress += ` | Ghi chú: ${notes}`;
      }

      // Prepare payload for backend POST /api/orders
      const payload = {
        items: cartItems.map(item => ({
          productId: parseInt(item.id, 10),
          quantity: parseInt(item.quantity || 1, 10)
        })),
        paymentMethod: selectedPaymentMethod,
        shippingAddress: fullShippingAddress
      };

      // Set loading state
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spinner-icon" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        <span>ĐANG XỬ LÝ ĐƠN HÀNG...</span>
      `;

      try {
        if (!window.OrderAPI || typeof window.OrderAPI.createOrder !== 'function') {
          throw new Error('Hệ thống API chưa sẵn sàng. Vui lòng tải lại trang.');
        }

        const result = await window.OrderAPI.createOrder(payload);
        const orderData = result.data || result;

        // Clear local cart
        localStorage.removeItem(CART_KEY);
        if (typeof window.syncCartBadge === 'function') {
          window.syncCartBadge();
        }

        // Show success modal
        displayOrderSuccessModal(orderData, fullName, phone, address, selectedPaymentMethod);

      } catch (err) {
        console.error('Create order failed:', err);
        const errMsg = err.message || 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại thông tin và thử lại.';
        alert(errMsg);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    });
  }

  /**
   * Display order success modal
   */
  function displayOrderSuccessModal(order, name, phone, address, paymentMethod) {
    const modal = document.getElementById('orderSuccessModal');
    if (!modal) {
      alert(`Đặt hàng thành công! Mã đơn: #${order.id || ''}`);
      window.location.href = 'user-orders.html';
      return;
    }

    const orderIdEl = document.getElementById('modalSuccessOrderId');
    const totalEl = document.getElementById('modalSuccessTotal');
    const paymentEl = document.getElementById('modalSuccessPayment');
    const addressEl = document.getElementById('modalSuccessAddress');

    if (orderIdEl) orderIdEl.textContent = `#${order.id || 'SEO' + Date.now()}`;
    if (totalEl) totalEl.textContent = formatCurrency(order.finalAmount || finalGrandTotal);
    if (paymentEl) paymentEl.textContent = paymentMethod === 'COD' ? 'Thanh toán tiền mặt (COD)' : 'Chuyển khoản ngân hàng (Bank Transfer)';
    if (addressEl) addressEl.textContent = `${name} (${phone}) - ${address}`;

    modal.classList.add('active');
  }

  /**
   * Render empty cart placeholder when user opens checkout without items
   */
  function renderEmptyCartState() {
    const container = document.getElementById('checkoutMainContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="checkout-empty-notice">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EA5C0B" stroke-width="1.8" style="margin: 0 auto 16px; display: block;">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <h2 class="empty-notice-title">Giỏ hàng của bạn đang trống</h2>
        <p class="empty-notice-desc">Vui lòng chọn sản phẩm vào giỏ hàng trước khi tiến hành thanh toán đơn hàng.</p>
        <a href="products.html" class="btn-modal-primary" style="display: inline-flex; width: auto; padding: 12px 28px;">
          TIẾP TỤC MUA HÀNG
        </a>
      </div>
    `;
  }

  /**
   * Format VND helper
   */
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

})();
