/**
 * Smash Badminton System - User Order History Logic (user-orders.html)
 * Retrieves authenticated customer's orders via OrderAPI.getMyOrders(),
 * renders status cards, filter tabs, and re-order triggers.
 */

(function () {
  'use strict';

  const AUTH_TOKEN_KEY = 'brm_auth_token';
  const CART_KEY = 'brm_cart_items';

  let rawOrders = [];
  let currentFilter = 'ALL';

  document.addEventListener('DOMContentLoaded', function () {
    initUserOrdersPage();
  });

  /**
   * Main initializer
   */
  async function initUserOrdersPage() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const container = document.getElementById('userOrdersContainer');

    if (!token) {
      renderUnauthenticatedState(container);
      return;
    }

    initFilterTabListeners();
    await fetchOrders();
  }

  /**
   * Fetch orders from API
   */
  async function fetchOrders() {
    const container = document.getElementById('userOrdersContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="orders-loading-spinner">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        <div style="margin-top: 10px;">Đang tải danh sách đơn hàng...</div>
      </div>
    `;

    try {
      if (!window.OrderAPI || typeof window.OrderAPI.getMyOrders !== 'function') {
        throw new Error('OrderAPI service chưa sẵn sàng.');
      }

      const orders = await window.OrderAPI.getMyOrders();
      rawOrders = Array.isArray(orders) ? orders : [];

      // Sort newest first
      rawOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      updateTabBadges();
      renderFilteredOrders();

    } catch (err) {
      console.error('Failed to load user orders:', err);
      container.innerHTML = `
        <div class="orders-empty-state">
          <div class="empty-state-title" style="color: #D32F2F;">Không thể tải danh sách đơn hàng</div>
          <p class="empty-state-desc">${escapeHtml(err.message || 'Đã có lỗi xảy ra khi kết nối máy chủ.')}</p>
          <button type="button" class="btn-primary-orange" onclick="location.reload();">
            THỬ LẠI
          </button>
        </div>
      `;
    }
  }

  /**
   * Filter tab click events
   */
  function initFilterTabListeners() {
    const tabs = document.querySelectorAll('.order-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', function () {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.getAttribute('data-status') || 'ALL';
        renderFilteredOrders();
      });
    });
  }

  /**
   * Update badge counters on filter tabs
   */
  function updateTabBadges() {
    const counts = {
      ALL: rawOrders.length,
      Pending: 0,
      Confirmed: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0
    };

    rawOrders.forEach(order => {
      const status = (order.orderStatus || 'Pending');
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    Object.keys(counts).forEach(status => {
      const badge = document.getElementById(`badgeCount-${status}`);
      if (badge) {
        badge.textContent = counts[status];
      }
    });
  }

  /**
   * Filter and render orders matching current tab
   */
  function renderFilteredOrders() {
    const container = document.getElementById('userOrdersContainer');
    if (!container) return;

    let filtered = rawOrders;
    if (currentFilter !== 'ALL') {
      filtered = rawOrders.filter(o => (o.orderStatus || '').toLowerCase() === currentFilter.toLowerCase());
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="orders-empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <h3 class="empty-state-title">Chưa có đơn hàng nào</h3>
          <p class="empty-state-desc">
            ${currentFilter === 'ALL'
              ? 'Quý khách chưa thực hiện đơn hàng nào trên hệ thống Smash SEO Sports.'
              : `Không tìm thấy đơn hàng nào ở trạng thái "${getStatusText(currentFilter)}".`}
          </p>
          <a href="products.html" class="btn-primary-orange">
            KHÁM PHÁ VỢT MỚI NGAY
          </a>
        </div>
      `;
      return;
    }

    const html = `
      <div class="orders-list-container">
        ${filtered.map(renderOrderCard).join('')}
      </div>
    `;

    container.innerHTML = html;
    bindReorderButtons(filtered);
  }

  /**
   * Render single order card
   */
  function renderOrderCard(order) {
    const statusMeta = mapStatusMeta(order.orderStatus);
    const dateFormatted = formatDate(order.createdAt);
    const finalAmount = order.finalAmount || 0;
    const items = order.orderDetails || [];

    return `
      <article class="order-card" data-order-id="${order.id}">
        <!-- Header -->
        <div class="order-card-header">
          <div class="order-header-meta">
            <span class="order-id-label">ĐƠN HÀNG #SEO-${order.id}</span>
            <span class="order-date-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 2px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${dateFormatted}
            </span>
          </div>
          <div>
            <span class="status-badge ${statusMeta.badgeClass}">
              ● ${statusMeta.text}
            </span>
          </div>
        </div>

        <!-- Body: Order Items -->
        <div class="order-card-body">
          ${items.map(renderOrderItemRow).join('')}
        </div>

        <!-- Footer -->
        <div class="order-card-footer">
          <div class="order-shipping-info">
            <div><strong>Giao đến:</strong> ${escapeHtml(order.shippingAddress || 'Chưa cập nhật')}</div>
            <div><strong>Thanh toán:</strong> ${order.paymentMethod === 'BankTransfer' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt khi nhận hàng (COD)'}</div>
          </div>

          <div class="order-footer-actions">
            <div class="order-total-block">
              <div class="order-total-label">Tổng thanh toán</div>
              <div class="order-total-val">${formatCurrency(finalAmount)}</div>
            </div>

            <button type="button" class="btn-order-reorder" data-order-id="${order.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
              <span>Mua lại</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render single item in order details
   */
  function renderOrderItemRow(item) {
    const thumb = item.thumbnailImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=200&auto=format&fit=crop';
    const unitPrice = item.unitPrice || 0;
    const qty = item.quantity || 1;
    const lineTotal = item.subtotal || (unitPrice * qty);

    return `
      <div class="order-item-row">
        <img src="${thumb}" alt="${escapeHtml(item.productName || 'Sản phẩm')}" class="order-item-thumb">
        <div class="order-item-details">
          <div class="order-item-name">
            <a href="product-detail.html?id=${item.productId}">${escapeHtml(item.productName || 'Vợt cầu lông')}</a>
          </div>
          <div class="order-item-pricing">
            Đơn giá: ${formatCurrency(unitPrice)} &times; <strong>${qty}</strong>
          </div>
        </div>
        <div class="order-item-subtotal">
          ${formatCurrency(lineTotal)}
        </div>
      </div>
    `;
  }

  /**
   * Reorder button event binding
   */
  function bindReorderButtons(orders) {
    document.querySelectorAll('.btn-order-reorder').forEach(btn => {
      btn.addEventListener('click', function () {
        const orderId = parseInt(this.getAttribute('data-order-id'), 10);
        const order = orders.find(o => o.id === orderId);
        if (!order || !order.orderDetails) return;

        let cart = [];
        try {
          cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        } catch {
          cart = [];
        }

        order.orderDetails.forEach(item => {
          const existing = cart.find(c => c.id === item.productId);
          if (existing) {
            existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
          } else {
            cart.push({
              id: item.productId,
              name: item.productName,
              price: item.unitPrice,
              image: item.thumbnailImage,
              quantity: item.quantity || 1
            });
          }
        });

        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        if (typeof window.syncCartBadge === 'function') {
          window.syncCartBadge();
        }

        if (window.showToast) {
          window.showToast('Đã thêm các sản phẩm vào giỏ hàng!', 'success');
        }

        setTimeout(() => {
          window.location.href = 'cart.html';
        }, 500);
      });
    });
  }

  /**
   * Unauthenticated state view
   */
  function renderUnauthenticatedState(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="orders-empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <h3 class="empty-state-title">Bạn chưa đăng nhập tài khoản</h3>
        <p class="empty-state-desc">
          Vui lòng đăng nhập để xem lịch sử tất cả các đơn hàng đã đặt, theo dõi tiến độ giao hàng và thông tin bảo hành.
        </p>
        <a href="login.html?redirect=user-orders.html" class="btn-primary-orange">
          ĐĂNG NHẬP NGAY
        </a>
      </div>
    `;
  }

  /**
   * Status mappings to Vietnamese & Badge classes
   */
  function mapStatusMeta(status) {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'confirmed':
        return { text: 'Đã xác nhận', badgeClass: 'status-badge-confirmed' };
      case 'shipped':
        return { text: 'Đang giao hàng', badgeClass: 'status-badge-shipped' };
      case 'delivered':
        return { text: 'Giao thành công', badgeClass: 'status-badge-delivered' };
      case 'cancelled':
        return { text: 'Đã hủy', badgeClass: 'status-badge-cancelled' };
      case 'pending':
      default:
        return { text: 'Chờ duyệt', badgeClass: 'status-badge-pending' };
    }
  }

  function getStatusText(status) {
    return mapStatusMeta(status).text;
  }

  /**
   * Helpers
   */
  function formatDate(isoStr) {
    if (!isoStr) return 'Gần đây';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
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

})();
