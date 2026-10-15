import { api } from './client';

export const authApi = {
  register: (body) => api.post('/auth/register', body).then((r) => r.data),
  login: (body) => api.post('/auth/login', body).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
  me: (signal) => api.get('/auth/me', { signal }).then((r) => r.data.user),
  updateProfile: (body) => api.patch('/auth/me', body).then((r) => r.data.user),
  changePassword: (body) => api.put('/auth/password', body).then((r) => r.data),
  deleteAccount: (password) => api.delete('/auth/me', { data: { password } }),
};
