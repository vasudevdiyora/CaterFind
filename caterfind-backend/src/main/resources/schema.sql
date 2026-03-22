-- ============================================================
-- Catering Business Management System - Database Schema
-- ============================================================
-- This schema supports CATERER-SIDE ONLY functionality
-- NO client booking, payment, or event management features
-- Purpose: Internal contact management, messaging, and inventory tracking
-- ============================================================

-- Drop existing tables if re-running (for development only)
DROP TABLE IF EXISTS menu_dishes;
DROP TABLE IF EXISTS menus;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS meeting_requests;
DROP TABLE IF EXISTS client_shortlist;
DROP TABLE IF EXISTS moderation_reports;
DROP TABLE IF EXISTS platform_settings;
DROP TABLE IF EXISTS password_reset_otps;
DROP TABLE IF EXISTS availability_status;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS contact_label_mapping;
DROP TABLE IF EXISTS contact_labels;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS catering_profile;
DROP TABLE IF EXISTS users;

-- ============================================================
-- USERS TABLE
-- ============================================================
-- Stores authentication credentials for ADMIN, CATERER and CLIENT roles
-- ADMIN: Platform administrators with access to admin panel
-- CATERER: Business owners managing their catering services
-- CLIENT: Customers looking for catering services
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- In production, this should be hashed (BCrypt)
    role ENUM('ADMIN', 'CATERER', 'CLIENT') NOT NULL,
    account_status ENUM('ACTIVE', 'PENDING', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CATERING_PROFILE TABLE
-- ============================================================
-- One-to-one relationship with users table (only for CATERER role)
-- Stores business information for the caterer
CREATE TABLE catering_profile (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CONTACTS TABLE
-- ============================================================
-- Stores all contacts for a caterer (staff, suppliers, dealers, etc.)
-- Labels are stored separately to allow flexible categorization
-- preferred_contact_method determines whether to use email or SMS for messaging
CREATE TABLE contacts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    caterer_id BIGINT NOT NULL, -- Links to user_id of the caterer
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    preferred_contact_method ENUM('EMAIL', 'SMS', 'CALL') DEFAULT 'EMAIL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caterer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_caterer (caterer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CONTACT_LABELS TABLE
-- ============================================================
-- Predefined labels for categorizing contacts
-- Normalized design allows easy addition of new label types
-- Examples: Staff, Chef, Helper, Supplier, Dealer
CREATE TABLE contact_labels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    label_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CONTACT_LABEL_MAPPING TABLE
-- ============================================================
-- Many-to-many relationship between contacts and labels
-- A contact can have multiple labels (e.g., both "Chef" and "Staff")
-- This design supports real-world catering workflow where roles overlap
CREATE TABLE contact_label_mapping (
    contact_id BIGINT NOT NULL,
    label_id BIGINT NOT NULL,
    PRIMARY KEY (contact_id, label_id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES contact_labels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- INVENTORY_ITEMS TABLE
-- ============================================================
-- Tracks inventory items with automatic low-stock detection
-- dealer_contact_id links to contacts table (dealer/supplier)
-- is_low_stock is computed: TRUE when quantity < min_threshold
-- NO billing or purchase order functionality (out of scope)
CREATE TABLE inventory_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    caterer_id BIGINT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category ENUM('GRAIN', 'VEGETABLE', 'MEAT', 'DAIRY', 'MASALA', 'OIL', 'OTHER') NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL, -- e.g., kg, liters, pieces
    min_threshold DECIMAL(10, 2) NOT NULL DEFAULT 0,
    dealer_contact_id BIGINT, -- Optional: assigned dealer from contacts
    is_low_stock BOOLEAN GENERATED ALWAYS AS (quantity < min_threshold) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (caterer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dealer_contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    INDEX idx_caterer (caterer_id),
    INDEX idx_low_stock (is_low_stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
-- Audit log for all messages sent via the messaging module
-- This is NOT a chat system - it's a broadcast messaging log
-- Each row represents one message sent to one contact
-- NO threading, NO replies, NO inbox UI
-- contact_method stores whether email or SMS was used
-- status tracks delivery (for stub implementation, always 'SENT')
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    caterer_id BIGINT NOT NULL,
    contact_id BIGINT NOT NULL,
    message_text TEXT NOT NULL,
    contact_method ENUM('EMAIL', 'SMS', 'CALL') NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('SENT', 'FAILED') DEFAULT 'SENT',
    FOREIGN KEY (caterer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    INDEX idx_caterer (caterer_id),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CALENDAR_EVENTS TABLE
-- ============================================================
-- Stores calendar events added to the availability calendar
-- Events older than 30 days are automatically deleted via scheduled job
-- user_id refers to caterer who created the event
CREATE TABLE calendar_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_date DATE NOT NULL,
    event_host_name VARCHAR(255) NOT NULL,
    managed_by VARCHAR(255),
    location VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, event_date),
    INDEX idx_event_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- AVAILABILITY_STATUS TABLE
-- ============================================================
-- Stores availability status (available/busy) per caterer per date
CREATE TABLE availability_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    available_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_availability_user_date (user_id, available_date),
    INDEX idx_availability_date (available_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DISHES TABLE
-- ============================================================
-- Stores dishes in the caterer's library
-- Each dish belongs to a specific caterer
CREATE TABLE dishes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url VARCHAR(500),
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'Veg' or 'Non-Veg'
    labels TEXT, -- Comma-separated labels (e.g., 'Spicy,Luxury,Healthy')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MENUS TABLE
-- ============================================================
-- Stores menus created by caterers for client events
-- A menu contains client details and associated dishes
CREATE TABLE menus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    caterer_id BIGINT NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(100),
    meal_time VARCHAR(50), -- Breakfast, Brunch, Lunch, Evening Snack, Dinner, Late Night Snack
    event_location VARCHAR(500) NOT NULL,
    event_date DATE NOT NULL,
    number_of_guests INT NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    client_email VARCHAR(255),
    status ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    FOREIGN KEY (caterer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_caterer (caterer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MENU_DISHES TABLE
-- ============================================================
-- Many-to-many relationship between menus and dishes
-- Stores which dishes are included in which menus
-- menu_category assigns dishes to categories like 'Main Course', 'Starter', etc.
CREATE TABLE menu_dishes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    menu_id BIGINT NOT NULL,
    dish_id BIGINT NOT NULL,
    menu_category VARCHAR(100) NOT NULL, -- e.g., 'Main Course', 'Starter', 'Dessert', 'Beverage'
    display_order INT,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    INDEX idx_menu (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MEETING_REQUESTS TABLE
-- ============================================================
-- Stores meeting/event requests from clients to caterers
-- Allows clients to request meetings for their events
CREATE TABLE meeting_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    caterer_id BIGINT NOT NULL,
    event_date DATE NOT NULL,
    number_of_guests INT NOT NULL,
    event_location VARCHAR(500) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- Wedding, Birthday Party, Corporate Event, etc.
    message TEXT,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (caterer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_caterer (caterer_id),
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CLIENT_SHORTLIST TABLE
-- ============================================================
-- Stores client favorite/shortlisted caterers for discovery.
CREATE TABLE client_shortlist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    caterer_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shortlist_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_shortlist_caterer FOREIGN KEY (caterer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_client_shortlist_client_caterer UNIQUE (client_id, caterer_id),
    INDEX idx_shortlist_client (client_id),
    INDEX idx_shortlist_caterer (caterer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MODERATION_REPORTS TABLE
-- ============================================================
-- Stores reported content handled by admin moderation workflow
CREATE TABLE moderation_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('MESSAGE', 'PROFILE') NOT NULL,
    content TEXT NOT NULL,
    reported_by VARCHAR(255) NOT NULL,
    reported_user VARCHAR(255) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    status ENUM('PENDING', 'RESOLVED', 'REMOVED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moderation_status (status),
    INDEX idx_moderation_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PLATFORM_SETTINGS TABLE
-- ============================================================
-- Stores configurable key/value admin settings for the platform
CREATE TABLE platform_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PASSWORD_RESET_OTPS TABLE
-- ============================================================
-- Stores hashed OTP records for forgot-password flow
CREATE TABLE password_reset_otps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(128) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INT NOT NULL DEFAULT 0,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_otp_email_created (email, created_at),
    INDEX idx_password_otp_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SCHEMA DESIGN NOTES
-- ============================================================
-- 1. Normalization: Contact labels are separate to avoid data duplication
-- 2. Future-proof: Schema can be extended for client-side features later
-- 3. Constraints: Foreign keys ensure referential integrity
-- 4. Indexes: Added on frequently queried columns (caterer_id, email, low_stock)
-- 5. Generated column: is_low_stock auto-updates when quantity changes
-- 6. Calendar events: idx_event_date allows fast cleanup queries for old events
-- 7. Menu Builder: Menus can be saved as drafts or sent to clients
-- 8. Dishes Library: Each caterer maintains their own dish library
-- ============================================================
