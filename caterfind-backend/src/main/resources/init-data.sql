-- ============================================================
-- Initial Data for Catering Business Management System
-- ============================================================
-- This script populates the database with:
-- 1. Default caterer account for testing
-- 2. Default client account for testing login rejection
-- 3. Predefined contact labels
-- ============================================================

-- ============================================================
-- INSERT DEFAULT USERS
-- ============================================================
-- NOTE: Passwords are stored in plain text for college project demo
-- In production, use BCrypt hashing via Spring Security

-- Default CATERER account
-- Login: admin@caterfind.com / admin123
INSERT INTO users (email, password, role) VALUES
('admin@caterfind.com', 'admin123', 'CATERER');

-- Default CLIENT account (for testing "not implemented" message)
-- Login: client@test.com / client123
INSERT INTO users (email, password, role) VALUES
('client@test.com', 'client123', 'CLIENT');

-- ============================================================
-- INSERT CATERING PROFILE
-- ============================================================
-- Business profile for the default caterer
INSERT INTO catering_profile (user_id, business_name, phone, address) VALUES
(1, 'Royal Caterers', '+91-9876543210', '123 Main Street, Mumbai, Maharashtra 400001');

-- ============================================================
-- INSERT PREDEFINED CONTACT LABELS
-- ============================================================
-- These labels are used for categorizing contacts
-- Labels are flexible to support real catering workflow
-- A contact can have multiple labels (e.g., Chef + Staff)
INSERT INTO contact_labels (label_name) VALUES
('Staff'),
('Chef'),
('Helper'),
('Supplier'),
('Dealer');

-- ============================================================
-- OPTIONAL: Sample Contacts (uncomment if you want demo data)
-- ============================================================
-- INSERT INTO contacts (caterer_id, name, phone, email, preferred_contact_method) VALUES
-- (1, 'Rajesh Kumar', '+91-9876543211', 'rajesh@example.com', 'EMAIL'),
-- (1, 'Priya Sharma', '+91-9876543212', 'priya@example.com', 'SMS'),
-- (1, 'ABC Suppliers', '+91-9876543213', 'abc@suppliers.com', 'EMAIL');

-- ============================================================
-- OPTIONAL: Sample Contact Label Mappings
-- ============================================================
-- INSERT INTO contact_label_mapping (contact_id, label_id) VALUES
-- (1, 1), -- Rajesh = Staff
-- (1, 2), -- Rajesh = Chef
-- (2, 3), -- Priya = Helper
-- (3, 4); -- ABC Suppliers = Supplier

-- ============================================================
-- OPTIONAL: Sample Inventory Items
-- ============================================================
-- INSERT INTO inventory_items (caterer_id, item_name, category, quantity, unit, min_threshold) VALUES
-- (1, 'Basmati Rice', 'GRAIN', 50.00, 'kg', 20.00),
-- (1, 'Tomatoes', 'VEGETABLE', 5.00, 'kg', 10.00), -- This will be LOW STOCK
-- (1, 'Chicken', 'MEAT', 30.00, 'kg', 15.00);

-- ============================================================
-- DATA NOTES
-- ============================================================
-- 1. User ID 1 is the default caterer (admin@caterfind.com)
-- 2. User ID 2 is the test client (client@test.com)
-- 3. Contact labels are predefined but can be extended
-- 4. Sample data is commented out - uncomment for demo purposes
-- ============================================================
