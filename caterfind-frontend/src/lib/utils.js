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
    const withoutPrefix = str.startsWith('+91') ? str.slice(3) : str;
    return withoutPrefix.replace(/\D/g, '').slice(0, 10);
}

/**
 * Format phone for backend send (ensure +91 prefix)
 * @param {string} phone - Phone number from input
 * @returns {string} Phone with +91 prefix for backend
 */
export function formatPhoneForBackend(phone) {
    if (!phone) return '';
    const str = String(phone).trim();
    const withoutPrefix = str.startsWith('+91') ? str.slice(3) : str;
    const digits = withoutPrefix.replace(/\D/g, '').slice(0, 10);
    if (!digits) return '';
    return '+91' + digits;
}

/**
 * Format phone for UI display (with +91 prefix)
 * @param {string} phone - Phone number from backend
 * @returns {string} Formatted phone with +91 for display
 */
export function formatPhoneForDisplay(phone) {
    if (!phone) return '';
    const digits = formatPhoneForInput(phone);
    if (!digits) return '';
    return '+91' + digits;
}
