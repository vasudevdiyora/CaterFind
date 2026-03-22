/**
 * API Service for communicating with the Spring Boot backend.
 * 
 * Base URL points to the backend server (default: http://localhost:8080).
 * All API calls use authFetch() for HTTP requests.
 * 
 * This service handles:
 * - Authentication (login)
 * - Dashboard stats
 * - Contact management (CRUD)
 * - Inventory management (CRUD)
 * - Messaging (broadcast)
 * 
 * Uses JWT auth token stored in localStorage.
 */

const normalizeBaseUrl = (value, fallback) => {
  const raw = (value || fallback || '').trim();
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8080');
export const WS_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_WS_BASE_URL, API_BASE_URL);
export const WS_ENDPOINT = `${WS_BASE_URL}/ws/chat`;
const AUTH_SESSION_KEY = 'caterfind_auth_session';
export const AUTH_EXPIRED_EVENT = 'caterfind:auth-expired';

const readStoredSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getAuthToken = () => {
  const session = readStoredSession();
  return session?.token || null;
};

const authFetch = async (url, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await window.fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem(AUTH_SESSION_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { url } }));
    }
  }

  return response;
};

export const authSession = {
  storageKey: AUTH_SESSION_KEY,
  get: () => readStoredSession(),
  save: (session) => localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session)),
  clear: () => localStorage.removeItem(AUTH_SESSION_KEY)
};

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
    const response = await authFetch(`${API_BASE_URL}/auth/login`, {
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
   * Register new user (caterer or client).
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} businessName - Business Name (required for CATERER, empty for CLIENT)
   * @param {string} role - User role (CATERER or CLIENT)
   * @returns {Promise} Login response with role
   */
  // Accept a payload object so frontend can send role-specific fields
  register: async (payload) => {
    const response = await authFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  requestForgotPasswordOtp: async (email) => {
    const response = await authFetch(`${API_BASE_URL}/auth/forgot-password/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }
    return data;
  },

  verifyForgotPasswordOtp: async (email, otp) => {
    const response = await authFetch(`${API_BASE_URL}/auth/forgot-password/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Invalid OTP');
    }
    return data;
  },

  resetPasswordWithOtp: async (email, otp, newPassword) => {
    const response = await authFetch(`${API_BASE_URL}/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }
    return data;
  },

  /**
   * Get the current logged-in user's profile (name, phone, location).
   * @returns {Promise} User profile data
   */
  getProfile: async () => {
    const response = await authFetch(`${API_BASE_URL}/auth/profile`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load profile');
    return data;
  },

  /**
   * Update the current user's profile fields.
   * @param {{ name?: string, phone?: string, location?: string }} payload
   * @returns {Promise} Updated user data
   */
  updateProfile: async (payload) => {
    const response = await authFetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  /**
   * Request an OTP to be sent to the new email address for verification.
   * @param {string} newEmail - The new email the user wants to switch to
   */
  requestEmailChangeOtp: async (newEmail) => {
    const response = await authFetch(`${API_BASE_URL}/auth/email-change/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  },

  /**
   * Verify the OTP and apply the email change.
   * @param {string} newEmail - The new email address
   * @param {string} otp - The 6-digit OTP entered by the user
   */
  verifyEmailChangeOtp: async (newEmail, otp) => {
    const response = await authFetch(`${API_BASE_URL}/auth/email-change/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail, otp })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Invalid OTP');
    return data;
  }

};

/**
 * Location helper API
 * - lookupPincode: returns { success, state, district, postOffices[] }
 */
export const locationAPI = {
  lookupPincode: async (pincode) => {
    const response = await authFetch(`${API_BASE_URL}/utils/pincode/${pincode}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Pincode lookup failed');
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
    const response = await authFetch(`${API_BASE_URL}/dashboard/summary?catererId=${catererId}`);
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
    const response = await authFetch(`${API_BASE_URL}/contacts?catererId=${catererId}`);
    return response.json();
  },

  /**
   * Get a single contact by ID.
   * 
   * @param {number} id - Contact ID
   * @returns {Promise} Contact object
   */
  getById: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/contacts/${id}`);
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
    const response = await authFetch(`${API_BASE_URL}/contacts?catererId=${catererId}`, {
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
    const response = await authFetch(`${API_BASE_URL}/contacts/${id}`, {
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
    const response = await authFetch(`${API_BASE_URL}/contacts/${id}`, {
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
    const response = await authFetch(`${API_BASE_URL}/inventory?catererId=${catererId}`);
    return response.json();
  },

  /**
   * Get low-stock items for a caterer.
   * 
   * @param {number} catererId - Caterer user ID
   * @returns {Promise} Array of low-stock items
   */
  getLowStock: async (catererId) => {
    const response = await authFetch(`${API_BASE_URL}/inventory/low-stock?catererId=${catererId}`);
    return response.json();
  },

  /**
   * Get a single inventory item by ID.
   * 
   * @param {number} id - Item ID
   * @returns {Promise} Inventory item
   */
  getById: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/inventory/${id}`);
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
    const response = await authFetch(`${API_BASE_URL}/inventory?catererId=${catererId}`, {
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
    const response = await authFetch(`${API_BASE_URL}/inventory/${id}`, {
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
    const response = await authFetch(`${API_BASE_URL}/inventory/${id}`, {
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
   * Message will be translated to each recipient's preferred language.
   * 
   * @param {number} catererId - Caterer user ID
   * @param {array} contactIds - Array of contact IDs
   * @param {string} messageText - Message content
   * @param {string} sourceLanguage - Language caterer is typing in (ENGLISH, HINDI, GUJARATI)
   * @returns {Promise} Send response
   */
  send: async (catererId, contactIds, messageText, sourceLanguage) => {
    const response = await authFetch(`${API_BASE_URL}/messages/send?catererId=${catererId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactIds, messageText, sourceLanguage })
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
    const response = await authFetch(`${API_BASE_URL}/messages/logs?catererId=${catererId}`);
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
    const response = await authFetch(`${API_BASE_URL}/messages/reorder?catererId=${catererId}`, {
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
    const response = await authFetch(`${API_BASE_URL}/api/make-call`, {
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
    const response = await authFetch(`${API_BASE_URL}/api/profile?catererId=${catererId}`);
    if (!response.ok) return null;
    return response.json();
  },
  getAll: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/profile/all`);
    return response.json();
  },
  update: async (catererId, data) => {
    const response = await authFetch(`${API_BASE_URL}/api/profile?catererId=${catererId}`, {
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
    const response = await authFetch(`${API_BASE_URL}/dishes?userId=${userId}`);
    return response.json();
  },

  /**
   * Create a new dish.
   * 
   * @param {object} dishData - Dish data (name, category, imageUrl, description, type, labels, userId)
   * @returns {Promise} Created dish
   */
  create: async (dishData) => {
    const response = await authFetch(`${API_BASE_URL}/dishes`, {
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
    const response = await authFetch(`${API_BASE_URL}/dishes/${id}`, {
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
    const response = await authFetch(`${API_BASE_URL}/dishes/${id}`, {
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

    const response = await authFetch(`${API_BASE_URL}/api/files/upload`, {
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
    const response = await authFetch(`${API_BASE_URL}/api/files?url=${encodeURIComponent(fileUrl)}`, {
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

/**
 * Calendar Event API
 */
export const calendarAPI = {
  /**
   * Create a new calendar event
   * 
   * @param {number} userId - Caterer user ID
   * @param {object} eventData - Event data { eventDate, eventHostName, managedBy?, location? }
   * @returns {Promise} Created event
   */
  create: async (userId, eventData) => {
    const response = await authFetch(`${API_BASE_URL}/api/calendar/events?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create event');
    }
    return response.json();
  },

  /**
   * Get all events for a user
   * 
   * @param {number} userId - Caterer user ID
   * @returns {Promise} Array of events
   */
  getAll: async (userId) => {
    const response = await authFetch(`${API_BASE_URL}/api/calendar/events?userId=${userId}`);
    return response.json();
  },

  /**
   * Get events for a specific date
   * 
   * @param {number} userId - Caterer user ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} Array of events
   */
  getByDate: async (userId, date) => {
    const response = await authFetch(`${API_BASE_URL}/api/calendar/events?userId=${userId}&date=${date}`);
    return response.json();
  },

  /**
   * Get events in a date range
   * 
   * @param {number} userId - Caterer user ID
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise} Array of events
   */
  getByRange: async (userId, startDate, endDate) => {
    const response = await authFetch(`${API_BASE_URL}/api/calendar/events?userId=${userId}&startDate=${startDate}&endDate=${endDate}`);
    return response.json();
  },

  /**
   * Delete an event
   * 
   * @param {number} eventId - Event ID
   * @returns {Promise} Response
   */
  delete: async (eventId) => {
    const response = await authFetch(`${API_BASE_URL}/api/calendar/events/${eventId}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};

/**
 * Availability API
 */
export const availabilityAPI = {
  /**
   * Set availability status for a date
   * 
   * @param {number} userId - Caterer user ID
   * @param {object} data - { date: "YYYY-MM-DD", status: "available" | "busy" | null }
   * @returns {Promise} Created/updated status or null
   */
  setStatus: async (userId, data) => {
    const response = await authFetch(`${API_BASE_URL}/api/availability?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.status === 204) return null;
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update availability');
    }
    return response.json();
  },

  /**
   * Get availability for a date range
   * 
   * @param {number} userId - Caterer user ID
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @returns {Promise} Array of availability statuses
   */
  getByRange: async (userId, startDate, endDate) => {
    const response = await authFetch(`${API_BASE_URL}/api/availability?userId=${userId}&startDate=${startDate}&endDate=${endDate}`);
    return response.json();
  }
};

/**
 * Menu API
 */
export const menuAPI = {
  /**
   * Get all menus for a caterer.
   * 
   * @param {number} catererId - Caterer user ID
   * @returns {Promise} Array of menus
   */
  getAll: async (catererId) => {
    const response = await authFetch(`${API_BASE_URL}/menus?catererId=${catererId}`);
    return response.json();
  },

  /**
   * Get a single menu by ID.
   * 
   * @param {number} id - Menu ID
   * @returns {Promise} Menu data
   */
  getById: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/menus/${id}`);
    return response.json();
  },

  /**
   * Create a new menu (draft).
   * 
   * @param {number} catererId - Caterer user ID
   * @param {object} menuData - Menu data
   * @returns {Promise} Created menu
   */
  create: async (catererId, menuData) => {
    const response = await authFetch(`${API_BASE_URL}/menus?catererId=${catererId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to create menu');
    }
    return data;
  },

  /**
   * Update an existing menu.
   * 
   * @param {number} id - Menu ID
   * @param {object} menuData - Menu data
   * @returns {Promise} Updated menu
   */
  update: async (id, menuData) => {
    const response = await authFetch(`${API_BASE_URL}/menus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to update menu');
    }
    return data;
  },

  /**
   * Send menu to client.
   * 
   * @param {number} id - Menu ID
   * @returns {Promise} Updated menu
   */
  sendToClient: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/menus/${id}/send`, {
      method: 'POST'
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to send menu to client');
    }
    return data;
  },

  /**
   * Delete a menu.
   * 
   * @param {number} id - Menu ID
   * @returns {Promise} Empty response
   */
  delete: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/menus/${id}`, {
      method: 'DELETE'
    });
    return response;
  },

  /**
   * Get upcoming menus for a caterer (event date >= today).
   * 
   * @param {number} catererId - Caterer user ID
   * @returns {Promise} Array of upcoming menus
   */
  getUpcoming: async (catererId) => {
    const response = await authFetch(`${API_BASE_URL}/menus/upcoming?catererId=${catererId}`);
    if (!response.ok) return [];
    return response.json();
  },

  /**
   * Get past menus for a caterer within the last N days.
   * 
   * @param {number} catererId - Caterer user ID
   * @param {number} days - Number of past days to look back (default 30)
   * @returns {Promise} Array of past menus
   */
  getPast: async (catererId, days = 30) => {
    const response = await authFetch(`${API_BASE_URL}/menus/past?catererId=${catererId}&days=${days}`);
    if (!response.ok) return [];
    return response.json();
  }
};

/**
 * Meeting Request API
 */
export const meetingRequestAPI = {
  /**
   * Create a new meeting request (client sends to caterer).
   * 
   * @param {object} requestData - Meeting request data
   * @param {number} requestData.catererId - Caterer ID
   * @param {string} requestData.eventDate - Event date (YYYY-MM-DD)
   * @param {number} requestData.numberOfGuests - Number of guests
   * @param {string} requestData.eventLocation - Event location
   * @param {string} requestData.eventType - Event type (Wedding, Birthday, etc.)
   * @param {string} requestData.message - Optional message
   * @returns {Promise} Created meeting request
   */
  create: async (requestData) => {
    const response = await authFetch(`${API_BASE_URL}/api/meeting-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create meeting request');
    }
    
    return response.json();
  },

  /**
   * Get all meeting requests for a caterer.
   * 
   * @param {string} status - Filter by status (all, pending, accepted, rejected)
   * @returns {Promise} Array of meeting requests
   */
  getCatererRequests: async (status = 'all') => {
    const response = await authFetch(`${API_BASE_URL}/api/meeting-requests/caterer?status=${encodeURIComponent(status)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch requests');
    }
    
    return response.json();
  },

  /**
   * Get all meeting requests sent by a client.
   * 
   * @param {string} status - Filter by status (all, pending, accepted, rejected)
   * @returns {Promise} Array of meeting requests
   */
  getClientRequests: async (status = 'all') => {
    const response = await authFetch(`${API_BASE_URL}/api/meeting-requests/client?status=${encodeURIComponent(status)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch requests');
    }
    
    return response.json();
  },

  /**
   * Get a specific meeting request by ID.
   * 
   * @param {number} id - Meeting request ID
   * @returns {Promise} Meeting request details
   */
  getById: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/api/meeting-requests/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch request');
    }
    
    return response.json();
  },

  /**
   * Accept a meeting request (caterer only).
   * 
   * @param {number} id - Meeting request ID
   * @returns {Promise} Updated meeting request
   */
  accept: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/api/meeting-requests/${id}/accept`, {
      method: 'PUT'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to accept request');
    }
    
    return response.json();
  },

  /**
   * Reject a meeting request (caterer only).
   * 
   * @param {number} id - Meeting request ID
   * @returns {Promise} Updated meeting request
   */
  reject: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/api/meeting-requests/${id}/reject`, {
      method: 'PUT'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject request');
    }
    
    return response.json();
  },

  /**
   * Get count of pending requests for caterer.
   * 
   * @returns {Promise} Object with count
   */
  getPendingCount: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/meeting-requests/pending-count`);
    
    if (!response.ok) {
      return { count: 0 };
    }
    
    return response.json();
  }
};

const parseAdminResponse = async (response, fallbackMessage) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
};

/**
 * Admin API
 */
export const adminAPI = {
  getDashboard: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/admin/dashboard`);
    return parseAdminResponse(response, 'Failed to fetch admin dashboard');
  },

  getCaterers: async (status = 'all') => {
    const response = await authFetch(`${API_BASE_URL}/api/admin/caterers?status=${encodeURIComponent(status)}`);
    return parseAdminResponse(response, 'Failed to fetch caterers');
  },

  updateCatererStatus: async (catererId, status) => {
    const response = await authFetch(`${API_BASE_URL}/api/admin/caterers/${catererId}/status?status=${encodeURIComponent(status)}`, {
      method: 'PUT'
    });
    return parseAdminResponse(response, 'Failed to update caterer status');
  },

  getClients: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/admin/clients`);
    return parseAdminResponse(response, 'Failed to fetch clients');
  },

  getModeration: async (status = 'all') => {
    const response = await authFetch(`${API_BASE_URL}/api/admin/moderation?status=${encodeURIComponent(status)}`);
    return parseAdminResponse(response, 'Failed to fetch moderation reports');
  },

  updateModerationStatus: async (reportId, action) => {
    const response = await authFetch(`${API_BASE_URL}/api/admin/moderation/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    return parseAdminResponse(response, 'Failed to update moderation status');
  },

  getSettings: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/admin/settings`);
    return parseAdminResponse(response, 'Failed to fetch admin settings');
  },

  saveSettings: async (settings) => {
    const response = await authFetch(`${API_BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return parseAdminResponse(response, 'Failed to save admin settings');
  }
};

const parseDiscoveryResponse = async (response, fallbackMessage) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
};

/**
 * Discovery API
 */
export const discoveryAPI = {
  searchCaterers: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.city && params.city !== 'all') searchParams.set('city', params.city);
    if (params.area && params.area !== 'all') searchParams.set('area', params.area);
    if (typeof params.minRating === 'number' && params.minRating > 0) searchParams.set('minRating', String(params.minRating));
    if (typeof params.minServiceRadius === 'number' && params.minServiceRadius > 0) searchParams.set('minServiceRadius', String(params.minServiceRadius));
    if (typeof params.lat === 'number' && typeof params.lng === 'number') {
      searchParams.set('lat', String(params.lat));
      searchParams.set('lng', String(params.lng));
    }
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);

    const suffix = searchParams.toString();
    const response = await authFetch(`${API_BASE_URL}/api/discovery/caterers${suffix ? `?${suffix}` : ''}`);
    return parseDiscoveryResponse(response, 'Failed to search caterers');
  },

  getShortlist: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/discovery/shortlist`);
    return parseDiscoveryResponse(response, 'Failed to load shortlist');
  },

  addToShortlist: async (catererId) => {
    const response = await authFetch(`${API_BASE_URL}/api/discovery/shortlist/${catererId}`, {
      method: 'POST'
    });
    return parseDiscoveryResponse(response, 'Failed to add caterer to shortlist');
  },

  removeFromShortlist: async (catererId) => {
    const response = await authFetch(`${API_BASE_URL}/api/discovery/shortlist/${catererId}`, {
      method: 'DELETE'
    });
    return parseDiscoveryResponse(response, 'Failed to remove caterer from shortlist');
  }
};

/**
 * Chat API
 */
export const chatAPI = {
  getConversations: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/chat/conversations`);
    if (!response.ok) return [];
    return response.json();
  },
  getMessages: async (partnerId) => {
    const response = await authFetch(`${API_BASE_URL}/api/chat/messages/${partnerId}`);
    if (!response.ok) return [];
    return response.json();
  },
  sendMessage: async (messageData) => {
    const response = await authFetch(`${API_BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  }
};

export default API_BASE_URL;
