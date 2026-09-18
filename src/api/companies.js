import api from './client';

export const companiesAPI = {
  list: (params) => api.get('/companies', { params }),
  listWithProjects: (params) => api.get('/companies', { params: { ...params, include: 'projects' } }),
  get: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};
