/**
 * Smash Badminton System - Auth API Service
 * Centralizes authentication API requests and token storage management.
 * Strictly connects to backend REST APIs. No mock fallbacks.
 */

const AuthAPI = (function () {
  'use strict';

  const BASE_URL = '/api/auth';
  const TOKEN_KEY = 'brm_auth_token';
  const USER_KEY = 'brm_auth_user';

  /**
   * Helper to perform fetch requests with JSON headers
   */
  async function request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data && data.message ? data.message : `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  }

  /**
   * Authenticate user with credentials
   * @param {Object} credentials - { usernameOrEmail, password }
   */
  async function login(credentials) {
    const result = await request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (result && result.data) {
      saveSession(result.data.token, result.data.user);
      return result.data;
    }
    return result;
  }

  /**
   * Register new user account
   * @param {Object} userData - { username, password, fullName, email, phoneNumber, address }
   */
  async function register(userData) {
    const result = await request('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (result && result.data) {
      saveSession(result.data.token, result.data.user);
      return result.data;
    }
    return result;
  }

  /**
   * Request password reset token
   * @param {string} email
   */
  async function forgotPassword(email) {
    return request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * End session and invalidate token
   */
  async function logout() {
    try {
      await request('/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearSession();
    }
  }

  /**
   * Persist session state into localStorage
   */
  function saveSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isAuthenticated() {
    return !!getToken();
  }

  return {
    login,
    register,
    forgotPassword,
    logout,
    saveSession,
    getToken,
    getCurrentUser,
    clearSession,
    isAuthenticated
  };
})();

// Attach to window object for global availability
window.AuthAPI = AuthAPI;
