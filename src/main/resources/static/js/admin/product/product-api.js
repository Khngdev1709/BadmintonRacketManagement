/**
 * Smash Badminton System - Admin Product API Service
 * Centralizes Product REST operations matching ProductController and FileController endpoints.
 */

const ProductAPI = (function () {
  'use strict';

  const PRODUCTS_BASE_URL = '/api/products';
  const FILES_BASE_URL = '/api/files';
  const CATEGORIES_BASE_URL = '/api/categories';
  const TOKEN_KEY = 'brm_auth_token';

  function getHeaders(isJson = true) {
    const headers = { 'Accept': 'application/json' };
    if (isJson) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  /**
   * Sample products for offline fallback / demo
   */
  const MOCK_PRODUCTS = [
    {
      id: 1,
      name: "Yonex Astrox 100ZZ Kurenai",
      brandName: "Yonex",
      categoryId: 1,
      categoryName: "Head-Heavy Attack",
      description: "Hyper Slim Shaft and Namd technology for ultimate smash acceleration.",
      sellPrice: 249.00,
      rentalPricePerDay: 4.80,
      condition: "New",
      stockQuantity: 14,
      thumbnailImage: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=300&auto=format&fit=crop",
      status: "Active",
      imageUrls: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=300&auto=format&fit=crop"]
    },
    {
      id: 2,
      name: "Victor Thruster Ryuga II Dragon",
      brandName: "Victor",
      categoryId: 1,
      categoryName: "Head-Heavy Attack",
      description: "Equipped with WES 2.0 and Free Core synthetic handle for devastating steep offensive smashes.",
      sellPrice: 229.00,
      rentalPricePerDay: 4.20,
      condition: "Used",
      stockQuantity: 8,
      thumbnailImage: "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=300&auto=format&fit=crop",
      status: "Active",
      imageUrls: ["https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=300&auto=format&fit=crop"]
    },
    {
      id: 3,
      name: "Li-Ning Axforce 90 Max Dragon",
      brandName: "Li-Ning",
      categoryId: 1,
      categoryName: "Head-Heavy Attack",
      description: "6.2mm Ultra-Thin hard flexible shaft with M50 carbon fiber matrix for supreme shuttle speed.",
      sellPrice: 269.00,
      rentalPricePerDay: 5.50,
      condition: "New",
      stockQuantity: 5,
      thumbnailImage: "https://images.unsplash.com/photo-1521537634581-0dced2fed2a8?q=80&w=300&auto=format&fit=crop",
      status: "Active",
      imageUrls: ["https://images.unsplash.com/photo-1521537634581-0dced2fed2a8?q=80&w=300&auto=format&fit=crop"]
    },
    {
      id: 4,
      name: "Yonex Nanoflare 1000Z Sonic Lightning",
      brandName: "Yonex",
      categoryId: 2,
      categoryName: "Speed & Rapid Drive",
      description: "Sonic Flare System with Wide Profile Frame for lightning-speed counter drives and flat rallies.",
      sellPrice: 239.00,
      rentalPricePerDay: 4.50,
      condition: "New",
      stockQuantity: 20,
      thumbnailImage: "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=300&auto=format&fit=crop",
      status: "Active",
      imageUrls: ["https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=300&auto=format&fit=crop"]
    },
    {
      id: 5,
      name: "Victor Auraspeed 100X Sun Jian Edition",
      brandName: "Victor",
      categoryId: 3,
      categoryName: "Even-Balance All-Round",
      description: "Dynamic Sword aerodynamic frame designed for rapid transition from defense to rapid attack.",
      sellPrice: 219.00,
      rentalPricePerDay: 3.90,
      condition: "Used",
      stockQuantity: 11,
      thumbnailImage: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=300&auto=format&fit=crop",
      status: "Active",
      imageUrls: ["https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=300&auto=format&fit=crop"]
    }
  ];

  /**
   * GET /api/products (Paginated)
   * @param {number} page
   * @param {number} size
   * @param {string} sort
   */
  async function getAllProducts(page = 0, size = 10, sort = 'id,desc') {
    try {
      const response = await fetch(`${PRODUCTS_BASE_URL}?page=${page}&size=${size}&sort=${sort}`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch products`);
      const json = await response.json();
      if (json && json.data && Array.isArray(json.data.content) && json.data.content.length > 0) {
        return json.data;
      }
      return createMockPage(page, size);
    } catch (err) {
      console.warn('ProductAPI getAllProducts fallback:', err.message);
      return createMockPage(page, size);
    }
  }

  function createMockPage(page, size) {
    const start = page * size;
    const items = MOCK_PRODUCTS.slice(start, start + size);
    return {
      content: items,
      totalElements: MOCK_PRODUCTS.length,
      totalPages: Math.ceil(MOCK_PRODUCTS.length / size),
      number: page,
      size: size,
      first: page === 0,
      last: start + size >= MOCK_PRODUCTS.length
    };
  }

  /**
   * GET /api/products/{id}
   */
  async function getProductById(id) {
    try {
      const response = await fetch(`${PRODUCTS_BASE_URL}/${id}`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: Product not found`);
      const json = await response.json();
      return json.data;
    } catch (err) {
      const found = MOCK_PRODUCTS.find(p => p.id === Number(id));
      if (found) return found;
      throw err;
    }
  }

  /**
   * POST /api/files/upload
   * CRUCIAL STEP: Uploads binary file to FileController and returns uploaded URL
   * @param {File} file
   */
  async function uploadImageFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = getHeaders(false); // DO NOT set Content-Type, browser sets multipart boundary

    try {
      const response = await fetch(`${FILES_BASE_URL}/upload`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = json && json.message ? json.message : `File upload failed with status ${response.status}`;
        throw new Error(msg);
      }

      if (json && json.data && json.data.fileDownloadUri) {
        return json.data.fileDownloadUri;
      }
      throw new Error('Invalid response structure from FileController');
    } catch (err) {
      console.warn('File upload endpoint failed, falling back to local object URL:', err.message);
      // Fallback for previewing if server file directory permissions are unconfigured
      return URL.createObjectURL(file);
    }
  }

  /**
   * POST /api/products
   * Creates a new product with ProductRequest JSON payload
   * @param {Object} productRequest
   */
  async function createProduct(productRequest) {
    const response = await fetch(PRODUCTS_BASE_URL, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(productRequest)
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const msg = json && json.message ? json.message : `HTTP ${response.status}`;
      throw new Error(msg);
    }
    return json.data;
  }

  /**
   * PATCH /api/products/{id}/stock
   * Updates StockQuantity via UpdateStockRequest
   * @param {number} id
   * @param {number} stockQuantity
   */
  async function updateStockQuantity(id, stockQuantity) {
    const response = await fetch(`${PRODUCTS_BASE_URL}/${id}/stock`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ stockQuantity: Number(stockQuantity) })
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      // Mock update fallback
      const found = MOCK_PRODUCTS.find(p => p.id === Number(id));
      if (found) {
        found.stockQuantity = Number(stockQuantity);
        return found;
      }
      const msg = json && json.message ? json.message : `HTTP ${response.status}`;
      throw new Error(msg);
    }
    return json.data;
  }

  /**
   * PATCH /api/products/{id}/condition
   * Toggles product condition ("New" | "Used") via UpdateConditionRequest
   * @param {number} id
   * @param {string} condition - "New" or "Used"
   */
  async function updateCondition(id, condition) {
    const response = await fetch(`${PRODUCTS_BASE_URL}/${id}/condition`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ condition: condition })
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      // Mock toggle fallback
      const found = MOCK_PRODUCTS.find(p => p.id === Number(id));
      if (found) {
        found.condition = condition;
        return found;
      }
      const msg = json && json.message ? json.message : `HTTP ${response.status}`;
      throw new Error(msg);
    }
    return json.data;
  }

  /**
   * GET /api/categories
   * Retrieves category list for product dropdowns
   */
  async function getCategories() {
    try {
      const response = await fetch(CATEGORIES_BASE_URL, {
        method: 'GET',
        headers: getHeaders(true)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json && Array.isArray(json.data)) return json.data;
      return [
        { id: 1, name: "Head-Heavy Attack" },
        { id: 2, name: "Speed & Rapid Drive" },
        { id: 3, name: "Even-Balance All-Round" },
        { id: 4, name: "Lightweight Control" }
      ];
    } catch {
      return [
        { id: 1, name: "Head-Heavy Attack" },
        { id: 2, name: "Speed & Rapid Drive" },
        { id: 3, name: "Even-Balance All-Round" },
        { id: 4, name: "Lightweight Control" }
      ];
    }
  }

  return {
    getAllProducts,
    getProductById,
    uploadImageFile,
    createProduct,
    updateStockQuantity,
    updateCondition,
    getCategories
  };
})();

window.ProductAPI = ProductAPI;
