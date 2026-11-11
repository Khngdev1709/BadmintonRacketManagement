/**
 * Smash Badminton (VNB Sports Theme) - Dashboard API Service
 * Centralizes retrieval of user profile, orders, and rental contracts from backend REST APIs.
 * Connects directly to backend database. No hardcoded mock data.
 */

const DashboardAPI = (function () {
  'use strict';

  const TOKEN_KEY = 'brm_auth_token';
  const USER_KEY = 'brm_auth_user';
  const ORDERS_API_URL = '/api/orders/my-orders';
  const RENTALS_API_URL = '/api/rentals/my-rentals';

  function getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Get user profile from active session in localStorage
   */
  async function getProfile() {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to parse user session:', e);
      }
    }
    return null;
  }

  /**
   * Update user preferences in localStorage session
   */
  async function updateProfile(updatedData) {
    const current = (await getProfile()) || {};
    const merged = { ...current, ...updatedData };
    localStorage.setItem(USER_KEY, JSON.stringify(merged));
    return merged;
  }

  /**
   * Fetch authenticated user's orders from backend GET /api/orders/my-orders
   * @returns {Promise<Array>}
   */
  async function getOrders() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return [];
    }

    try {
      const response = await fetch(ORDERS_API_URL, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('User session expired or unauthorized when fetching orders.');
          return [];
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch orders`);
      }

      const json = await response.json();
      const list = json && Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      return list;
    } catch (err) {
      console.warn('getOrders failed:', err.message);
      return [];
    }
  }

  /**
   * Fetch authenticated user's rentals from backend GET /api/rentals/my-rentals
   * @returns {Promise<Array>}
   */
  async function getRentals() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return [];
    }

    try {
      const response = await fetch(RENTALS_API_URL, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('User session expired or unauthorized when fetching rentals.');
          return [];
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch rentals`);
      }

      const json = await response.json();
      const list = json && Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      return list;
    } catch (err) {
      console.warn('getRentals failed:', err.message);
      return [];
    }
  }

  return {
    getProfile,
    updateProfile,
    getOrders,
    getRentals
  };
})();

window.DashboardAPI = DashboardAPI;
