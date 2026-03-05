-- ============================================================
-- Migration: Add preferred_language column to contacts table
-- ============================================================
-- This migration adds support for multi-language messaging feature
-- where each contact can have their preferred language (English, Hindi, or Gujarati)
-- and broadcast messages will be automatically translated to their preferred language.
-- ============================================================

-- Add preferred_language column to contacts table
ALTER TABLE contacts 
ADD COLUMN preferred_language VARCHAR(20) DEFAULT 'ENGLISH' AFTER preferred_contact_method;

-- Update existing contacts to have default language as ENGLISH
UPDATE contacts 
SET preferred_language = 'ENGLISH' 
WHERE preferred_language IS NULL;

-- Add NOT NULL constraint after setting default values
-- (Optional - uncomment if you want to enforce NOT NULL)
-- ALTER TABLE contacts 
-- MODIFY COLUMN preferred_language VARCHAR(20) NOT NULL DEFAULT 'ENGLISH';

-- ============================================================
-- Verification Query
-- ============================================================
-- Use this to verify the migration was successful:
-- SELECT id, name, preferred_contact_method, preferred_language FROM contacts LIMIT 10;
