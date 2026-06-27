import api from './api';

const inventoryService = {
  getAllInventory: async (params = {}) => {
    const res = await api.get('/inventory', { params });
    return res.data;
  },

  getByCategory: async (category) => {
    const res = await api.get(`/inventory/category/${category}`);
    return res.data;
  },

  getLowStock: async () => {
    const res = await api.get('/inventory/low-stock');
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/inventory/${id}`);
    return res.data;
  },

  createItem: async (formData) => {
    const res = await api.post('/inventory', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updateItem: async (id, formData) => {
    const res = await api.put(`/inventory/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updateStock: async (id, quantity, operation = 'set') => {
    const res = await api.patch(`/inventory/${id}/stock`, { quantity, operation });
    return res.data;
  },

  updateThreshold: async (id, threshold) => {
    const res = await api.patch(`/inventory/${id}/threshold`, { threshold });
    return res.data;
  },

  deleteItem: async (id) => {
    const res = await api.delete(`/inventory/${id}`);
    return res.data;
  },
};

export default inventoryService;