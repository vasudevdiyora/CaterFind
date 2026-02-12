/**
 * API Service for communicating with the Spring Boot backend.
 * 
 * Base URL points to the backend server (default: http://localhost:8080).
 * All API calls use fetch() for HTTP requests.
 * 
 * This service handles:
 * - Authentication (login)
 * - Dashboard stats
 * - Contact management (CRUD)
 * - Inventory management (CRUD)
 * - Messaging (broadcast)
 * 
 * NOTE: No authentication tokens for simplicity (college project).
 * In production, use JWT tokens and include in headers.
 */

const API_BASE_URL = 'http://localhost:8080';

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Login user with email and password.
   * Returns role information for frontend routing.
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Login response with role
   */
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }
};

/**
 * Dashboard API
 */
export const dashboardAPI = {
  /**
   * Get dashboard summary statistics.
   * Returns counts for dashboard widgets.
   * 
   * @param {number} catererId - Caterer user ID
   * @returns {Promise} Dashboard summary
   */
  getSummary: async (catererId) => {
    const response = await fetch(`${API_BASE_URL}/dashboard/summary?catererId=${catererId}`);
    return response.json();
  }
};

/**
 * Contact API
 */
export const contactAPI = {
  /**
   * Get all contacts for a caterer.
   * 
   * @param {number} catererId - Caterer user ID
   * @returns {Promise} Array of contacts
   */
  getAll: async (catererId) => {
    const response = await fetch(`${API_BASE_URL}/contacts?catererId=${catererId}`);
    return response.json();
  },

  /**
   * Get a single contact by ID.
   * 
   * @param {number} id - Contact ID
   * @returns {Promise} Contact object
   */
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/contacts/${id}`);
    return response.json();
  },

  /**
   * Create a new contact.
   * 
   * @param {number} catererId - Caterer user ID
   * @param {object} contactData - Contact data
   * @returns {Promise} Created contact
   */
  create: async (catererId, contactData) => {
    const response = await fetch(`${API_BASE_URL}/contacts?catererId=${catererId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    });
    return response.json();
  },

  /**
   * Update an existing contact.
   * 
   * @param {number} id - Contact ID
   * @param {object} contactData - Updated contact data
   * @returns {Promise} Updated contact
   */
  update: async (id, contactData) => {
    const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    });
    return response.json();
  },

  /**
   * Delete a contact.
   * 
   * @param {number} id - Contact ID
   * @returns {Promise} Response
   */
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

/**
 * Inventory API
 */
export const inventoryAPI = {
  /**
   * Get all inventory items for a caterer.
   * 
   * @param {number} catererId - Caterer user ID
   * @returns {Promise} Array of inventory items
   */
  getAll: async (catererId) => {
    const response = await fetch(`${API_BASE_URL}/inventory?catererId=${catererId}`);
    return response.json();
  },

  /**
   * Get low-stock items for a caterer.
   * 
   * @param {number} catererId - Caterer user ID
   * @returns {Promise} Array of low-stock items
   */
  getLowStock: async (catererId) => {
    const response = await fetch(`${API_BASE_URL}/inventory/low-stock?catererId=${catererId}`);
    return response.json();
  },

  /**
   * Get a single inventory item by ID.
   * 
   * @param {number} id - Item ID
   * @returns {Promise} Inventory item
   */
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`);
    return response.json();
  },

  /**
   * Create a new inventory item.
   * 
   * @param {number} catererId - Caterer user ID
   * @param {object} itemData - Item data
   * @returns {Promise} Created item
   */
  create: async (catererId, itemData) => {
    const response = await fetch(`${API_BASE_URL}/inventory?catererId=${catererId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    return response.json();
  },

  /**
   * Update an existing inventory item.
   * 
   * @param {number} id - Item ID
   * @param {object} itemData - Updated item data
   * @returns {Promise} Updated item
   */
  update: async (id, itemData) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    return response.json();
  },

  /**
   * Delete an inventory item.
   * 
   * @param {number} id - Item ID
   * @returns {Promise} Response
   */
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

/**
 * Message API
 */
export const messageAPI = {
  /**
   * Send broadcast message to multiple contacts.
   * 
   * REMINDER: This is NOT a chat system.
   * This is for broadcast messaging only.
   * 
   * @param {number} catererId - Caterer user ID
   * @param {array} contactIds - Array of contact IDs
   * @param {string} messageText - Message content
   * @returns {Promise} Send response
   */
  send: async (catererId, contactIds, messageText) => {
    const response = await fetch(`${API_BASE_URL}/messages/send?catererId=${catererId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactIds, messageText })
    });
    return response.json();
  },

  /**
   * Get message history for a caterer.
   * Returns audit log of sent messages.
   * 
   * @param {number} catererId - Caterer user ID
   * @returns {Promise} Array of message logs
   */
  getLogs: async (catererId) => {
    const response = await fetch(`${API_BASE_URL}/messages/logs?catererId=${catererId}`);
    return response.json();
  },

  /**
   * Send reorder message to dealer.
   * 
   * @param {number} catererId - Caterer user ID
   * @param {object} reorderData - { dealerName, dealerPhone, dealerContactId, messageText }
   * @returns {Promise} Response
   */
  sendReorder: async (catererId, reorderData) => {
    const response = await fetch(`${API_BASE_URL}/messages/reorder?catererId=${catererId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reorderData)
    });
    return response.json();
  }
};
