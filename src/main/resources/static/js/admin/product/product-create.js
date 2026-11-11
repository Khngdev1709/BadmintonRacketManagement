/**
 * Smash Badminton System - Dedicated Product Creation Logic (admin-product-create.html)
 * Strictly executes the Crucial Step: uploads file to FileController first, then creates product via ProductController.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    await populateCategoryDropdown();
    initFileUploadPreview();
    initProductCreateForm();
  });

  /**
   * Populate category select options from Category API
   */
  async function populateCategoryDropdown() {
    const select = document.getElementById('createProdCategory');
    if (!select) return;

    try {
      const categories = await window.ProductAPI.getCategories();
      select.innerHTML = categories.map(cat => `
        <option value="${cat.id}">${escapeHtml(cat.name)}</option>
      `).join('');
    } catch (err) {
      console.warn('Failed to fetch categories, using default:', err);
      select.innerHTML = '<option value="1">Vợt Công Thủ Toàn Diện</option>';
    }
  }

  /**
   * Preview image when selected from disk
   */
  function initFileUploadPreview() {
    const fileInput = document.getElementById('createFileInput');
    const previewCluster = document.getElementById('createImagePreviewCluster');
    if (!fileInput || !previewCluster) return;

    fileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        const localPreview = URL.createObjectURL(file);
        previewCluster.innerHTML = `
          <div class="image-preview-card" style="width: 120px; height: 120px;">
            <img src="${localPreview}" alt="Ảnh xem trước">
            <span class="preview-badge-status" style="background-color: #2563EB;">SẴN SÀNG</span>
          </div>
        `;
      }
    });
  }

  /**
   * Product Form Submit Handler
   * CRUCIAL STEP: First calls File Upload API, then uses returned URL in ProductRequest
   */
  function initProductCreateForm() {
    const form = document.getElementById('createProductFullForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = document.getElementById('btnSubmitCreateProduct');
      const fileInput = document.getElementById('createFileInput');

      const name = document.getElementById('createProdName').value.trim();
      const brandName = document.getElementById('createProdBrand').value.trim();
      const categoryId = parseInt(document.getElementById('createProdCategory').value, 10);
      const sellPrice = parseFloat(document.getElementById('createProdSellPrice').value) || 0;
      const rentalPricePerDay = parseFloat(document.getElementById('createProdRentPrice').value) || 0;
      const condition = document.getElementById('createProdCondition').value;
      const stockQuantity = parseInt(document.getElementById('createProdStock').value, 10) || 0;
      const description = document.getElementById('createProdDesc').value.trim();

      if (!name) {
        showToast('Vui lòng nhập tên vợt cầu lông.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-animation"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        <span>ĐANG TẢI ẢNH & LƯU VỢT...</span>
      `;

      let finalImageUrl = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop';

      try {
        // Step 1: Execute file upload to FileController
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          showToast('Đang tải hình ảnh lên FileController...', 'info');
          const uploadedUri = await window.ProductAPI.uploadImageFile(fileInput.files[0]);
          if (uploadedUri) {
            finalImageUrl = uploadedUri;
          }
        }

        // Step 2: Attach URL to ProductRequest payload
        const productPayload = {
          name: name,
          brandName: brandName,
          categoryId: categoryId,
          description: description,
          sellPrice: sellPrice,
          rentalPricePerDay: rentalPricePerDay,
          condition: condition,
          stockQuantity: stockQuantity,
          thumbnailImage: finalImageUrl,
          status: 'Active',
          imageUrls: [finalImageUrl]
        };

        // Step 3: Call POST /api/products
        await window.ProductAPI.createProduct(productPayload);

        showToast(`Sản phẩm "${name}" đã được tạo thành công! Đang chuyển hướng...`, 'success');

        setTimeout(() => {
          window.location.href = 'admin-products.html';
        }, 1200);
      } catch (err) {
        showToast(err.message || 'Đăng ký sản phẩm không thành công.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>TẠO & XUẤT BẢN SẢN PHẨM</span>`;
      }
    });
  }

  function showToast(message, type = 'success') {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      toast.className = 'sharp-toast';
      document.body.appendChild(toast);
    }

    toast.className = `sharp-toast toast-${type}`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
