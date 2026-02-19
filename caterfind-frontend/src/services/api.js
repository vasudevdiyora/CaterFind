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
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  },


  /**
   * Register new caterer.
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} businessName - Business Name
   * @returns {Promise} Login response with role
   */
  register: async (email, password, businessName) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, businessName })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
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

/**
 * Calling API
 */
export const callAPI = {
  /**
   * Initiate a voice call.
   * 
   * @param {string} to - Customer phone number
   * @param {string} message - Message to say (if applicable)
   * @returns {Promise} Response
   */
  makeCall: async (to, message) => {
    const response = await fetch(`${API_BASE_URL}/api/make-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Call failed');
    }
    return response.text();
  }
};

/**
 * Profile API (Caterer Profiles)
 */
export const profileAPI = {
  get: async (catererId) => {
    const response = await fetch(`${API_BASE_URL}/api/profile?catererId=${catererId}`);
    if (!response.ok) return null;
    return response.json();
  },
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/profile/all`);
    return response.json();
  },
  update: async (catererId, data) => {
    const response = await fetch(`${API_BASE_URL}/api/profile?catererId=${catererId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

/**
 * Dish API
 */
export const dishAPI = {
  /**
   * Get all dishes for a caterer.
   * 
   * @param {number} userId - Caterer user ID
   * @returns {Promise} Array of dishes
   */
  getAll: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/dishes?userId=${userId}`);
    return response.json();
  },

  /**
   * Create a new dish.
   * 
   * @param {object} dishData - Dish data (name, category, imageUrl, description, type, labels, userId)
   * @returns {Promise} Created dish
   */
  create: async (dishData) => {
    const response = await fetch(`${API_BASE_URL}/dishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dishData)
    });
    return response.json();
  },

  /**
   * Update an existing dish.
   * 
   * @param {number} id - Dish ID
   * @param {object} dishData - Updated dish data
   * @returns {Promise} Updated dish
   */
  update: async (id, dishData) => {
    const response = await fetch(`${API_BASE_URL}/dishes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dishData)
    });
    return response.json();
  },

  /**
   * Delete a dish.
   * 
   * @param {number} id - Dish ID
   * @returns {Promise} Response
   */
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/dishes/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

/**
 * File Upload API
 */
export const fileAPI = {
  /**
   * Upload image/video file to server
   * 
   * @param {File} file - File object from input[type="file"]
   * @returns {Promise<{url: string}>} Object with URL of uploaded file
   */
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      body: formData // Don't set Content-Type header, browser will set it automatically with boundary
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }

    return response.json();
  },

  /**
   * Delete uploaded file
   * 
   * @param {string} fileUrl - URL of the file to delete (e.g., "/uploads/images/abc123.jpg")
   * @returns {Promise} Response
   */
  delete: async (fileUrl) => {
    const response = await fetch(`${API_BASE_URL}/api/files?url=${encodeURIComponent(fileUrl)}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  /**
   * Get full URL for displaying image
   * 
   * @param {string} relativePath - Relative path from backend (e.g., "/uploads/images/abc123.jpg")
   * @returns {string} Full URL (e.g., "http://localhost:8080/uploads/images/abc123.jpg")
   */
  getImageUrl: (relativePath) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath; // External URL
    return `${API_BASE_URL}${relativePath}`;
  }
};

