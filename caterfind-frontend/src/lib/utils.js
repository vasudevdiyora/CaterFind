import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge to handle conflicts
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format phone for input display (strip +91 if present)
 * @param {string} phone - Phone number from backend
 * @returns {string} Phone without +91 prefix for input value
 */
export function formatPhoneForInput(phone) {
    if (!phone) return '';
    const str = String(phone).trim();
    return str.startsWith('+91') ? str.slice(3) : str;
}

/**
 * Format phone for backend send (ensure +91 prefix)
 * @param {string} phone - Phone number from input
 * @returns {string} Phone with +91 prefix for backend
 */
export function formatPhoneForBackend(phone) {
    if (!phone) return '';
    const str = String(phone).trim();
    if (!str.startsWith('+91')) {
        return '+91' + str;
    }
    return str;
}

/**
 * Format phone for UI display (with +91 prefix)
 * @param {string} phone - Phone number from backend
 * @returns {string} Formatted phone with +91 for display
 */
export function formatPhoneForDisplay(phone) {
    if (!phone) return '';
    const str = String(phone).trim();
    if (!str.startsWith('+91')) {
        return '+91' + str;
    }
    return str;
}
