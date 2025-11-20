/**
 * HTML Sanitization Utility
 * Uses DOMPurify to sanitize HTML content and prevent XSS attacks
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  // Configure DOMPurify to allow safe formatting tags
  const config = {
    ALLOWED_TAGS: ['strong', 'em', 'b', 'i', 'p', 'br', 'u', 'span'],
    ALLOWED_ATTR: ['class', 'style'],
    KEEP_CONTENT: true,
  };
  
  return DOMPurify.sanitize(html, config);
}

/**
 * Sanitize text content (removes all HTML)
 * @param text - The text string to sanitize
 * @returns Plain text with HTML removed
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  // Use KEEP_CONTENT to preserve text content even when all tags are removed
  // This ensures that text like "Quote Subject" in <svg>Quote Subject</svg> is preserved
  const sanitized = DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
  return sanitized;
}

/**
 * Sanitize an object's string fields to prevent XSS attacks
 * Recursively sanitizes all string values in an object
 * @param data - The data object to sanitize
 * @param fieldsToSanitize - Array of field names to sanitize (optional, sanitizes all strings if not provided)
 * @returns Sanitized object with the same structure
 */
export function sanitizeObject<T extends Record<string, any>>(
  data: T,
  fieldsToSanitize?: string[]
): T {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      const value = sanitized[key];

      // If field list is provided, only sanitize those fields
      if (fieldsToSanitize && !fieldsToSanitize.includes(key)) {
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      }
      // Recursively sanitize nested objects
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value, fieldsToSanitize);
      }
      // Sanitize string values in arrays
      else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => {
          if (typeof item === 'string') {
            return sanitizeText(item);
          } else if (item && typeof item === 'object') {
            // For nested objects in arrays, sanitize all string fields if no specific fields are provided
            // or if the key matches a field in fieldsToSanitize (like 'items')
            if (fieldsToSanitize && fieldsToSanitize.includes(key)) {
              // If this array field is in the sanitize list, sanitize all string fields in nested objects
              return sanitizeObject(item); // No field list = sanitize all strings
            }
            return sanitizeObject(item, fieldsToSanitize);
          }
          return item;
        });
      }
    }
  }

  return sanitized;
}

