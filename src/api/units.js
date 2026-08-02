import api from './client';

export const unitsAPI = {
  list: (params) => api.get('/units', { params }),
  get: (id) => api.get(`/units/${id}`),
  create: (data) => api.post('/units', data),
  update: (id, data) => api.put(`/units/${id}`, data),
  delete: (id) => api.delete(`/units/${id}`),
  getTyres: (id) => api.get(`/units/${id}/tyres`),
  assignTyre: (unitId, data) => api.post(`/units/${unitId}/tyres`, data),
  removeTyre: (unitId, position) => api.delete(`/units/${unitId}/tyres/${position}`),
  updateHM: (id, data) => api.put(`/units/${id}/hm`, data),
};
