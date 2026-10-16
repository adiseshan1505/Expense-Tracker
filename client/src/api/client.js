import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 70000,
});

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (axios.isCancel(error)) return '';
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
}

export function getFieldErrors(error) {
  const details = error.response?.data?.details;
  if (!Array.isArray(details)) return {};
  return Object.fromEntries(details.map((d) => [d.field, d.message]));
}
