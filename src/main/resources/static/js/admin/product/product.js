/**
 * Smash Badminton System - Admin Product Management Logic
 * Handles paginated product listing, stock adjustments, condition toggling, and fast product addition.
 */

(function () {
  'use strict';

  let currentPage = 0;
  const pageSize = 8;
  let totalPages = 1;
  let currentProducts = [];

  document.addEventListener('DOMContentLoaded', async function () {
    await loadProducts(0);
    initPaginationButtons();
    initQuickAddModal();
    initImageUploadPreview();
  });

  function formatCurrency(val) {
    if (typeof window.formatVND === 'function') {
      return window.formatVND(val);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  }

  /**
   * Load paginated products list
   * @param {number} page
   */
  async function loadProducts(page = 0) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: #64748B;">
          Đang tải danh sách sản phẩm từ kho...
        </td>
      </tr>
    `;

    try {
      const pageData = await window.ProductAPI.getAllProducts(page, pageSize);
      currentProducts = pageData.content || [];
      currentPage = pageData.number !== undefined ? pageData.number : page;
      totalPages = pageData.totalPages || 1;

      renderTable(currentProducts);
      updatePaginationControls(pageData);
    } catch (err) {
      showToast(err.message || 'Không thể lấy dữ liệu sản phẩm', 'error');
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px; color: #DC2626;">
            Không thể lấy dữ liệu sản phẩm. Vui lòng kiểm tra kết nối máy chủ.
          </td>
        </tr>
      `;
    }
  }

  /**
   * Render table rows
   */
  function renderTable(products) {
    const tbody = document.getElementById('productTableBody');
    const totalCountEl = document.getElementById('productTotalCount');
    if (!tbody) return;

    if (totalCountEl) totalCountEl.textContent = `(${products.length})`;

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: #64748B;">
            Không có sản phẩm nào trong kho. Nhấn "Thêm sản phẩm" để tạo mới.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = products.map(prod => {
      const conditionUpper = (prod.condition || 'New').toUpperCase();
      const isNew = conditionUpper === 'NEW';
      const condClass = isNew ? 'cond-new' : 'cond-used';
      const condDisplay = isNew ? 'MỚI' : 'ĐÃ DÙNG';
      const toggleTarget = isNew ? 'Used' : 'New';

      const thumb = prod.thumbnailImage || 
        (prod.imageUrls && prod.imageUrls.length > 0 ? prod.imageUrls[0] : 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=300&auto=format&fit=crop');

      const sellPriceFormatted = formatCurrency(prod.sellPrice || 0);
      const rentPriceFormatted = formatCurrency(prod.rentalPricePerDay || 0);

      return `
        <tr data-id="${prod.id}">
          <td style="width: 80px;">
            <img src="${thumb}" alt="${escapeHtml(prod.name)}" class="product-thumb-cell">
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <strong>${escapeHtml(prod.name)}</strong>
              <span style="font-size: 0.75rem; color: #64748B;">${escapeHtml(prod.categoryName || 'Danh mục chung')}</span>
            </div>
          </td>
          <td>
            <span class="product-meta-brand">${escapeHtml(prod.brandName || 'CHÍNH HÃNG')}</span>
          </td>
          <td>
            <div class="stock-control-cell">
              <button type="button" class="btn-stock-adjust btn-stock-minus" data-id="${prod.id}" title="Giảm số lượng">-</button>
              <span class="stock-value-badge" id="stock-val-${prod.id}">${prod.stockQuantity}</span>
              <button type="button" class="btn-stock-adjust btn-stock-plus" data-id="${prod.id}" title="Tăng số lượng">+</button>
            </div>
          </td>
          <td>
            <button type="button" class="btn-condition-toggle ${condClass}" data-id="${prod.id}" data-target-cond="${toggleTarget}" title="Nhấp để chuyển đổi tình trạng">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg>
              <span>${condDisplay}</span>
            </button>
          </td>
          <td>
            <div style="display: flex; flex-direction: column;">
              <span class="price-display-sell">${sellPriceFormatted}</span>
              <span class="price-display-rent">${rentPriceFormatted} / ngày</span>
            </div>
          </td>
          <td>
            <div class="table-action-btns">
              <button type="button" class="btn-table-edit btn-edit-stock-custom" data-id="${prod.id}" data-current="${prod.stockQuantity}">
                Sửa tồn kho
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindTableActionEvents();
  }

  /**
   * Bind quick-action buttons: Stock decrease/increase and condition toggle
   */
  function bindTableActionEvents() {
    // Minus Stock
    document.querySelectorAll('.btn-stock-minus').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = parseInt(this.getAttribute('data-id'), 10);
        const prod = currentProducts.find(p => p.id === id);
        if (!prod || prod.stockQuantity <= 0) return;

        const newStock = prod.stockQuantity - 1;
        await updateProductStock(id, newStock);
      });
    });

    // Plus Stock
    document.querySelectorAll('.btn-stock-plus').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = parseInt(this.getAttribute('data-id'), 10);
        const prod = currentProducts.find(p => p.id === id);
        if (!prod) return;

        const newStock = prod.stockQuantity + 1;
        await updateProductStock(id, newStock);
      });
    });

    // Custom Stock prompt
    document.querySelectorAll('.btn-edit-stock-custom').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = parseInt(this.getAttribute('data-id'), 10);
        const current = this.getAttribute('data-current');
        const input = prompt(`Nhập số lượng tồn kho mới cho sản phẩm #${id}:`, current);
        if (input !== null) {
          const val = parseInt(input, 10);
          if (!isNaN(val) && val >= 0) {
            await updateProductStock(id, val);
          } else {
            showToast('Số lượng tồn kho phải là số nguyên không âm.', 'error');
          }
        }
      });
    });

    // Toggle Condition (New <-> Used)
    document.querySelectorAll('.btn-condition-toggle').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = parseInt(this.getAttribute('data-id'), 10);
        const nextCondition = this.getAttribute('data-target-cond');
        await toggleProductCondition(id, nextCondition);
      });
    });
  }

  /**
   * Stock update logic via PATCH /api/products/{id}/stock
   */
  async function updateProductStock(id, newStock) {
    try {
      const updated = await window.ProductAPI.updateStockQuantity(id, newStock);
      const prod = currentProducts.find(p => p.id === id);
      if (prod) prod.stockQuantity = updated.stockQuantity;

      const badge = document.getElementById(`stock-val-${id}`);
      if (badge) badge.textContent = updated.stockQuantity;

      showToast(`Đã cập nhật tồn kho sản phẩm #${id} thành ${updated.stockQuantity}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật số lượng tồn kho', 'error');
    }
  }

  /**
   * Condition toggle logic via PATCH /api/products/{id}/condition
   */
  async function toggleProductCondition(id, newCondition) {
    try {
      const updated = await window.ProductAPI.updateCondition(id, newCondition);
      const prod = currentProducts.find(p => p.id === id);
      if (prod) prod.condition = updated.condition;

      const condVi = (updated.condition || '').toUpperCase() === 'NEW' ? 'MỚI' : 'ĐÃ DÙNG';
      showToast(`Đã chuyển tình trạng sản phẩm #${id} thành "${condVi}".`, 'success');
      renderTable(currentProducts);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật tình trạng', 'error');
    }
  }

  /**
   * Pagination controls
   */
  function updatePaginationControls(pageData) {
    const metaEl = document.getElementById('paginationMeta');
    const prevBtn = document.getElementById('btnPagePrev');
    const nextBtn = document.getElementById('btnPageNext');

    const total = pageData.totalElements !== undefined ? pageData.totalElements : currentProducts.length;
    const pageNum = (pageData.number || 0) + 1;
    const totalP = pageData.totalPages || 1;

    if (metaEl) {
      metaEl.textContent = `Hiển thị trang ${pageNum} trên ${totalP} (${total} sản phẩm tổng cộng)`;
    }

    if (prevBtn) {
      prevBtn.disabled = pageData.first || currentPage === 0;
    }

    if (nextBtn) {
      nextBtn.disabled = pageData.last || currentPage >= totalPages - 1;
    }
  }

  function initPaginationButtons() {
    const prevBtn = document.getElementById('btnPagePrev');
    const nextBtn = document.getElementById('btnPageNext');

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (currentPage > 0) {
          loadProducts(currentPage - 1);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (currentPage < totalPages - 1) {
          loadProducts(currentPage + 1);
        }
      });
    }
  }

  /**
   * Fast Add Product Modal handler
   */
  async function initQuickAddModal() {
    const overlay = document.getElementById('productModalOverlay');
    const btnOpen = document.getElementById('btnOpenAddProduct');
    const btnClose = document.getElementById('btnCloseProductModal');
    const btnCancel = document.getElementById('btnCancelProductModal');
    const form = document.getElementById('quickProductForm');
    const categorySelect = document.getElementById('quickProdCategory');

    if (btnOpen) {
      btnOpen.addEventListener('click', async function () {
        if (categorySelect) {
          try {
            const categories = await window.ProductAPI.getCategories();
            categorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
          } catch {
            categorySelect.innerHTML = '<option value="1">Vợt Công Thủ Toàn Diện</option>';
          }
        }
        overlay.classList.add('active');
      });
    }

    if (btnClose) btnClose.addEventListener('click', () => overlay.classList.remove('active'));
    if (btnCancel) btnCancel.addEventListener('click', () => overlay.classList.remove('active'));

    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    }

    if (form) {
      form.addEventListener('submit', handleProductCreationSubmit);
    }
  }

  /**
   * Image file selection & preview in modal
   */
  function initImageUploadPreview() {
    const fileInput = document.getElementById('quickProductFileInput');
    const previewCluster = document.getElementById('quickImagePreviewCluster');
    if (!fileInput || !previewCluster) return;

    fileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        const previewUrl = URL.createObjectURL(file);
        previewCluster.innerHTML = `
          <div class="image-preview-card">
            <img src="${previewUrl}" alt="Ảnh tải lên">
            <span class="preview-badge-status">SẴN SÀNG</span>
          </div>
        `;
      }
    });
  }

  /**
   * CRUCIAL STEP IN PRODUCT CREATION:
   * First upload image file to FileController, then attach resulting URL to ProductRequest JSON.
   */
  async function handleProductCreationSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('btnSaveQuickProduct');
    const fileInput = document.getElementById('quickProductFileInput');
    const name = document.getElementById('quickProdName').value.trim();
    const brandName = document.getElementById('quickProdBrand').value.trim();
    const categoryId = parseInt(document.getElementById('quickProdCategory').value, 10);
    const sellPrice = parseFloat(document.getElementById('quickProdSellPrice').value) || 0;
    const rentalPricePerDay = parseFloat(document.getElementById('quickProdRentPrice').value) || 0;
    const condition = document.getElementById('quickProdCondition').value;
    const stockQuantity = parseInt(document.getElementById('quickProdStock').value, 10) || 0;
    const description = document.getElementById('quickProdDesc').value.trim();

    if (!name) {
      showToast('Vui lòng nhập tên vợt cầu lông.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'ĐANG TẢI ẢNH & LƯU SẢN PHẨM...';

    let finalImageUrl = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop';

    try {
      // 1. CRUCIAL STEP: Call File Upload API if a file was selected
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        showToast('Đang tải hình ảnh lên máy chủ...', 'info');
        const uploadedUri = await window.ProductAPI.uploadImageFile(fileInput.files[0]);
        if (uploadedUri) {
          finalImageUrl = uploadedUri;
        }
      }

      // 2. Attach URL to ProductRequest payload
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

      // 3. Call POST /api/products
      await window.ProductAPI.createProduct(productPayload);

      showToast(`Sản phẩm "${name}" đã được lưu thành công!`, 'success');
      document.getElementById('productModalOverlay').classList.remove('active');
      document.getElementById('quickProductForm').reset();
      document.getElementById('quickImagePreviewCluster').innerHTML = '';

      await loadProducts(0);
    } catch (err) {
      showToast(err.message || 'Tạo sản phẩm thất bại', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'LƯU SẢN PHẨM';
    }
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

  window.showAdminToast = showToast;
})();
