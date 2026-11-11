/**
 * Smash Badminton System - Search & SEO Tracking API Service
 * Dispatches asynchronous search keyword tracking to /api/public/tracking/search
 */

const SearchAPI = (function () {
  'use strict';

  const TRACKING_URL = '/api/public/tracking/search';

  /**
   * Sends an asynchronous search tracking request to backend.
   * Uses AbortController with a short timeout to ensure UI redirection is never blocked.
   * @param {string} keyword
   * @returns {Promise<boolean>}
   */
  async function trackSearch(keyword) {
    if (!keyword || typeof keyword !== 'string') {
      return false;
    }

    const trimmed = keyword.trim();
    if (!trimmed) {
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    try {
      const response = await fetch(TRACKING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyword: trimmed }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (err) {
      clearTimeout(timeoutId);
      // Fail silently to never hinder customer search navigation
      console.warn('Search tracking request skipped or timed out:', err.message);
      return false;
    }
  }

  return {
    trackSearch
  };
})();

window.SearchAPI = SearchAPI;
