/**
 * Smash Badminton System - Public Product API Service
 * Calls real backend endpoints for public catalog queries, categories, and product details.
 * No hardcoded fallback data.
 */

const ProductAPI = (function () {
  'use strict';

  const PUBLIC_PRODUCTS_URL = '/api/public/products';
  const CATEGORIES_URL = '/api/categories';

  /**
   * Fetch paginated public products with optional filters
   * @param {Object} params - { keyword, categoryId, minPrice, maxPrice, page, size, sortBy }
   * @returns {Promise<Object>} Page<ProductResponse>
   */
  async function getPublicProducts(params = {}) {
    const query = new URLSearchParams();

    if (params.keyword) query.append('keyword', params.keyword);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.minPrice !== undefined && params.minPrice !== null && params.minPrice !== '') {
      query.append('minPrice', params.minPrice);
    }
    if (params.maxPrice !== undefined && params.maxPrice !== null && params.maxPrice !== '') {
      query.append('maxPrice', params.maxPrice);
    }
    if (params.page !== undefined && params.page !== null) {
      query.append('page', params.page);
    }
    if (params.size !== undefined && params.size !== null) {
      query.append('size', params.size);
    }
    if (params.sortBy) {
      query.append('sortBy', params.sortBy);
    }

    const queryString = query.toString();
    const url = queryString ? `${PUBLIC_PRODUCTS_URL}?${queryString}` : PUBLIC_PRODUCTS_URL;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: Failed to fetch products from backend`);
    }

    const json = await response.json();
    return json && json.data ? json.data : json;
  }

  /**
   * Fetch single product details by ID
   * @param {number|string} id
   * @returns {Promise<Object>} ProductResponse
   */
  async function getProductById(id) {
    if (!id) throw new Error('Product ID is required');

    const response = await fetch(`${PUBLIC_PRODUCTS_URL}/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: Product #${id} not found`);
    }

    const json = await response.json();
    return json && json.data ? json.data : json;
  }

  /**
   * Fetch all categories for sidebar filter
   * @returns {Promise<Array>} List<CategoryResponse>
   */
  async function getCategories() {
    const response = await fetch(CATEGORIES_URL);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: Failed to fetch categories`);
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

window.ProductAPI = ProductAPI;
