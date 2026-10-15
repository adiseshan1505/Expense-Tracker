import { api } from './client';

const clean = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const transactionsApi = {
  list: (params, signal) => api.get('/transactions', { params: clean(params), signal }).then((r) => r.data),
  summary: (params, signal) =>
    api.get('/transactions/summary', { params: clean(params), signal }).then((r) => r.data),
  create: (body) => api.post('/transactions', body).then((r) => r.data.transaction),
  update: (id, body) => api.put(`/transactions/${id}`, body).then((r) => r.data.transaction),
  remove: (id) => api.delete(`/transactions/${id}`),
};

export const metaApi = {
  get: (signal) => api.get('/meta', { signal }).then((r) => r.data),
};
