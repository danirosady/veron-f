import api from './client';

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};
