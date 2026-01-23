// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Response Messages
export const MESSAGES = {
  SUCCESS: 'Success',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_EXISTS: 'User already exists',
  USER_NOT_FOUND: 'User not found'
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Token Types
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh'
};
