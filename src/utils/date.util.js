/**
 * Format date to ISO string
 * @param {Date} date - Date object
 * @returns {string} ISO formatted date string
 */
export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * Get start of day
 * @param {Date} date - Date object
 * @returns {Date} Start of day
 */
export const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day
 * @param {Date} date - Date object
 * @returns {Date} End of day
 */
export const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get start of week
 * @param {Date} date - Date object
 * @returns {Date} Start of week (Monday)
 */
export const getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return getStartOfDay(d);
};

/**
 * Get end of week
 * @param {Date} date - Date object
 * @returns {Date} End of week (Sunday)
 */
export const getEndOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
  d.setDate(diff);
  return getEndOfDay(d);
};

/**
 * Get start of month
 * @param {Date} date - Date object
 * @returns {Date} Start of month
 */
export const getStartOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  return getStartOfDay(d);
};

/**
 * Get end of month
 * @param {Date} date - Date object
 * @returns {Date} End of month
 */
export const getEndOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  return getEndOfDay(d);
};

/**
 * Add days to date
 * @param {Date} date - Date object
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Check if date is today
 * @param {Date} date - Date object
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};
