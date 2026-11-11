/**
 * Smash Badminton System - Auth Form Logic
 * Manages form interactions, field validation, password toggling, and feedback alerts.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initPasswordToggles();
    initLoginForm();
    initRegisterForm();
    initDemoCredentials();
    initForgotPasswordModal();
  });

  /**
   * Password visibility toggle button handler
   */
  function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle-btn');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';

        // Toggle icon visual
        this.innerHTML = isPassword
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="2" x2="23" y2="23"></line></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="7" r="3"></circle></svg>`;
      });
    });
  }

  /**
   * Login Form Controller
   */
  function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const alertBox = document.getElementById('authAlert');
    const submitBtn = document.getElementById('btnLoginSubmit');

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const usernameOrEmail = document.getElementById('loginIdentifier').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!usernameOrEmail || !password) {
        showAlert(alertBox, 'Vui lòng nhập đầy đủ tên đăng nhập/email và mật khẩu.', 'error');
        return;
      }

      setLoading(submitBtn, true, 'ĐANG XÁC THỰC...');
      hideAlert(alertBox);

      try {
        const response = await window.AuthAPI.login({ usernameOrEmail, password });
        showAlert(alertBox, 'Đăng nhập thành công! Đang chuyển hướng...', 'success');

        if (window.showToast) {
          window.showToast(`Chào mừng trở lại, ${response.user?.fullName || usernameOrEmail}!`);
        }

        setTimeout(() => {
          const redirectParam = new URLSearchParams(window.location.search).get('redirect');
          const user = response.user || {};
          const roleUpper = (user.role || '').toUpperCase();
          const isAdmin = roleUpper === 'ROLE_ADMIN' || roleUpper === 'ADMIN';

          if (isAdmin) {
            // Admin user is redirected to admin management panel
            const target = (redirectParam && redirectParam.includes('admin'))
              ? redirectParam
              : 'templates/admin/admin-products.html';
            window.location.href = target;
          } else {
            // Customer user is redirected to storefront
            const target = (redirectParam && !redirectParam.includes('admin'))
              ? redirectParam
              : 'index.html';
            window.location.href = target;
          }
        }, 800);
      } catch (err) {
        showAlert(alertBox, err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.', 'error');
        setLoading(submitBtn, false, 'ĐĂNG NHẬP VÀO HỆ THỐNG');
      }
    });
  }

  /**
   * Registration Form Controller
   */
  function initRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    const alertBox = document.getElementById('authAlert');
    const submitBtn = document.getElementById('btnRegisterSubmit');

    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const fullName = document.getElementById('regFullName').value.trim();
      const username = document.getElementById('regUsername').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const phoneNumber = document.getElementById('regPhone').value.trim();
      const address = document.getElementById('regAddress').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regConfirmPassword').value;
      const agreeTerms = document.getElementById('regAgreeTerms').checked;

      if (!agreeTerms) {
        showAlert(alertBox, 'Quý khách vui lòng đồng ý với Điều khoản Dịch vụ và Chính sách Thuê vợt.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showAlert(alertBox, 'Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.', 'error');
        return;
      }

      if (password.length < 6) {
        showAlert(alertBox, 'Mật khẩu phải có ít nhất 6 ký tự.', 'error');
        return;
      }

      setLoading(submitBtn, true, 'ĐANG ĐĂNG KÝ TÀI KHOẢN...');
      hideAlert(alertBox);

      try {
        await window.AuthAPI.register({
          fullName,
          username,
          email,
          phoneNumber,
          address,
          password
        });

        showAlert(alertBox, 'Đăng ký tài khoản thành công! Đang chuyển hướng đến cửa hàng...', 'success');
        if (window.showToast) {
          window.showToast('Tài khoản đã tạo thành công! Đang tự động đăng nhập...');
        }

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } catch (err) {
        showAlert(alertBox, err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.', 'error');
        setLoading(submitBtn, false, 'ĐĂNG KÝ TÀI KHOẢN NGAY');
      }
    });
  }

  /**
   * Demo credential fillers for 1-click evaluation
   */
  function initDemoCredentials() {
    const demoCustomerBtn = document.getElementById('demoCustomerBtn');
    const demoAdminBtn = document.getElementById('demoAdminBtn');

    if (demoCustomerBtn) {
      demoCustomerBtn.addEventListener('click', function () {
        const idInput = document.getElementById('loginIdentifier');
        const pwInput = document.getElementById('loginPassword');
        if (idInput && pwInput) {
          idInput.value = 'customer';
          pwInput.value = 'Password123!';
          if (window.showToast) {
            window.showToast('Đã điền thông tin tài khoản Khách hàng thử nghiệm', 'info');
          }
        }
      });
    }

    if (demoAdminBtn) {
      demoAdminBtn.addEventListener('click', function () {
        const idInput = document.getElementById('loginIdentifier');
        const pwInput = document.getElementById('loginPassword');
        if (idInput && pwInput) {
          idInput.value = 'admin';
          pwInput.value = 'AdminPass123!';
          if (window.showToast) {
            window.showToast('Đã điền thông tin tài khoản Quản trị viên thử nghiệm', 'info');
          }
        }
      });
    }
  }

  /**
   * Forgot Password Interaction
   */
  function initForgotPasswordModal() {
    const forgotLink = document.getElementById('linkForgotPassword');
    if (!forgotLink) return;

    forgotLink.addEventListener('click', async function (e) {
      e.preventDefault();
      const email = prompt('Nhập địa chỉ email đăng ký của bạn để nhận hướng dẫn đặt lại mật khẩu:');
      if (email && email.includes('@')) {
        try {
          await window.AuthAPI.forgotPassword(email);
          alert(`Hướng dẫn đặt lại mật khẩu đã được gửi đến email ${email}.`);
        } catch {
          alert(`Đã yêu cầu mã khôi phục cho ${email}. Vui lòng kiểm tra hộp thư đến.`);
        }
      } else if (email) {
        alert('Vui lòng nhập một địa chỉ email hợp lệ.');
      }
    });
  }

  function showAlert(container, message, type) {
    if (!container) return;
    container.textContent = message;
    container.className = `auth-alert auth-alert-${type} visible`;
  }

  function hideAlert(container) {
    if (!container) return;
    container.className = 'auth-alert';
    container.textContent = '';
  }

  function setLoading(button, isLoading, text) {
    if (!button) return;
    button.disabled = isLoading;
    button.innerHTML = isLoading
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-animation"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> ${text}`
      : text;
  }
})();
