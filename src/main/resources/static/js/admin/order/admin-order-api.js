/**
 * Smash Badminton System - Admin Order API Service
 * Centralizes administrative order inspection and status patching.
 */

const AdminOrderAPI = (function () {
  'use strict';

  const BASE_URL = '/api/orders';
  const TOKEN_KEY = 'brm_auth_token';

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
   * Fetch all orders in system
   * @returns {Promise<Array>}
   */
  async function getAllOrders() {
    try {
      const response = await fetch(`${BASE_URL}/all`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const json = await response.json().catch(() => null);

      if (response.ok && json && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn('AdminOrderAPI: /api/orders/all request failed, attempting fallback to /api/orders', err);
    }

    const fallbackResponse = await fetch(BASE_URL, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const fallbackJson = await fallbackResponse.json().catch(() => null);
    if (fallbackResponse.ok && fallbackJson && fallbackJson.data) {
      return fallbackJson.data;
    }

    return [];
  }

  /**
   * Patch order status
   * @param {number|string} orderId
   * @param {string} status - Pending, Confirmed, Shipped, Delivered, Cancelled
   * @returns {Promise<Object>}
   */
  async function updateOrderStatus(orderId, status) {
    const response = await fetch(`${BASE_URL}/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = json && json.message ? json.message : `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    return json && json.data ? json.data : json;
  }

  return {
    getAllOrders,
    updateOrderStatus
  };
})();

window.AdminOrderAPI = AdminOrderAPI;
