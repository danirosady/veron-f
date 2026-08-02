import api from './client';

export const tyresAPI = {
  list: (params) => api.get('/tyres', { params }),
  get: (id) => api.get(`/tyres/${id}`),
  create: (data) => api.post(`/tyres?company_id=${data.company_id}`, data),
  update: (id, data) => api.put(`/tyres/${id}`, data),
  delete: (id) => api.delete(`/tyres/${id}`),
  getByBarcode: (barcode) => api.get(`/tyres/barcode/${barcode}`),
  getSpare: (params) => api.get('/tyres/spare', { params }),
  getHistory: (id) => api.get(`/tyres/${id}/history`),
  getUsage: (id, params) => api.get(`/tyres/${id}/usage`, { params }),
};
