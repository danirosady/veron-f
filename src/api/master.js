import api from './client';

export const masterAPI = {
  // Brands
  listBrands: (params) => api.get('/master/brands', { params }),
  getBrand: (id) => api.get(`/master/brands/${id}`),
  createBrand: (data) => api.post('/master/brands', data),
  updateBrand: (id, data) => api.put(`/master/brands/${id}`, data),
  deleteBrand: (id) => api.delete(`/master/brands/${id}`),

  // Sizes
  listSizes: (params) => api.get('/master/sizes', { params }),
  getSize: (id) => api.get(`/master/sizes/${id}`),
  createSize: (data) => api.post('/master/sizes', data),
  updateSize: (id, data) => api.put(`/master/sizes/${id}`, data),
  deleteSize: (id) => api.delete(`/master/sizes/${id}`),

  // Types
  listTypes: (params) => api.get('/master/types', { params }),
  getType: (id) => api.get(`/master/types/${id}`),
  createType: (data) => api.post('/master/types', data),
  updateType: (id, data) => api.put(`/master/types/${id}`, data),
  deleteType: (id) => api.delete(`/master/types/${id}`),

  // Patterns
  listPatterns: (params) => api.get('/master/patterns', { params }),
  getPattern: (id) => api.get(`/master/patterns/${id}`),
  createPattern: (data) => api.post('/master/patterns', data),
  updatePattern: (id, data) => api.put(`/master/patterns/${id}`, data),
  deletePattern: (id) => api.delete(`/master/patterns/${id}`),

  // Reasons
  listReasons: (params) => api.get('/master/reasons', { params }),
  getReason: (id) => api.get(`/master/reasons/${id}`),
  createReason: (data) => api.post('/master/reasons', data),
  updateReason: (id, data) => api.put(`/master/reasons/${id}`, data),
  deleteReason: (id) => api.delete(`/master/reasons/${id}`),

  // Actions
  listActions: (params) => api.get('/master/actions', { params }),
  getAction: (id) => api.get(`/master/actions/${id}`),
  createAction: (data) => api.post('/master/actions', data),
  updateAction: (id, data) => api.put(`/master/actions/${id}`, data),
  deleteAction: (id) => api.delete(`/master/actions/${id}`),

  // Remarks
  listRemarks: (params) => api.get('/master/remarks', { params }),
  getRemark: (id) => api.get(`/master/remarks/${id}`),
  createRemark: (data) => api.post('/master/remarks', data),
  updateRemark: (id, data) => api.put(`/master/remarks/${id}`, data),
  deleteRemark: (id) => api.delete(`/master/remarks/${id}`),

  // Unit types
  listUnitTypes: (params) => api.get('/master/unit-types', { params }),
  getUnitType: (id) => api.get(`/master/unit-types/${id}`),
  createUnitType: (data) => api.post('/master/unit-types', data),
  updateUnitType: (id, data) => api.put(`/master/unit-types/${id}`, data),
  deleteUnitType: (id) => api.delete(`/master/unit-types/${id}`),
};
