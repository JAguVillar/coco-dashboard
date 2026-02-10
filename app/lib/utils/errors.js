/**
 * Centralized Error Handling Utility
 * Provides consistent error mapping and user-friendly messages
 */

/**
 * Error codes for application-specific errors
 */
export const ErrorCodes = {
  // Client errors
  CLIENT_PHONE_EXISTS: "CLIENT_PHONE_EXISTS",
  CLIENT_NOT_FOUND: "CLIENT_NOT_FOUND",

  // Product errors
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",

  // Venta errors
  VENTA_NOT_FOUND: "VENTA_NOT_FOUND",
  VENTA_ALREADY_COMPLETED: "VENTA_ALREADY_COMPLETED",
  VENTA_ALREADY_CANCELLED: "VENTA_ALREADY_CANCELLED",

  // Generic database errors
  UNIQUE_VIOLATION: "UNIQUE_VIOLATION",
  FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",
  NOT_NULL_VIOLATION: "NOT_NULL_VIOLATION",
  CHECK_VIOLATION: "CHECK_VIOLATION",

  // Permission errors
  PERMISSION_DENIED: "PERMISSION_DENIED",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
};

/**
 * PostgreSQL error codes
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PostgresErrorCodes = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",
};

/**
 * User-friendly error messages in Spanish (Argentina)
 */
export const ErrorMessages = {
  // Client errors
  [ErrorCodes.CLIENT_PHONE_EXISTS]: "Ya existe un cliente con ese teléfono.",
  [ErrorCodes.CLIENT_NOT_FOUND]: "No se encontró el cliente.",

  // Product errors
  [ErrorCodes.PRODUCT_NOT_FOUND]: "No se encontró el producto.",
  [ErrorCodes.INSUFFICIENT_STOCK]: "Stock insuficiente para completar la operación.",

  // Venta errors
  [ErrorCodes.VENTA_NOT_FOUND]: "No se encontró la venta.",
  [ErrorCodes.VENTA_ALREADY_COMPLETED]: "La venta ya fue completada.",
  [ErrorCodes.VENTA_ALREADY_CANCELLED]: "La venta ya fue cancelada.",

  // Generic database errors
  [ErrorCodes.UNIQUE_VIOLATION]: "Ya existe un registro con esos datos.",
  [ErrorCodes.FOREIGN_KEY_VIOLATION]: "No se puede eliminar porque está siendo utilizado.",
  [ErrorCodes.NOT_NULL_VIOLATION]: "Falta información requerida.",
  [ErrorCodes.CHECK_VIOLATION]: "Los datos no cumplen con las restricciones.",

  // Permission errors
  [ErrorCodes.PERMISSION_DENIED]: "No tenés permisos para realizar esta acción.",
  [ErrorCodes.UNAUTHORIZED]: "Necesitás iniciar sesión para continuar.",

  // Network errors
  [ErrorCodes.NETWORK_ERROR]: "Error de conexión. Verificá tu conexión a internet.",
  [ErrorCodes.TIMEOUT]: "La operación tardó demasiado. Intentá nuevamente.",

  // Default
  DEFAULT: "Ocurrió un error inesperado. Intentá nuevamente.",
};

/**
 * Creates an application error with a specific code and message
 * @param {string} code - Error code from ErrorCodes
 * @param {string} [customMessage] - Optional custom message (overrides default)
 * @param {Error} [originalError] - Optional original error for debugging
 * @returns {Error} - Enhanced error object
 */
export function createAppError(code, customMessage, originalError) {
  const message = customMessage || ErrorMessages[code] || ErrorMessages.DEFAULT;
  const error = new Error(message);
  error.code = code;
  error.originalError = originalError;
  return error;
}

/**
 * Maps PostgreSQL/Supabase errors to user-friendly application errors
 * @param {Error} error - Original error from Supabase
 * @param {Object} [context] - Additional context for specific error mappings
 * @returns {Error} - Mapped application error
 */
export function mapDatabaseError(error, context = {}) {
  // Handle null/undefined
  if (!error) {
    return createAppError(ErrorCodes.DEFAULT);
  }

  // Already mapped - return as is
  if (error.code && ErrorMessages[error.code]) {
    return error;
  }

  // PostgreSQL unique violation (23505)
  if (error.code === PostgresErrorCodes.UNIQUE_VIOLATION) {
    // Check context for specific entity mappings
    if (context.entity === "clients" && error.message?.includes("phone")) {
      return createAppError(ErrorCodes.CLIENT_PHONE_EXISTS, null, error);
    }
    return createAppError(ErrorCodes.UNIQUE_VIOLATION, null, error);
  }

  // PostgreSQL foreign key violation (23503)
  if (error.code === PostgresErrorCodes.FOREIGN_KEY_VIOLATION) {
    return createAppError(ErrorCodes.FOREIGN_KEY_VIOLATION, null, error);
  }

  // PostgreSQL not null violation (23502)
  if (error.code === PostgresErrorCodes.NOT_NULL_VIOLATION) {
    return createAppError(ErrorCodes.NOT_NULL_VIOLATION, null, error);
  }

  // PostgreSQL check violation (23514)
  if (error.code === PostgresErrorCodes.CHECK_VIOLATION) {
    return createAppError(ErrorCodes.CHECK_VIOLATION, null, error);
  }

  // Supabase auth errors
  if (error.message?.includes("JWT") || error.message?.includes("auth")) {
    return createAppError(ErrorCodes.UNAUTHORIZED, null, error);
  }

  // Network errors
  if (error.message?.includes("fetch") || error.message?.includes("network")) {
    return createAppError(ErrorCodes.NETWORK_ERROR, null, error);
  }

  // Timeout errors
  if (error.message?.includes("timeout") || error.code === "ETIMEDOUT") {
    return createAppError(ErrorCodes.TIMEOUT, null, error);
  }

  // Default: wrap original error
  return createAppError(ErrorCodes.DEFAULT, error.message, error);
}

/**
 * Gets user-friendly error message from any error
 * @param {Error} error - Error object
 * @returns {string} - User-friendly message
 */
export function getErrorMessage(error) {
  if (!error) return ErrorMessages.DEFAULT;

  // If error has a code, try to get the message
  if (error.code && ErrorMessages[error.code]) {
    return ErrorMessages[error.code];
  }

  // Return error message or default
  return error.message || ErrorMessages.DEFAULT;
}
