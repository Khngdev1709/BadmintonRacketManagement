/**
 * Smash Badminton System - Admin Order Management Logic (admin-orders.html)
 * Loads all system orders, computes operational stats, filters,
 * updates order statuses via AdminOrderAPI.updateOrderStatus(), and inspects full order details.
 */

(function () {
  'use strict';

  let allOrders = [];
  let filteredOrders = [];
  let currentSearchQuery = '';
  let currentStatusFilter = 'ALL';

  document.addEventListener('DOMContentLoaded', function () {
    initAdminOrdersPage();
  });

  /**
   * Main initializer
   */
  async function initAdminOrdersPage() {
    initSearchAndFilterListeners();
    initModalControls();
    await fetchAndRenderOrders();
  }

  /**
   * Fetch all orders from backend
   */
  async function fetchAndRenderOrders() {
    const tbody = document.getElementById('adminOrdersTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #6B7280;">
          <div style="display: inline-block; animation: spin 1s linear infinite; margin-bottom: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA5C0B" stroke-width="2.5"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
          </div>
          <div>Đang tải danh sách đơn hàng toàn hệ thống...</div>
        </td>
      </tr>
    `;

    try {
      if (!window.AdminOrderAPI || typeof window.AdminOrderAPI.getAllOrders !== 'function') {
        throw new Error('AdminOrderAPI chưa sẵn sàng.');
      }

      const data = await window.AdminOrderAPI.getAllOrders();
      allOrders = Array.isArray(data) ? data : [];

      // Sort newest first
      allOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      updateDashboardStats();
      applyFiltersAndRender();

    } catch (err) {
      console.error('Failed to load admin orders:', err);
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: #D32F2F;">
            <strong>Không thể tải dữ liệu đơn hàng:</strong> ${escapeHtml(err.message || 'Lỗi kết nối')}
            <div style="margin-top: 10px;">
              <button type="button" class="btn-admin btn-admin-primary" onclick="location.reload();">Tải lại</button>
            </div>
          </td>
        </tr>
      `;
    }
  }

  /**
   * Update top statistic counters
   */
  function updateDashboardStats() {
    const totalEl = document.getElementById('statTotalOrders');
    const pendingEl = document.getElementById('statPendingOrders');
    const revenueEl = document.getElementById('statTotalRevenue');

    const totalCount = allOrders.length;
    const pendingCount = allOrders.filter(o => (o.orderStatus || '').toLowerCase() === 'pending').length;
    
    // Revenue sum of non-cancelled orders
    const totalRev = allOrders
      .filter(o => (o.orderStatus || '').toLowerCase() !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);

    if (totalEl) totalEl.textContent = totalCount;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (revenueEl) revenueEl.textContent = formatCurrency(totalRev);
  }

  /**
   * Search and filter controls
   */
  function initSearchAndFilterListeners() {
    const searchInput = document.getElementById('adminOrderSearchInput');
    const statusSelect = document.getElementById('adminOrderStatusFilter');
    const refreshBtn = document.getElementById('btnRefreshOrders');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        currentSearchQuery = this.value.trim().toLowerCase();
        applyFiltersAndRender();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', function () {
        currentStatusFilter = this.value;
        applyFiltersAndRender();
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        fetchAndRenderOrders();
      });
    }
  }

  /**
   * Apply filters to data and render table
   */
  function applyFiltersAndRender() {
    filteredOrders = allOrders.filter(order => {
      // Status filter
      if (currentStatusFilter !== 'ALL') {
        if ((order.orderStatus || '').toLowerCase() !== currentStatusFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query filter (Order ID, Shipping Address, Payment Method)
      if (currentSearchQuery) {
        const idStr = String(order.id || '');
        const address = (order.shippingAddress || '').toLowerCase();
        const payment = (order.paymentMethod || '').toLowerCase();
        const items = (order.orderDetails || []).map(i => (i.productName || '').toLowerCase()).join(' ');

        if (!idStr.includes(currentSearchQuery) &&
            !address.includes(currentSearchQuery) &&
            !payment.includes(currentSearchQuery) &&
            !items.includes(currentSearchQuery)) {
          return false;
        }
      }

      return true;
    });

    renderTable();
  }

  /**
   * Render table rows
   */
  function renderTable() {
    const tbody = document.getElementById('adminOrdersTableBody');
    const countBadge = document.getElementById('filteredOrdersCount');
    if (!tbody) return;

    if (countBadge) {
      countBadge.textContent = `${filteredOrders.length} đơn`;
    }

    if (filteredOrders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: #6B7280;">
            Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredOrders.map(renderOrderTableRow).join('');

    bindStatusSelectEvents();
    bindDetailModalEvents();
  }

  /**
   * Single Table Row HTML
   */
  function renderOrderTableRow(order) {
    const statusLower = (order.orderStatus || 'pending').toLowerCase();
    const finalAmount = order.finalAmount || 0;
    const dateFormatted = formatDate(order.createdAt);
    const itemsCount = (order.orderDetails || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
    const firstItemName = order.orderDetails && order.orderDetails.length > 0
      ? order.orderDetails[0].productName
      : 'Sản phẩm';

    const itemsSummary = itemsCount > 1
      ? `${firstItemName} + ${itemsCount - 1} món khác`
      : firstItemName;

    const paymentLabel = order.paymentMethod === 'BankTransfer' ? 'Chuyển khoản' : 'Tiền mặt (COD)';

    return `
      <tr data-order-id="${order.id}">
        <td>
          <span class="order-id-badge">#SEO-${order.id}</span>
        </td>
        <td>
          <div class="customer-cell-name">Khách hàng #${order.userId}</div>
          <div class="customer-cell-address" title="${escapeHtml(order.shippingAddress || '')}">
            ${escapeHtml(order.shippingAddress || 'Chưa có thông tin')}
          </div>
        </td>
        <td>
          <span style="font-weight: 600; color: #111827;">${itemsCount} món</span>
          <div style="font-size: 0.75rem; color: #6B7280; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(itemsSummary)}">
            ${escapeHtml(itemsSummary)}
          </div>
        </td>
        <td>
          <span class="order-price-cell">${formatCurrency(finalAmount)}</span>
        </td>
        <td>
          <span style="font-size: 0.8125rem; font-weight: 600; color: #4B5563;">${paymentLabel}</span>
        </td>
        <td style="font-size: 0.8125rem; color: #6B7280; white-space: nowrap;">
          ${dateFormatted}
        </td>
        <td>
          <select class="status-changer-select status-${statusLower}" data-order-id="${order.id}">
            <option value="Pending" ${statusLower === 'pending' ? 'selected' : ''}>Chờ duyệt</option>
            <option value="Confirmed" ${statusLower === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
            <option value="Shipped" ${statusLower === 'shipped' ? 'selected' : ''}>Đang giao</option>
            <option value="Delivered" ${statusLower === 'delivered' ? 'selected' : ''}>Giao thành công</option>
            <option value="Cancelled" ${statusLower === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
          </select>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-view-details" data-order-id="${order.id}">
            Chi tiết
          </button>
        </td>
      </tr>
    `;
  }

  /**
   * Bind status select change triggers
   */
  function bindStatusSelectEvents() {
    document.querySelectorAll('.status-changer-select').forEach(select => {
      select.addEventListener('change', async function () {
        const orderId = this.getAttribute('data-order-id');
        const newStatus = this.value;
        const prevStatusClass = this.className;

        try {
          this.disabled = true;
          await window.AdminOrderAPI.updateOrderStatus(orderId, newStatus);

          // Update local memory
          const order = allOrders.find(o => o.id == orderId);
          if (order) {
            order.orderStatus = newStatus;
          }

          // Update styling
          this.className = `status-changer-select status-${newStatus.toLowerCase()}`;
          this.disabled = false;

          updateDashboardStats();

          if (window.showToast) {
            window.showToast(`Đã cập nhật trạng thái đơn #${orderId} thành "${newStatus}"`, 'success');
          } else {
            console.log(`Status of #${orderId} updated to ${newStatus}`);
          }

        } catch (err) {
          console.error('Update status failed:', err);
          alert(`Lỗi khi cập nhật trạng thái đơn: ${err.message || 'Không thể kết nối'}`);
          this.className = prevStatusClass;
          this.disabled = false;
        }
      });
    });
  }

  /**
   * Detail modal handling
   */
  function initModalControls() {
    const modal = document.getElementById('adminOrderDetailModal');
    const closeBtn = document.getElementById('btnCloseDetailModal');
    const footerCloseBtn = document.getElementById('btnFooterCloseDetailModal');

    const closeModal = () => {
      if (modal) modal.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (footerCloseBtn) footerCloseBtn.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }
  }

  function bindDetailModalEvents() {
    document.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', function () {
        const orderId = parseInt(this.getAttribute('data-order-id'), 10);
        const order = allOrders.find(o => o.id === orderId);
        if (!order) return;

        openOrderDetailModal(order);
      });
    });
  }

  function openOrderDetailModal(order) {
    const modal = document.getElementById('adminOrderDetailModal');
    const content = document.getElementById('adminModalBodyContent');
    const titleEl = document.getElementById('adminModalOrderTitle');

    if (!modal || !content) return;

    if (titleEl) {
      titleEl.textContent = `CHI TIẾT ĐƠN HÀNG #SEO-${order.id}`;
    }

    const items = order.orderDetails || [];
    const itemsHtml = items.map(item => {
      const thumb = item.thumbnailImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=200&auto=format&fit=crop';
      const unit = item.unitPrice || 0;
      const subtotal = item.subtotal || (unit * (item.quantity || 1));

      return `
        <tr style="border-bottom: 1px solid #EBEBEB;">
          <td style="padding: 10px; display: flex; align-items: center; gap: 10px;">
            <img src="${thumb}" alt="${escapeHtml(item.productName)}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px; border: 1px solid #EBEBEB;">
            <span style="font-weight: 600; color: #222222; font-size: 0.8125rem;">${escapeHtml(item.productName)}</span>
          </td>
          <td style="padding: 10px; text-align: center; font-size: 0.8125rem;">${item.quantity || 1}</td>
          <td style="padding: 10px; text-align: right; font-size: 0.8125rem;">${formatCurrency(unit)}</td>
          <td style="padding: 10px; text-align: right; font-weight: 700; color: #D32F2F; font-size: 0.8125rem;">${formatCurrency(subtotal)}</td>
        </tr>
      `;
    }).join('');

    content.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background-color: #F8F9FA; padding: 16px; border-radius: 6px; font-size: 0.8125rem;">
        <div>
          <div style="color: #6B7280; margin-bottom: 2px;">Mã đơn & Người đặt:</div>
          <strong style="color: #111827; font-size: 0.9375rem;">#SEO-${order.id} (User ID: ${order.userId})</strong>
        </div>
        <div>
          <div style="color: #6B7280; margin-bottom: 2px;">Thời gian đặt hàng:</div>
          <strong style="color: #111827;">${formatDate(order.createdAt)}</strong>
        </div>
        <div style="grid-column: span 2;">
          <div style="color: #6B7280; margin-bottom: 2px;">Thông tin giao hàng:</div>
          <strong style="color: #111827;">${escapeHtml(order.shippingAddress || 'Chưa có địa chỉ')}</strong>
        </div>
        <div>
          <div style="color: #6B7280; margin-bottom: 2px;">Phương thức thanh toán:</div>
          <strong style="color: #111827;">${order.paymentMethod === 'BankTransfer' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt khi nhận hàng (COD)'}</strong>
        </div>
        <div>
          <div style="color: #6B7280; margin-bottom: 2px;">Trạng thái đơn:</div>
          <strong style="color: #EA5C0B; text-transform: uppercase;">${order.orderStatus || 'Pending'}</strong>
        </div>
      </div>

      <div style="font-weight: 700; font-size: 0.875rem; text-transform: uppercase; margin-bottom: 10px; color: #222222;">
        DANH SÁCH SẢN PHẨM (${items.length} món)
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #F3F4F6; text-transform: uppercase; font-size: 0.6875rem; font-weight: 800; color: #4B5563;">
            <th style="padding: 10px; text-align: left;">Sản phẩm</th>
            <th style="padding: 10px; text-align: center; width: 60px;">SL</th>
            <th style="padding: 10px; text-align: right; width: 110px;">Đơn giá</th>
            <th style="padding: 10px; text-align: right; width: 120px;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; align-items: baseline; gap: 12px; padding-top: 14px; border-top: 2px dashed #EBEBEB;">
        <span style="font-size: 0.875rem; font-weight: 700; color: #374151; text-transform: uppercase;">Tổng tiền thanh toán:</span>
        <span style="font-family: 'Oswald', sans-serif; font-size: 1.5rem; font-weight: 800; color: #D32F2F;">
          ${formatCurrency(order.finalAmount || 0)}
        </span>
      </div>
    `;

    modal.classList.add('active');
  }

  /**
   * Format VND & Dates
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
