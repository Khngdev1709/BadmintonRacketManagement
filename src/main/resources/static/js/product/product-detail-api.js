/**
 * Smash Badminton System - Product Detail API Service (Compatibility Bridge)
 * Exposes getProductById backed by centralized ProductAPI.
 */

window.ProductDetailAPI = window.ProductAPI || {
  async getProductById(id) {
    if (!id) throw new Error('Product ID is required');
    const response = await fetch(`/api/public/products/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch product details`);
    const json = await response.json();
    return json && json.data ? json.data : json;
  }
};
