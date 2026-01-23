import { HTTP_STATUS, MESSAGES } from '../config/constants.js';

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
export const sendSuccess = (res, data = null, message = MESSAGES.SUCCESS, statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Additional error details
 */
export const sendError = (res, message = MESSAGES.SERVER_ERROR, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {*} errors - Validation errors
 */
export const sendValidationError = (res, errors) => {
  return sendError(res, MESSAGES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, errors);
};
