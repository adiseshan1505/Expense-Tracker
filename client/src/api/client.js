import axios from 'axios';

const TOKEN_KEY = 'et_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 70000,
});

let handleUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  handleUnauthorized = fn;
};

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      handleUnauthorized(error.response.data?.message);
    }
    return Promise.reject(error);
  },
);

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
