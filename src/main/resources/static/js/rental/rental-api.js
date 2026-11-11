/**
 * Smash Badminton System (VNB Retail Theme) - Rental API Service
 * Centralizes all HTTP communication with backend RentalController.
 * Endpoints:
 *   POST /api/rentals (Create rental contract)
 *   GET  /api/rentals (Get current user's rental history)
 *   GET  /api/rentals/{id} (Get rental contract by ID)
 */

const RentalAPI = (function () {
  'use strict';

  const TOKEN_KEY = 'brm_auth_token';
  const BASE_URL = '/api/rentals';

  /**
   * Helper to build authentication and JSON headers
   * @returns {Object}
   */
  function getHeaders() {
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
   * Create a new rental contract
   * @param {Object} payload
   * @param {Array<{productId: number, quantity: number}>} payload.items
   * @param {string} payload.expectedReturnDate - ISO LocalDateTime string (e.g. 2026-11-15T23:59:59)
   * @param {string} payload.depositType - "Tiền mặt" or "Căn cước công dân"
   * @param {string} [payload.note]
   * @returns {Promise<Object>} Created RentalContractResponse
   */
  async function createRental(payload) {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const json = await response.json();
    if (!response.ok) {
      const errorMsg = (json && json.message) ? json.message : `HTTP ${response.status}: Failed to create rental`;
      throw new Error(errorMsg);
    }

    return (json && json.data) ? json.data : json;
  }

  /**
   * Retrieve rental contracts for the current authenticated user
   * @returns {Promise<Array<Object>>} List of RentalContractResponse
   */
  async function getMyRentals() {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn('Unauthorized or session expired when fetching user rentals.');
        return [];
      }
      throw new Error(`HTTP ${response.status}: Failed to fetch rental contracts`);
    }

    const json = await response.json();
    const list = (json && Array.isArray(json.data)) ? json.data : (Array.isArray(json) ? json : []);
    return list;
  }

  /**
   * Retrieve rental contract details by contract ID
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async function getRentalById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const json = await response.json();
    if (!response.ok) {
      const errorMsg = (json && json.message) ? json.message : `HTTP ${response.status}: Failed to fetch rental contract #${id}`;
      throw new Error(errorMsg);
    }

    return (json && json.data) ? json.data : json;
  }

  return {
    createRental,
    getMyRentals,
    getRentalById
  };
})();

window.RentalAPI = RentalAPI;
