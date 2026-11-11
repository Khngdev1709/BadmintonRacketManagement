/**
 * Smash Badminton (SEO Sports Theme) - Shared Layout Logic
 * Handles Vietnamese two-row header, user session, cart badge, and search redirection.
 */

(function () {
  'use strict';

  const AUTH_TOKEN_KEY = 'brm_auth_token';
  const AUTH_USER_KEY = 'brm_auth_user';
  const CART_KEY = 'brm_cart_items';

  /**
   * Initializes header account dropdown & session state
   */
  function initHeaderAuth() {
    const authContainer = document.getElementById('headerUserAction');
    if (!authContainer) return;

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userRaw = localStorage.getItem(AUTH_USER_KEY);

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const displayName = user.fullName || user.username || 'Khách hàng';
        const roleUpper = (user.role || '').toUpperCase();
        const isAdmin = roleUpper === 'ROLE_ADMIN' || roleUpper === 'ADMIN';

        authContainer.innerHTML = `
          <div class="user-menu-wrapper" id="userMenuWrapper">
            <a href="javascript:void(0)" class="header-action-item" id="headerUserBtn">
              <div class="header-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div class="header-action-text">
                <span class="action-label">Xin chào</span>
                <span class="action-val">${escapeHtml(displayName)}</span>
              </div>
            </a>

            <div class="user-dropdown-menu" id="userDropdownMenu">
              <div class="user-dropdown-header">
                Tài khoản thành viên
                <strong>${escapeHtml(displayName)}</strong>
              </div>
              <a href="user-orders.html" class="user-dropdown-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                Đơn mua của tôi
              </a>
              <a href="dashboard.html" class="user-dropdown-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                Hồ sơ tài khoản
              </a>
              <a href="dashboard.html#rentals" class="user-dropdown-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Vợt đang thuê
              </a>
              ${isAdmin ? `
                <div class="user-dropdown-divider"></div>
                <a href="templates/admin/admin-products.html" class="user-dropdown-link" style="color: var(--color-brand-orange); font-weight: 700;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                  Quản trị hệ thống (Admin)
                </a>
              ` : ''}
              <div class="user-dropdown-divider"></div>
              <a href="javascript:void(0)" id="headerLogoutLink" class="user-dropdown-link" style="color: var(--color-hotline-red);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Đăng xuất
              </a>
            </div>
          </div>
        `;

        const userBtn = document.getElementById('headerUserBtn');
        const dropdown = document.getElementById('userDropdownMenu');
        if (userBtn && dropdown) {
          userBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdown.classList.toggle('active');
          });

          document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target) && !userBtn.contains(e.target)) {
              dropdown.classList.remove('active');
            }
          });
        }

        const logoutBtn = document.getElementById('headerLogoutLink');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
            window.showToast('Đăng xuất thành công!', 'info');
            setTimeout(() => {
              window.location.reload();
            }, 600);
          });
        }
      } catch (e) {
        console.error('Failed to parse user profile', e);
        renderGuestUserAction(authContainer);
      }
    } else {
      renderGuestUserAction(authContainer);
    }
  }

  function renderGuestUserAction(container) {
    container.innerHTML = `
      <a href="login.html" class="header-action-item">
        <div class="header-action-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <div class="header-action-text">
          <span class="action-label">Tài khoản</span>
          <span class="action-val">Đăng nhập</span>
        </div>
      </a>
    `;
  }

  /**
   * Syncs Cart badge count
   */
  function syncCartBadge() {
    const badge = document.getElementById('navCartCount');
    if (!badge) return;

    try {
      const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    } catch {
      badge.textContent = '0';
      badge.style.display = 'none';
    }
  }

  /**
   * Search input handler with SEO tracking dispatch
   */
  function initSearchHandler() {
    const searchForm = document.getElementById('headerSearchForm');
    if (!searchForm) return;

    searchForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const input = document.getElementById('headerSearchInput');
      if (!input) return;
      const term = input.value.trim();
      if (!term) return;

      // CRITICAL SEO FEATURE: Dispatch async tracking before redirecting
      if (window.SearchAPI && typeof window.SearchAPI.trackSearch === 'function') {
        try {
          await window.SearchAPI.trackSearch(term);
        } catch (err) {
          console.warn('Search tracking failed:', err);
        }
      }

      window.location.href = `products.html?keyword=${encodeURIComponent(term)}`;
    });
  }

  /**
   * Toast notification helper in Vietnamese
   */
  window.showToast = function (message, type = 'success') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      toast.className = 'global-toast';
      document.body.appendChild(toast);
    }

    toast.className = `global-toast toast-${type}`;
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        ${type === 'error'
          ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
          : '<polyline points="20 6 9 17 4 12"></polyline>'}
      </svg>
      <span>${escapeHtml(message)}</span>
    `;

    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3500);
  };

  /**
   * Format VND Currency Helper
   */
  window.formatVND = function (amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(amount)
      .replace('₫', '')
      .trim() + ' ₫';
  };

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderAuth();
    syncCartBadge();
    initSearchHandler();
  });

  window.syncCartBadge = syncCartBadge;
})();
