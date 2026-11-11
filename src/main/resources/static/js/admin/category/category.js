/**
 * Smash Badminton System - Admin Category Management Logic
 * Handles table rendering, modal operations, category creation, editing, and deletion.
 */

(function () {
  'use strict';

  let categories = [];
  let currentEditId = null;

  document.addEventListener('DOMContentLoaded', function () {
    loadCategories();
    initModalEvents();
    initSearchFilter();
  });

  /**
   * Fetch and render categories in the data table
   */
  async function loadCategories() {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 32px; color: #64748B;">
          Đang tải dữ liệu danh mục...
        </td>
      </tr>
    `;

    try {
      categories = await window.CategoryAPI.getAllCategories();
      renderTable(categories);
    } catch (err) {
      showToast(err.message || 'Không thể tải danh mục sản phẩm', 'error');
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 32px; color: #DC2626;">
            Không thể tải danh mục. Vui lòng kiểm tra kết nối máy chủ.
          </td>
        </tr>
      `;
    }
  }

  /**
   * Render table rows
   */
  function renderTable(dataList) {
    const tbody = document.getElementById('categoryTableBody');
    const countEl = document.getElementById('categoryCount');
    if (!tbody) return;

    if (countEl) countEl.textContent = `(${dataList.length})`;

    if (dataList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 36px; color: #64748B;">
            Chưa có danh mục nào. Nhấn "Thêm danh mục mới" để tạo.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = dataList.map(cat => `
      <tr data-id="${cat.id}">
        <td><span class="table-id-badge">#CAT-${cat.id}</span></td>
        <td><strong>${escapeHtml(cat.name)}</strong></td>
        <td style="color: #64748B; max-width: 480px;">${escapeHtml(cat.seoDescription || '—')}</td>
        <td>
          <div class="table-action-btns">
            <button type="button" class="btn-table-edit" data-id="${cat.id}">
              Sửa
            </button>
            <button type="button" class="btn-table-delete" data-id="${cat.id}" data-name="${escapeHtml(cat.name)}">
              Xóa
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    bindActionButtons();
  }

  /**
   * Bind Edit & Delete buttons
   */
  function bindActionButtons() {
    document.querySelectorAll('.btn-table-edit').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = parseInt(this.getAttribute('data-id'), 10);
        openEditModal(id);
      });
    });

    document.querySelectorAll('.btn-table-delete').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = parseInt(this.getAttribute('data-id'), 10);
        const name = this.getAttribute('data-name');
        confirmDeleteCategory(id, name);
      });
    });
  }

  /**
   * Modal handlers
   */
  function initModalEvents() {
    const modalOverlay = document.getElementById('categoryModalOverlay');
    const btnOpenAdd = document.getElementById('btnOpenAddCategory');
    const btnCloseModal = document.getElementById('btnCloseCategoryModal');
    const btnCancelModal = document.getElementById('btnCancelCategoryModal');
    const form = document.getElementById('categoryForm');

    if (btnOpenAdd) {
      btnOpenAdd.addEventListener('click', openCreateModal);
    }

    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', closeModal);
    }

    if (btnCancelModal) {
      btnCancelModal.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) closeModal();
      });
    }

    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }
  }

  function openCreateModal() {
    currentEditId = null;
    document.getElementById('categoryModalTitle').textContent = 'THÊM DANH MỤC MỚI';
    document.getElementById('categoryNameInput').value = '';
    document.getElementById('categorySeoInput').value = '';
    document.getElementById('categoryModalOverlay').classList.add('active');
  }

  async function openEditModal(id) {
    currentEditId = id;
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('categoryModalTitle').textContent = `CHỈNH SỬA DANH MỤC #CAT-${id}`;
    document.getElementById('categoryNameInput').value = cat.name || '';
    document.getElementById('categorySeoInput').value = cat.seoDescription || '';
    document.getElementById('categoryModalOverlay').classList.add('active');
  }

  function closeModal() {
    const modal = document.getElementById('categoryModalOverlay');
    if (modal) modal.classList.remove('active');
    currentEditId = null;
  }

  /**
   * Handle create / edit form submit
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('categoryNameInput').value.trim();
    const seoDescription = document.getElementById('categorySeoInput').value.trim();
    const submitBtn = document.getElementById('btnSaveCategory');

    if (!name) {
      showToast('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'ĐANG LƯU...';

    const payload = { name, seoDescription };

    try {
      if (currentEditId) {
        await window.CategoryAPI.updateCategory(currentEditId, payload);
        showToast(`Cập nhật danh mục #${currentEditId} thành công!`, 'success');
      } else {
        await window.CategoryAPI.createCategory(payload);
        showToast('Tạo mới danh mục thành công!', 'success');
      }
      closeModal();
      await loadCategories();
    } catch (err) {
      showToast(err.message || 'Thao tác không thành công', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'LƯU DANH MỤC';
    }
  }

  /**
   * Handle category delete
   */
  async function confirmDeleteCategory(id, name) {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}" (ID: ${id})?\nHành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      await window.CategoryAPI.deleteCategory(id);
      showToast(`Đã xóa danh mục "${name}" thành công.`, 'success');
      await loadCategories();
    } catch (err) {
      showToast(err.message || 'Không thể xóa danh mục', 'error');
    }
  }

  /**
   * Real-time search filter
   */
  function initSearchFilter() {
    const input = document.getElementById('categorySearchInput');
    if (!input) return;

    input.addEventListener('input', function () {
      const term = this.value.trim().toLowerCase();
      const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.seoDescription && c.seoDescription.toLowerCase().includes(term))
      );
      renderTable(filtered);
    });
  }

  /**
   * Toast notifications
   */
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
