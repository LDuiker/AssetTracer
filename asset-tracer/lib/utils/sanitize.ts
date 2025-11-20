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
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

