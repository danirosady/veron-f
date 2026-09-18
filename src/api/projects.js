import api from './client';

export const projectsAPI = {
  list: (params) => api.get('/projects', { params }),
  listWithUnits: (params) => api.get('/projects', { params: { ...params, include: 'units' } }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};
