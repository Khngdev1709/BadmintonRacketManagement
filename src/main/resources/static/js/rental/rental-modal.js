/**
 * Smash Badminton System (VNB Retail Theme) - Rental Booking Modal Logic
 * Handles modal open/close, dynamic rental fee calculations, and contract creation.
 */

(function () {
  'use strict';

  let currentProduct = null;
  let currentQuantity = 1;

  document.addEventListener('DOMContentLoaded', function () {
    initModalEvents();
  });

  /**
   * Bind event listeners for modal close and input changes
   */
  function initModalEvents() {
    const backdrop = document.getElementById('rentalModalBackdrop');
    const closeBtn = document.getElementById('btnRentalModalClose');
    const cancelBtn = document.getElementById('btnRentalCancel');
    const form = document.getElementById('rentalBookingForm');
    const returnDateInput = document.getElementById('rentalExpectedDate');

    if (!backdrop) return;

    // Close on backdrop click (outside card)
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }

    // Dynamic fee calculation on return date change
    if (returnDateInput) {
      returnDateInput.addEventListener('change', calculateRentalFee);
      returnDateInput.addEventListener('input', calculateRentalFee);
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', handleRentalSubmit);
    }

    // Escape key closes modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && backdrop.classList.contains('active')) {
        closeModal();
      }
    });
  }

  /**
   * Opens the rental booking modal with the specified product and quantity
   * @param {Object} product
   * @param {number} quantity
   */
  function openModal(product, quantity = 1) {
    if (!product) return;

    currentProduct = product;
    currentQuantity = quantity || 1;

    const backdrop = document.getElementById('rentalModalBackdrop');
    if (!backdrop) return;

    // 1. Populate product preview
    const previewName = document.getElementById('rentalPreviewName');
    const previewBrand = document.getElementById('rentalPreviewBrand');
    const previewRate = document.getElementById('rentalPreviewRate');
    const previewImg = document.getElementById('rentalPreviewImg');

    if (previewName) previewName.textContent = product.name || 'Vợt Cầu Lông';
    if (previewBrand) previewBrand.textContent = product.brandName || 'Chính hãng';
    if (previewRate) {
      const dailyRate = Number(product.rentalPricePerDay) || 0;
      previewRate.textContent = formatCurrency(dailyRate);
    }

    if (previewImg) {
      let imgPath = product.thumbnailImage || 'image/Yonex Astrox 100ZZ.jpg';
      if (!imgPath.startsWith('http://') && !imgPath.startsWith('https://')) {
        let clean = imgPath.startsWith('/') ? imgPath.substring(1) : imgPath;
        if (clean.startsWith('images/')) {
          clean = 'image/' + clean.substring('images/'.length);
        } else if (!clean.startsWith('image/')) {
          clean = 'image/' + clean;
        }
        imgPath = clean;
      }
      previewImg.src = imgPath;
      previewImg.onerror = function () {
        this.onerror = null;
        this.src = 'image/Yonex Astrox 100ZZ.jpg';
      };
    }

    // 2. Setup date picker limits and default (3 days from today)
    const returnDateInput = document.getElementById('rentalExpectedDate');
    if (returnDateInput) {
      const now = new Date();
      const todayStr = formatDateToInput(now);
      returnDateInput.min = todayStr;

      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      returnDateInput.value = formatDateToInput(defaultDate);
    }

    // 3. Reset form fields
    const depositSelect = document.getElementById('rentalDepositType');
    if (depositSelect) {
      depositSelect.value = 'Tiền mặt';
    }

    const noteInput = document.getElementById('rentalNote');
    if (noteInput) {
      noteInput.value = '';
    }

    // 4. Calculate dynamic total
    calculateRentalFee();

    // 5. Show modal
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Closes the rental modal
   */
  function closeModal() {
    const backdrop = document.getElementById('rentalModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
    }
    document.body.style.overflow = '';
  }

  /**
   * Calculates rental days and dynamic total fee based on selected return date
   */
  function calculateRentalFee() {
    const returnDateInput = document.getElementById('rentalExpectedDate');
    const calcDaysEl = document.getElementById('rentalCalcDays');
    const calcRateEl = document.getElementById('rentalCalcRate');
    const calcQtyEl = document.getElementById('rentalCalcQty');
    const calcTotalEl = document.getElementById('rentalCalcTotal');

    if (!returnDateInput || !currentProduct) return;

    const returnDateStr = returnDateInput.value;
    let rentalDays = 1;

    if (returnDateStr) {
      const selected = new Date(returnDateStr + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = selected.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      rentalDays = diffDays > 0 ? diffDays : 1;
    }

    const dailyRate = Number(currentProduct.rentalPricePerDay) || 0;
    const quantity = currentQuantity || 1;
    const totalFee = dailyRate * quantity * rentalDays;

    if (calcDaysEl) calcDaysEl.textContent = `${rentalDays} ngày`;
    if (calcRateEl) calcRateEl.textContent = `${formatCurrency(dailyRate)}/ngày`;
    if (calcQtyEl) calcQtyEl.textContent = `${quantity} cây`;
    if (calcTotalEl) calcTotalEl.textContent = formatCurrency(totalFee);
  }

  /**
   * Handles Rental Contract creation submission
   * @param {Event} e
   */
  async function handleRentalSubmit(e) {
    e.preventDefault();

    // 1. Authentication Check
    const token = localStorage.getItem('brm_auth_token');
    if (!token) {
      alert('Quý khách vui lòng đăng nhập tài khoản thành viên để thực hiện thuê vợt.');
      const redirectUrl = window.location.pathname + window.location.search;
      window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
      return;
    }

    if (!currentProduct || !currentProduct.id) {
      alert('Không tìm thấy thông tin sản phẩm cần thuê.');
      return;
    }

    const returnDateInput = document.getElementById('rentalExpectedDate');
    const depositSelect = document.getElementById('rentalDepositType');
    const noteInput = document.getElementById('rentalNote');
    const submitBtn = document.getElementById('btnRentalSubmit');

    const returnDateVal = returnDateInput ? returnDateInput.value : '';
    if (!returnDateVal) {
      alert('Vui lòng chọn ngày dự kiến trả vợt.');
      return;
    }

    const depositType = depositSelect ? depositSelect.value : 'Tiền mặt';
    const note = noteInput ? noteInput.value.trim() : '';

    // Backend expects ISO LocalDateTime: e.g. 2026-11-15T23:59:59
    const expectedReturnDate = `${returnDateVal}T23:59:59`;

    const payload = {
      items: [
        {
          productId: currentProduct.id,
          quantity: currentQuantity || 1
        }
      ],
      expectedReturnDate: expectedReturnDate,
      depositType: depositType,
      note: note || null
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'ĐANG XỬ LÝ HỢP ĐỒNG...';
    }

    try {
      const contract = await window.RentalAPI.createRental(payload);

      if (window.showToast) {
        window.showToast(`Đặt thuê vợt thành công! Hợp đồng #HDT-${contract.id || ''} đã được tạo.`, 'success');
      } else {
        alert(`Đặt thuê vợt thành công! Hợp đồng #HDT-${contract.id || ''} đã được tạo.`);
      }

      closeModal();

      setTimeout(() => {
        window.location.href = 'dashboard.html#rentals';
      }, 700);

    } catch (err) {
      console.error('Failed to create rental contract:', err);
      alert(err.message || 'Không thể tạo hợp đồng thuê vợt. Vui lòng thử lại.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'XÁC NHẬN THUÊ';
      }
    }
  }

  function formatDateToInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatCurrency(amount) {
    if (window.formatVND) {
      return window.formatVND(amount);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(amount || 0)
      .replace('₫', '')
      .trim() + ' ₫';
  }

  // Expose API to window
  window.RentalModal = {
    open: openModal,
    close: closeModal
  };

})();
