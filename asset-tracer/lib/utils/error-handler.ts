/**
 * Error Handling Utility
 * Provides secure error handling for API routes to prevent information disclosure
 */

/**
 * Check if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Sanitized error response for API routes
 */
export interface SanitizedErrorResponse {
  error: string;
  details?: unknown;
  status: number;
}

/**
 * Sanitize error message to prevent information disclosure
 * @param error - The error object or message
 * @param defaultMessage - Default message to use if error is not safe to expose
 * @returns Sanitized error message safe for client consumption
 */
export function sanitizeErrorMessage(
  error: unknown,
  defaultMessage: string = 'Internal server error'
): string {
  if (!error) return defaultMessage;

  // In development, allow more detailed errors for debugging
  if (isDevelopment) {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return String(error);
  }

  // In production, only return safe, generic messages
  // Check for known safe error messages that don't expose system details
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Allow user-friendly error messages that don't expose system internals
    const safeMessages = [
      'unauthorized',
      'not found',
      'validation failed',
      'invalid request',
      'forbidden',
      'bad request',
      'client not found',
      'organization not found',
      'user is not associated',
      'cannot update',
      'cannot delete',
      'already exists',
      'limit reached',
    ];

    // If error message contains safe keywords, allow it
    if (safeMessages.some(safe => message.includes(safe))) {
      // Still sanitize to remove any potential sensitive details
      return error.message.split('\n')[0].split('at ')[0].trim();
    }
  }

  // Default to generic message in production
  return defaultMessage;
}

/**
 * Get sanitized error details (only in development)
 * @param error - The error object
 * @returns Error details or undefined
 */
export function getErrorDetails(error: unknown): unknown | undefined {
  if (!isDevelopment) return undefined;
  
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  
  return error;
}

/**
 * Create a sanitized error response for API routes
 * @param error - The error object
 * @param defaultMessage - Default error message
 * @param status - HTTP status code (default: 500)
 * @returns Sanitized error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'Internal server error',
  status: number = 500
): NextResponse {
  const sanitizedMessage = sanitizeErrorMessage(error, defaultMessage);
  const details = getErrorDetails(error);

  // Log full error details server-side for debugging
  if (error instanceof Error) {
    console.error(`[Error Handler] ${sanitizedMessage}`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  } else {
    console.error(`[Error Handler] ${sanitizedMessage}`, error);
  }

  const response: { error: string; details?: unknown } = {
    error: sanitizedMessage,
  };

  // Only include details in development
  if (details) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Handle specific error types with appropriate status codes
 * @param error - The error object
 * @param context - Context about the operation (e.g., 'create asset', 'fetch invoice')
 * @returns Sanitized error response with appropriate status code
 */
export function handleApiError(
  error: unknown,
  context: string = 'operation'
): NextResponse {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Handle specific error types
    if (message.includes('unauthorized') || message.includes('not authenticated')) {
      return createErrorResponse(error, 'Unauthorized. Please sign in.', 401);
    }

    if (message.includes('not found') || message.includes('does not exist')) {
      return createErrorResponse(
        error,
        `${context.charAt(0).toUpperCase() + context.slice(1)} not found or access denied.`,
        404
      );
    }

    if (message.includes('forbidden') || message.includes('access denied') || message.includes('permission')) {
      return createErrorResponse(
        error,
        'You do not have permission to perform this action.',
        403
      );
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return createErrorResponse(
        error,
        'Invalid request data. Please check your input.',
        400
      );
    }

    if (message.includes('already exists') || message.includes('duplicate')) {
      return createErrorResponse(
        error,
        'This resource already exists.',
        409
      );
    }
  }

  // Default to generic error
  return createErrorResponse(
    error,
    `Failed to ${context}. Please try again later.`,
    500
  );
}

// Import NextResponse for type
import { NextResponse } from 'next/server';

