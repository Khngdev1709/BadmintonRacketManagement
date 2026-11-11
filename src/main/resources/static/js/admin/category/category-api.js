/**
 * Smash Badminton System - Admin Category API Service
 * Centralizes Category REST operations matching CategoryController endpoints.
 */

const CategoryAPI = (function () {
  'use strict';

  const BASE_URL = '/api/categories';
  const TOKEN_KEY = 'brm_auth_token';

  function getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Sample categories for fallback / preview
   */
  const MOCK_CATEGORIES = [
    { id: 1, name: "Head-Heavy Attack", seoDescription: "Aggressive rackets engineered for steep attacking power and explosive smash velocity." },
    { id: 2, name: "Speed & Rapid Drive", seoDescription: "Ultra-aerodynamic frames tailored for lightning-fast doubles flat drives and counter-attacks." },
    { id: 3, name: "Even-Balance All-Round", seoDescription: "Harmonious balance of offensive punch and agile defensive court maneuverability." },
    { id: 4, name: "Lightweight Control", seoDescription: "Featherweight 5U/6U frames offering effortless wrist flicks and precise net spin drops." }
  ];

  /**
   * GET /api/categories
   * Retrieves all categories
   */
  async function getAllCategories() {
    try {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch categories`);
      const json = await response.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
      return [...MOCK_CATEGORIES];
    } catch (err) {
      console.warn('CategoryAPI getAllCategories fallback:', err.message);
      return [...MOCK_CATEGORIES];
    }
  }

  /**
   * GET /api/categories/{id}
   */
  async function getCategoryById(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: Category not found`);
      const json = await response.json();
      return json.data;
    } catch (err) {
      const found = MOCK_CATEGORIES.find(c => c.id === Number(id));
      if (found) return found;
      throw err;
    }
  }

  /**
   * POST /api/categories
   * Body: { name, seoDescription }
   */
  async function createCategory(data) {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const msg = json && json.message ? json.message : `HTTP ${response.status}`;
      throw new Error(msg);
    }
    return json.data;
  }

  /**
   * PUT /api/categories/{id}
   * Body: { name, seoDescription }
   */
  async function updateCategory(id, data) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const msg = json && json.message ? json.message : `HTTP ${response.status}`;
      throw new Error(msg);
    }
    return json.data;
  }

  /**
   * DELETE /api/categories/{id}
   */
  async function deleteCategory(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const msg = json && json.message ? json.message : `HTTP ${response.status}`;
      throw new Error(msg);
    }
    return json;
  }

  return {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
  };
})();

window.CategoryAPI = CategoryAPI;
