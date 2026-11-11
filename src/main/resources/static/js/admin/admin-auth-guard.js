/**
 * Smash Badminton System - Admin Route Authentication & Role Guard
 * Strictly verifies JWT session and ensures active user has ROLE_ADMIN.
 * Blocks customers and unauthenticated visitors with immediate redirection.
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'brm_auth_token';
  const USER_KEY = 'brm_auth_user';

  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);

  // 1. Unauthenticated Check
  if (!token || !userRaw) {
    alert('Khu vực dành riêng cho Quản Trị Viên. Vui lòng đăng nhập tài khoản Admin.');
    window.location.replace('../../login.html?redirect=templates/admin/admin-products.html');
    return;
  }

  // 2. Role Verification Check
  try {
    const user = JSON.parse(userRaw);
    const roleUpper = (user.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ROLE_ADMIN' || roleUpper === 'ADMIN';

    if (!isAdmin) {
      alert('Truy cập bị từ chối! Tài khoản của bạn không có quyền Quản trị viên (Admin). Hệ thống đang chuyển về trang mua sắm.');
      window.location.replace('../../index.html');
      return;
    }
  } catch (err) {
    console.error('Failed to parse admin session:', err);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.replace('../../login.html');
  }
})();
