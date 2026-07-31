import api from './client';

export const replacementsAPI = {
  list: (params) => api.get('/replacements', { params }),
  get: (id) => api.get(`/replacements/${id}`),
  create: (data) => api.post('/replacements', data),
  update: (id, data) => api.put(`/replacements/${id}`, data),
  delete: (id) => api.delete(`/replacements/${id}`),
};
