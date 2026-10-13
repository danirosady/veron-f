import api from './client';

export const reportsAPI = {
  replacement: (params) => api.get('/reports/replacement', { params }),
  inventory: (params) => api.get('/reports/inventory', { params }),
  schedule: (params) => api.get('/reports/schedule', { params }),
  tyreSummary: (params) => api.get('/reports/tyre-summary', { params }),
  potentialHM: (params) => api.get('/reports/potential-hm', { params }),

  exportReplacement: (params) =>
    api.get('/reports/replacement/export', { params, responseType: 'blob' }),
  exportInventory: (params) =>
    api.get('/reports/inventory/export', { params, responseType: 'blob' }),
  exportSchedule: (params) =>
    api.get('/reports/schedule/export', { params, responseType: 'blob' }),
};
