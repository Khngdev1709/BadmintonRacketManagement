/**
 * Smash Badminton System (VNB Retail Theme) - User Dashboard Rental History
 * Feature: rental
 * Fetches user rental contracts from backend and dynamically renders the rental contracts list.
 */

(function () {
  'use strict';

  let cachedRentals = [];

  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('dashboardRentalsContainer');
    if (container) {
      loadRentalsList();
    }
  });

  /**
   * Fetch authenticated user's rentals from backend via RentalAPI
   * @returns {Promise<Array<Object>>}
   */
  async function loadRentalsList() {
    const container = document.getElementById('dashboardRentalsContainer');
    const badge = document.getElementById('sidebarRentalsBadge');
    if (!container) return [];

    try {
      let rentals = [];
      if (window.RentalAPI && typeof window.RentalAPI.getMyRentals === 'function') {
        rentals = await window.RentalAPI.getMyRentals();
      } else if (window.DashboardAPI && typeof window.DashboardAPI.getRentals === 'function') {
        rentals = await window.DashboardAPI.getRentals();
      } else {
        const token = localStorage.getItem('brm_auth_token');
        const res = await fetch('/api/rentals', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const json = await res.json();
        rentals = (json && Array.isArray(json.data)) ? json.data : (Array.isArray(json) ? json : []);
      }

      cachedRentals = rentals || [];
      renderRentals(cachedRentals);
      updateRentalMetrics(cachedRentals);

      return cachedRentals;
    } catch (err) {
      console.error('loadRentalsList error:', err);
      renderErrorState(container, err.message);
      return [];
    }
  }

  /**
   * Render rental contracts into container
   * @param {Array<Object>} rentals
   */
  function renderRentals(rentals) {
    const container = document.getElementById('dashboardRentalsContainer');
    const badge = document.getElementById('sidebarRentalsBadge');
    if (!container) return;

    const activeRentals = rentals.filter(r => {
      const s = (r.status || '').toUpperCase();
      return s === 'RENTING' || s === 'ACTIVE';
    });

    if (badge) {
      badge.textContent = `${activeRentals.length} Đang thuê`;
    }

    // Empty state matching the design
    if (rentals.length === 0) {
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

    // Render list cards
    container.innerHTML = rentals.map(r => {
      const details = r.rentalDetails || [];
      const firstDetail = details[0] || {};
      const racketNames = details.map(d => d.productName).filter(Boolean).join(', ') || 'Vợt Cầu Lông Cho Thuê';
      const firstImg = constructProductImageUrl(firstDetail.thumbnailImage);
      const totalQty = details.reduce((sum, d) => sum + (d.quantity || 1), 0);

      const startDate = formatDate(r.createdAt);
      const dueDate = formatDate(r.expectedReturnDate);
      const depositType = r.depositType || 'Tiền mặt';
      const totalFee = formatVND(r.grandTotal || r.rentalFeeTotal || 0);
      const statusBadge = getStatusBadge(r.status);

      return `
        <div class="rental-entry-card" style="margin-bottom: 16px;">
          <img src="${escapeHtml(firstImg)}" 
               alt="${escapeHtml(racketNames)}" 
               class="rental-entry-img"
               onerror="this.onerror=null; this.src='image/Yonex Astrox 100ZZ.jpg';">

          <div>
            <h4 style="font-size: 0.9375rem; font-weight: 800; color: #222222; margin-bottom: 4px; line-height: 1.3;">
              ${escapeHtml(racketNames)}
            </h4>
            <div style="font-size: 0.8125rem; color: #666666;">
              Mã hợp đồng: <strong style="color: #333333;">#HDT-${r.id}</strong>
              ${totalQty > 1 ? ` • Số lượng: <strong>${totalQty} cây</strong>` : ''}
            </div>
            <div style="margin-top: 6px;">
              ${statusBadge}
            </div>
          </div>

          <div>
            <div style="font-size: 0.6875rem; font-weight: 700; color: #888888; text-transform: uppercase; margin-bottom: 2px;">Thời Hạn Thuê</div>
            <div style="font-weight: 700; color: #333333; font-size: 0.8125rem;">${startDate} — ${dueDate}</div>
            <div style="color: var(--color-brand-orange, #EA5C0B); font-size: 0.75rem; font-weight: 800; margin-top: 2px;">
              Thời hạn: ${r.rentalDays || 1} ngày
            </div>
          </div>

          <div>
            <div style="font-size: 0.6875rem; font-weight: 700; color: #888888; text-transform: uppercase; margin-bottom: 2px;">Hình Thức Cọc</div>
            <div style="font-weight: 700; color: #333333; font-size: 0.8125rem; margin-bottom: 4px;">
              ${escapeHtml(depositType)}
            </div>
            <div style="font-size: 0.6875rem; font-weight: 700; color: #888888; text-transform: uppercase; margin-bottom: 2px;">Tổng Phí Thuê</div>
            <div style="font-weight: 800; color: var(--color-price-red, #D32F2F); font-size: 0.9375rem;">
              ${totalFee}
            </div>
          </div>

          <div style="text-align: right;">
            <a href="products.html?condition=used" class="btn-save-profile" style="padding: 8px 14px; font-size: 0.75rem; text-decoration: none; display: inline-block;">
              THUÊ THÊM VỢT
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Translates rental status to designated Vietnamese status badge
   * Orange for "Renting" (Đang thuê), Green for "Returned" (Đã trả)
   * @param {string} status
   * @returns {string} HTML badge
   */
  function getStatusBadge(status) {
    const s = (status || '').toUpperCase();
    if (s === 'RENTING' || s === 'ACTIVE') {
      return '<span class="rental-status-badge badge-renting"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Đang thuê</span>';
    }
    if (s === 'RETURNED' || s === 'COMPLETED') {
      return '<span class="rental-status-badge badge-returned"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Đã trả</span>';
    }
    return `<span class="rental-status-badge badge-other">${escapeHtml(status || 'Đang xử lý')}</span>`;
  }

  /**
   * Update metric cards in overview tab
   * @param {Array<Object>} rentals
   */
  function updateRentalMetrics(rentals) {
    const activeRentalsEl = document.getElementById('overviewActiveRentals');
    const activeRentalsSubEl = document.getElementById('overviewActiveRentalsSub');
    const depositHeldEl = document.getElementById('overviewDepositHeld');

    const activeCount = rentals.filter(r => {
      const s = (r.status || '').toUpperCase();
      return s === 'RENTING' || s === 'ACTIVE';
    }).length;

    if (activeRentalsEl) activeRentalsEl.textContent = activeCount;
    if (activeRentalsSubEl) {
      activeRentalsSubEl.textContent = activeCount > 0
        ? `${activeCount} Cây Vợt Đang Trải Nghiệm`
        : 'Chưa có hợp đồng thuê';
    }

    if (depositHeldEl) {
      const depositTotal = rentals
        .filter(r => {
          const s = (r.status || '').toUpperCase();
          return s === 'RENTING' || s === 'ACTIVE';
        })
        .reduce((sum, r) => sum + (Number(r.grandTotal || r.rentalFeeTotal) || 0), 0);
      depositHeldEl.textContent = formatVND(depositTotal);
    }
  }

  function renderErrorState(container, msg) {
    container.innerHTML = `
      <div style="text-align: center; padding: 36px 20px; background: #FFFFFF; border: 1px solid #FEE2E2; border-radius: 8px; color: #DC2626;">
        <div style="font-weight: 700; margin-bottom: 6px;">Không thể tải danh sách hợp đồng thuê vợt</div>
        <p style="font-size: 0.8125rem; color: #666666;">${escapeHtml(msg || 'Lỗi kết nối máy chủ.')}</p>
      </div>
    `;
  }

  function constructProductImageUrl(img) {
    if (!img) return 'image/Yonex Astrox 100ZZ.jpg';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    let clean = img.startsWith('/') ? img.substring(1) : img;
    if (clean.startsWith('images/')) {
      clean = 'image/' + clean.substring('images/'.length);
    } else if (!clean.startsWith('image/')) {
      clean = 'image/' + clean;
    }
    return clean;
  }

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

  function formatVND(amount) {
    if (window.formatVND) return window.formatVND(amount);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(amount || 0)
      .replace('₫', '')
      .trim() + ' ₫';
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

  window.RentalHistory = {
    loadRentalsList: loadRentalsList,
    renderRentals: renderRentals
  };

})();
