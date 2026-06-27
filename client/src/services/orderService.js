import api from './api';

const orderService = {
  placeOrder: async (orderData) => {
    const res = await api.post('/orders', orderData);
    return res.data;
  },

  getMyOrders: async (params = {}) => {
    const res = await api.get('/orders/my-orders', { params });
    return res.data;
  },

  getOrderById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  cancelOrder: async (id, reason) => {
    const res = await api.patch(`/orders/${id}/cancel`, { reason });
    return res.data;
  },

  // Admin
  getAllOrders: async (params = {}) => {
    const res = await api.get('/admin/orders', { params });
    return res.data;
  },

  updateOrderStatus: async (id, status, note = '') => {
    const res = await api.patch(`/admin/orders/${id}/status`, { status, note });
    return res.data;
  },

  getAnalytics: async (period = '7') => {
    const res = await api.get('/orders/analytics/summary', { params: { period } });
    return res.data;
  },
};

export default orderService;