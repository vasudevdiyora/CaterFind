-- ============================================================
-- MANUAL DATA INSERTION SCRIPT
-- ============================================================
-- Run this script manually in MySQL after the backend starts
-- This creates the default caterer and client accounts
--
-- HOW TO RUN:
-- 1. Open MySQL command line or MySQL Workbench
-- 2. Connect to the caterfind database
-- 3. Run this entire script
-- ============================================================

USE caterfind;

-- Insert default users (caterer and client)
INSERT INTO users (email, password, role, created_at) VALUES
('admin@caterfind.com', 'admin123', 'CATERER', NOW()),
('client@test.com', 'client123', 'CLIENT', NOW());

-- Insert caterer profile
INSERT INTO catering_profile (user_id, business_name, primary_phone, street_address, city, area, description, created_at) VALUES
(1, 'Royal Caterers', '+91-9876543210', '123 Main Street', 'Mumbai', 'Maharashtra', 'Premium catering services for all occasions.', NOW());

-- Insert predefined contact labels
INSERT INTO contact_labels (label_name) VALUES
('Staff'),
('Chef'),
('Helper'),
('Supplier'),
('Dealer');

-- ============================================================
-- OPTIONAL: Sample data (uncomment if you want test data)
-- ============================================================

-- Sample contacts
-- INSERT INTO contacts (caterer_id, name, phone, email, preferred_contact_method, created_at) VALUES
-- (1, 'Rajesh Kumar', '+91-9876543211', 'rajesh@example.com', 'EMAIL', NOW()),
-- (1, 'Priya Sharma', '+91-9876543212', 'priya@example.com', 'SMS', NOW()),
-- (1, 'Amit Patel', '+91-9876543213', 'amit@example.com', 'EMAIL', NOW());

-- Sample contact label mappings
-- INSERT INTO contact_label_mapping (contact_id, label_id) VALUES
-- (1, 1), -- Rajesh is Staff
-- (1, 2), -- Rajesh is also Chef
-- (2, 3), -- Priya is Helper
-- (3, 4); -- Amit is Supplier

-- Sample inventory items
-- INSERT INTO inventory_items (caterer_id, item_name, category, quantity, unit, min_threshold, created_at) VALUES
-- (1, 'Basmati Rice', 'GRAIN', 50.00, 'kg', 20.00, NOW()),
-- (1, 'Tomatoes', 'VEGETABLE', 15.00, 'kg', 10.00, NOW()),
-- (1, 'Chicken', 'MEAT', 8.00, 'kg', 10.00, NOW()),
-- (1, 'Milk', 'DAIRY', 25.00, 'liters', 15.00, NOW()),
-- (1, 'Turmeric Powder', 'MASALA', 3.00, 'kg', 5.00, NOW()),
-- (1, 'Cooking Oil', 'OIL', 12.00, 'liters', 8.00, NOW());
