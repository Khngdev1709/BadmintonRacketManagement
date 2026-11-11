/**
 * Smash Badminton (VNB Sports Theme) - Dashboard Page Logic
 * Handles Vietnamese sidebar tab switching, real data population for orders, rentals, overview metrics, and profile.
 * Connects directly to backend database APIs. No hardcoded mock data.
 */

(function () {
  'use strict';

  let cachedOrders = [];
  let cachedRentals = [];

  document.addEventListener('DOMContentLoaded', async function () {
    const user = await initUserProfile();
    initSidebarTabs();
    await loadOrdersTable();
    await loadRentalsList();
    renderOverviewMetrics();
    await loadProfileForm(user);
    handleHashNavigation();
  });

  /**
   * Helper: Construct image URL from image path
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
   * Helper: Format ISO date string to DD/MM/YYYY
   */
  function formatDate(isoStr) {
    if (!isoStr) return '--/--/----';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return isoStr;
    }
  }

  /**
   * Helper: Format VND currency
   */
  function formatMoney(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('vi-VN') + ' ₫';
  }

  /**
   * Helper: Translate order status to Vietnamese badge
   */
  function getOrderStatusBadge(status) {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED' || s === 'COMPLETED' || s === 'SUCCESS') {
      return '<span class="status-tag status-tag-green">ĐÃ GIAO THÀNH CÔNG</span>';
    }
    if (s === 'SHIPPING' || s === 'DISPATCHED') {
      return '<span class="status-tag status-tag-blue">ĐANG VẬN CHUYỂN</span>';
    }
    if (s === 'CONFIRMED' || s === 'PROCESSING') {
      return '<span class="status-tag status-tag-blue" style="background:#FEF3C7; color:#B45309; border-color:#FDE68A;">ĐANG XỬ LÝ</span>';
    }
    if (s === 'CANCELLED') {
      return '<span class="status-tag" style="background:#FEE2E2; color:#DC2626; border-color:#FECACA;">ĐÃ HỦY</span>';
    }
    return '<span class="status-tag status-tag-blue" style="background:#FEF3C7; color:#B45309; border-color:#FDE68A;">CHỜ XÁC NHẬN</span>';
  }

  /**
   * Helper: Translate rental status to Vietnamese badge
   */
  function getRentalStatusBadge(status) {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE' || s === 'RENTING') {
      return '<span class="status-tag status-tag-orange">ĐANG THUÊ TRÊN SÂN</span>';
    }
    if (s === 'RETURNED' || s === 'COMPLETED') {
      return '<span class="status-tag status-tag-green">ĐÃ HOÀN TRẢ VỢT</span>';
    }
    if (s === 'OVERDUE') {
      return '<span class="status-tag" style="background:#FEE2E2; color:#DC2626; border-color:#FECACA;">QUÁ HẠN</span>';
    }
    return `<span class="status-tag status-tag-blue">${escapeHtml(status || 'ĐANG XỬ LÝ')}</span>`;
  }

  /**
   * Initializes user header in sidebar
   */
  async function initUserProfile() {
    try {
      const user = await window.DashboardAPI.getProfile();
      const avatarEl = document.getElementById('sidebarAvatar');
      const nameEl = document.getElementById('sidebarUserName');
      const roleEl = document.getElementById('sidebarUserRole');

      if (!user) {
        if (avatarEl) avatarEl.textContent = '?';
        if (nameEl) nameEl.textContent = 'Khách Hàng (Chưa Đăng Nhập)';
        if (roleEl) roleEl.textContent = 'Vui lòng đăng nhập';
        return null;
      }

      const displayName = user.fullName || user.username || 'Khách hàng';
      const initial = displayName.charAt(0).toUpperCase();
      const roleText = (user.role === 'ROLE_ADMIN' || user.role === 'Admin') 
        ? 'Quản Trị Viên (Admin)' 
        : ((user.role === 'ROLE_STAFF' || user.role === 'Staff') ? 'Nhân Viên Cửa Hàng' : 'Thành Viên VNB VIP');

      if (avatarEl) avatarEl.textContent = initial;
      if (nameEl) nameEl.textContent = displayName;
      if (roleEl) roleEl.textContent = roleText;

      return user;
    } catch (err) {
      console.error('Error loading sidebar profile:', err);
      return null;
    }
  }

  /**
   * Sidebar Tab Switching
   */
  function initSidebarTabs() {
    const tabBtns = document.querySelectorAll('.sidebar-tab-btn[data-tab]');
    const headingEl = document.getElementById('workspaceHeading');
    const kickerEl = document.getElementById('workspaceKicker');

    const TAB_HEADERS = {
      overview: { kicker: 'TRUNG TÂM TÀI KHOẢN', title: 'TỔNG QUAN TÀI KHOẢN' },
      orders: { kicker: 'LỊCH SỬ MUA HÀNG', title: 'ĐƠN HÀNG CỦA TÔI' },
      rentals: { kicker: 'DỊCH VỤ THUÊ VỢT', title: 'DANH SÁCH VỢT ĐANG THUÊ' },
      profile: { kicker: 'CÀI ĐẶT THÔNG TIN', title: 'HỒ SƠ KHÁCH HÀNG' }
    };

    tabBtns.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const tabId = this.getAttribute('data-tab');
        switchTab(tabId, tabBtns, TAB_HEADERS, headingEl, kickerEl);
      });
    });

    const logoutBtn = document.getElementById('btnSidebarLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (confirm('Quý khách có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
          localStorage.removeItem('brm_auth_token');
          localStorage.removeItem('brm_auth_user');
          window.location.href = 'index.html';
        }
      });
    }
  }

  function switchTab(tabId, tabBtns, headers, headingEl, kickerEl) {
    tabBtns.forEach(b => {
      if (b.getAttribute('data-tab') === tabId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    document.querySelectorAll('.dashboard-view-panel').forEach(panel => {
      if (panel.id === `view-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (headers[tabId]) {
      if (kickerEl) kickerEl.textContent = headers[tabId].kicker;
      if (headingEl) headingEl.textContent = headers[tabId].title;
    }

    window.location.hash = tabId;
  }

  function handleHashNavigation() {
    const hash = window.location.hash.replace('#', '');
    if (['overview', 'orders', 'rentals', 'profile'].includes(hash)) {
      const btn = document.querySelector(`.sidebar-tab-btn[data-tab="${hash}"]`);
      if (btn) btn.click();
    }
  }

  /**
   * Load Orders Table from real backend database
   */
  async function loadOrdersTable() {
    const tbody = document.getElementById('dashboardOrdersTableBody');
    const badge = document.getElementById('sidebarOrdersBadge');
    if (!tbody) return;

    try {
      const orders = await window.DashboardAPI.getOrders();
      cachedOrders = orders || [];

      if (badge) {
        badge.textContent = cachedOrders.length;
      }

      if (cachedOrders.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 48px 20px; color: #777777;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.8" style="margin: 0 auto 10px; display: block;">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
              </svg>
              <div style="font-weight: 700; color: #333333; margin-bottom: 6px;">Quý khách chưa có đơn hàng nào</div>
              <p style="font-size: 0.8125rem; margin-bottom: 16px;">Hãy khám phá các mẫu vợt cầu lông chính hãng mới nhất tại cửa hàng.</p>
              <a href="products.html" class="btn-save-profile" style="padding: 7px 18px; font-size: 0.8125rem; text-decoration: none; display: inline-block;">
                MUA SẮM NGAY
              </a>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = cachedOrders.map(order => {
        const orderCode = `SEO-DH-${order.id}`;
        const orderDate = formatDate(order.createdAt);
        const details = order.orderDetails || [];
        const firstItem = details[0] || {};
        const productName = firstItem.productName || 'Vợt Cầu Lông';
        const moreCount = details.length > 1 ? ` (+${details.length - 1} sản phẩm khác)` : '';
        const itemImg = constructProductImageUrl(firstItem.thumbnailImage);
        const totalFormatted = formatMoney(order.finalAmount);
        const statusBadge = getOrderStatusBadge(order.orderStatus);

        return `
          <tr>
            <td><strong style="color: var(--color-brand-orange);">${orderCode}</strong></td>
            <td>${orderDate}</td>
            <td>
              <div class="order-thumb-wrapper">
                <img src="${escapeHtml(itemImg)}" 
                     alt="${escapeHtml(productName)}" 
                     class="order-thumb-img"
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=300&auto=format&fit=crop';">
                <div class="order-meta-col">
                  <span class="order-product-name">${escapeHtml(productName)}${moreCount}</span>
                  <span class="order-product-specs">Số lượng: ${firstItem.quantity || 1} • Thanh toán: ${escapeHtml(order.paymentMethod || 'COD')}</span>
                </div>
              </div>
            </td>
            <td><strong style="color: var(--color-price-red);">${totalFormatted}</strong></td>
            <td>${statusBadge}</td>
            <td>
              <a href="user-orders.html" class="btn-sidebar-signout" style="padding: 4px 8px; font-size: 0.75rem; color: #1E40AF; background: #EFF6FF; border-color: #BFDBFE; text-decoration: none; display: inline-block;">
                CHI TIẾT
              </a>
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      console.error('Error loading orders:', err);
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 30px; color: #D32F2F;">
            Không thể tải danh sách đơn hàng từ máy chủ. Vui lòng thử lại sau.
          </td>
        </tr>
      `;
    }
  }

  /**
   * Load Rentals List from real backend database
   */
  async function loadRentalsList() {
    const container = document.getElementById('dashboardRentalsContainer');
    const badge = document.getElementById('sidebarRentalsBadge');
    if (!container) return;

    try {
      const rentals = (window.RentalAPI && typeof window.RentalAPI.getMyRentals === 'function')
        ? await window.RentalAPI.getMyRentals()
        : await window.DashboardAPI.getRentals();
      cachedRentals = rentals || [];

      const activeRentals = cachedRentals.filter(r => ['ACTIVE', 'RENTING'].includes((r.status || '').toUpperCase()));

      if (badge) {
        badge.textContent = `${activeRentals.length} Đang thuê`;
      }

      if (cachedRentals.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 48px 20px; background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 8px; color: #777777;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.8" style="margin: 0 auto 10px; display: block;">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <div style="font-weight: 700; color: #333333; margin-bottom: 6px;">Quý khách chưa có hợp đồng thuê vợt nào</div>
            <p style="font-size: 0.8125rem; margin-bottom: 16px;">Trải nghiệm các dòng vợt cao cấp thi đấu với chi phí thuê siêu tiết kiệm chỉ từ 50.000 ₫/ngày.</p>
            <a href="products.html?condition=used" class="btn-save-profile" style="padding: 7px 18px; font-size: 0.8125rem; text-decoration: none; display: inline-block;">
              XEM VỢT CHO THUÊ
            </a>
          </div>
        `;
        return;
      }

      container.innerHTML = cachedRentals.map(r => {
        const details = r.rentalDetails || [];
        const firstDetail = details[0] || {};
        const productName = details.map(d => d.productName).filter(Boolean).join(', ') || firstDetail.productName || 'Vợt Cầu Lông Cho Thuê';
        const img = constructProductImageUrl(firstDetail.thumbnailImage);
        const startDate = formatDate(r.createdAt);
        const dueDate = formatDate(r.expectedReturnDate);
        const dailyRate = (firstDetail.pricePerDay || firstDetail.dailyRate) ? formatMoney(firstDetail.pricePerDay || firstDetail.dailyRate) : '-- ₫';
        const grandTotal = formatMoney(r.grandTotal || r.rentalFeeTotal);
        const statusBadge = getRentalStatusBadge(r.status);
        const depositType = r.depositType || 'Tiền mặt';
        const totalQty = details.reduce((sum, d) => sum + (d.quantity || d.rentQuantity || 1), 0);

        return `
          <div class="rental-entry-card">
            <img src="${escapeHtml(img)}" 
                 alt="${escapeHtml(productName)}" 
                 class="rental-entry-img"
                 onerror="this.onerror=null; this.src='image/Yonex Astrox 100ZZ.jpg';">
            <div>
              <h4 style="font-size: 1rem; font-weight: 800; color: #222222; margin-bottom: 4px;">${escapeHtml(productName)}</h4>
              <div style="font-size: 0.8125rem; color: #666666;">Số lượng thuê: <strong>${totalQty} cây</strong></div>
              <div style="font-size: 0.8125rem; color: #666666; margin-top: 2px;">Mã hợp đồng: <strong>#HDT-${r.id}</strong></div>
              <div style="margin-top: 6px;">${statusBadge}</div>
            </div>
            <div>
              <div style="font-size: 0.6875rem; font-weight: 700; color: #888888; text-transform: uppercase;">Thời Hạn Thuê</div>
              <div style="font-weight: 700; color: #333333;">${startDate} — ${dueDate}</div>
              <div style="color: var(--color-brand-orange); font-size: 0.75rem; font-weight: 800; margin-top: 2px;">Thời hạn: ${r.rentalDays || 1} ngày</div>
            </div>
            <div>
              <div style="font-size: 0.6875rem; font-weight: 700; color: #888888; text-transform: uppercase;">Hình Thức Cọc</div>
              <div style="font-weight: 700; color: #333333; font-size: 0.8125rem; margin-bottom: 4px;">${escapeHtml(depositType)}</div>
              <div style="font-size: 0.6875rem; font-weight: 700; color: #888888; text-transform: uppercase;">Tổng Phí Thuê</div>
              <div style="font-weight: 800; color: var(--color-price-red);">${grandTotal}</div>
            </div>
            <div>
              <a href="products.html?condition=used" class="btn-save-profile" style="padding: 8px 14px; font-size: 0.75rem; text-decoration: none; display: inline-block;">
                THUÊ THÊM VỢT
              </a>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error('Error loading rentals:', err);
    }
  }

  /**
   * Render dynamic metrics in Overview panel based on real DB data
   */
  function renderOverviewMetrics() {
    const totalSpentEl = document.getElementById('overviewTotalSpent');
    const totalOrdersSubEl = document.getElementById('overviewTotalOrdersSub');
    const activeRentalsEl = document.getElementById('overviewActiveRentals');
    const activeRentalsSubEl = document.getElementById('overviewActiveRentalsSub');
    const depositHeldEl = document.getElementById('overviewDepositHeld');
    const preferredTensionEl = document.getElementById('overviewPreferredTension');
    const recentOrdersTableBody = document.getElementById('overviewRecentOrdersTableBody');

    // 1. Calculate total spent from real orders
    const totalSpent = cachedOrders.reduce((sum, order) => {
      const val = order.finalAmount ? Number(order.finalAmount) : 0;
      return sum + val;
    }, 0);

    if (totalSpentEl) totalSpentEl.textContent = formatMoney(totalSpent);
    if (totalOrdersSubEl) totalOrdersSubEl.textContent = `${cachedOrders.length} Đơn Hàng Đã Đặt`;

    // 2. Active rentals
    const activeCount = cachedRentals.filter(r => ['ACTIVE', 'RENTING'].includes((r.status || '').toUpperCase())).length;
    if (activeRentalsEl) activeRentalsEl.textContent = activeCount;
    if (activeRentalsSubEl) {
      activeRentalsSubEl.textContent = activeCount > 0 
        ? `${activeCount} Cây Vợt Đang Trải Nghiệm` 
        : 'Chưa có vợt đang thuê';
    }

    // 3. Deposit held
    const depositTotal = cachedRentals.filter(r => ['ACTIVE', 'RENTING'].includes((r.status || '').toUpperCase())).reduce((sum, r) => {
      const dep = r.grandTotal ? Number(r.grandTotal) : 0;
      return sum + dep;
    }, 0);
    if (depositHeldEl) depositHeldEl.textContent = formatMoney(depositTotal);

    // 4. Preferred tension from profile
    const rawUser = localStorage.getItem('brm_auth_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        if (preferredTensionEl && u.tensionPreference) {
          preferredTensionEl.textContent = u.tensionPreference.split('-')[0].trim();
        }
      } catch (e) {
        // Fallback default
      }
    }

    // 5. Populate Overview recent orders table (up to 5 recent orders)
    if (recentOrdersTableBody) {
      if (cachedOrders.length === 0) {
        recentOrdersTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 24px; color: #888888;">
              Chưa có đơn hàng gần đây.
            </td>
          </tr>
        `;
      } else {
        const recent = cachedOrders.slice(0, 5);
        recentOrdersTableBody.innerHTML = recent.map(order => {
          const code = `SEO-DH-${order.id}`;
          const date = formatDate(order.createdAt);
          const details = order.orderDetails || [];
          const firstItem = details[0] || {};
          const prodName = firstItem.productName || 'Vợt Cầu Lông';
          const more = details.length > 1 ? ` (+${details.length - 1})` : '';
          const total = formatMoney(order.finalAmount);
          const badge = getOrderStatusBadge(order.orderStatus);

          return `
            <tr>
              <td><strong style="color: var(--color-brand-orange);">${code}</strong></td>
              <td>${date}</td>
              <td>${escapeHtml(prodName)}${more}</td>
              <td><strong style="color: var(--color-price-red);">${total}</strong></td>
              <td>${badge}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  /**
   * Load and save Profile Form
   */
  async function loadProfileForm(user) {
    const form = document.getElementById('vnbProfileForm');
    if (!form) return;

    const u = user || (await window.DashboardAPI.getProfile()) || {};

    const nameInput = document.getElementById('profNameInput');
    const emailInput = document.getElementById('profEmailInput');
    const phoneInput = document.getElementById('profPhoneInput');
    const addressInput = document.getElementById('profAddressInput');
    const styleInput = document.getElementById('profStyleInput');
    const tensionInput = document.getElementById('profTensionInput');

    if (nameInput) nameInput.value = u.fullName || u.username || '';
    if (emailInput) emailInput.value = u.email || '';
    if (phoneInput) phoneInput.value = u.phoneNumber || '';
    if (addressInput) addressInput.value = u.address || '';
    if (styleInput && u.playingStyle) styleInput.value = u.playingStyle;
    if (tensionInput && u.tensionPreference) tensionInput.value = u.tensionPreference;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const updated = {
        fullName: nameInput ? nameInput.value.trim() : '',
        email: emailInput ? emailInput.value.trim() : '',
        phoneNumber: phoneInput ? phoneInput.value.trim() : '',
        address: addressInput ? addressInput.value.trim() : '',
        playingStyle: styleInput ? styleInput.value : '',
        tensionPreference: tensionInput ? tensionInput.value : ''
      };

      await window.DashboardAPI.updateProfile(updated);
      await initUserProfile();
      renderOverviewMetrics();

      if (window.showToast) {
        window.showToast('Đã lưu thông tin tài khoản thành công!', 'success');
      } else {
        alert('Đã lưu thông tin tài khoản thành công!');
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
