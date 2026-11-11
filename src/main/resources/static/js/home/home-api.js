/**
 * Smash Badminton (VNB Sports Theme) - Public Catalog API Service
 * Centralizes retrieval of products and categories from PublicProductController and CategoryController.
 * Connects directly to backend REST APIs.
 */

const HomeAPI = (function () {
  'use strict';

  const PRODUCTS_API_URL = '/api/public/products';
  const CATEGORIES_API_URL = '/api/categories';

  /**
   * Fetches public products with query filters from GET /api/public/products
   * @param {Object} params - { keyword, categoryId, minPrice, maxPrice, page, size, sortBy }
   */
  async function getPublicProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.minPrice !== null && params.minPrice !== undefined) query.append('minPrice', params.minPrice);
    if (params.maxPrice !== null && params.maxPrice !== undefined) query.append('maxPrice', params.maxPrice);
    if (params.page !== undefined && params.page !== null) query.append('page', params.page);
    if (params.size !== undefined && params.size !== null) query.append('size', params.size);
    if (params.sortBy) query.append('sortBy', params.sortBy);

    const response = await fetch(`${PRODUCTS_API_URL}?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch products`);
    }

    const json = await response.json();
    const data = json && json.data ? json.data : json;

    if (Array.isArray(data)) {
      return {
        content: data,
        totalElements: data.length,
        totalPages: 1
      };
    }

    return data || { content: [], totalElements: 0, totalPages: 1 };
  }

  /**
   * Fetches product details by ID from GET /api/public/products/{id}
   * @param {number|string} id
   */
  async function getProductById(id) {
    const response = await fetch(`${PRODUCTS_API_URL}/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch product details`);
    }
    const json = await response.json();
    return json && json.data ? json.data : json;
  }

  /**
   * Fetches categories from GET /api/categories
   */
  async function getCategories() {
    const response = await fetch(CATEGORIES_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch categories`);
    }
    const json = await response.json();
    return json && Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
  }

  return {
    getPublicProducts,
    getProductById,
    getCategories
  };
})();

window.HomeAPI = HomeAPI;
