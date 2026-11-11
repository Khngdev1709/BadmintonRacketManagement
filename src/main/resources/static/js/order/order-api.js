/**
 * Smash Badminton System - Order API Service
 * Centralizes order creation, order history retrieval, and status updates.
 */

const OrderAPI = (function () {
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
   * Create a new sales order
   * @param {Object} orderData - { items: [{ productId, quantity }], paymentMethod, shippingAddress }
   * @returns {Promise<Object>}
   */
  async function createOrder(orderData) {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = json && json.message ? json.message : `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    return json;
  }

  /**
   * Retrieve current user's order history
   * @returns {Promise<Array>}
   */
  async function getMyOrders() {
    const response = await fetch(`${BASE_URL}/my-orders`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = json && json.message ? json.message : `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    return json && json.data ? json.data : [];
  }

  /**
   * Retrieve all orders for administrative management
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
      console.warn('Failed to fetch from /api/orders/all, trying fallback /api/orders:', err);
    }

    // Fallback to /api/orders
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
   * Update order status (Admin operation)
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
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus
  };
})();

window.OrderAPI = OrderAPI;
