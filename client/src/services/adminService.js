import api from './api';

const adminService = {

  login: async (data) => {
    const res = await api.post('/admin/auth/login', data);

    if (res.data.data?.accessToken) {
      localStorage.setItem('adminToken', res.data.data.accessToken);
      localStorage.setItem('admin', JSON.stringify(res.data.data.admin));
      // Set header immediately so next request uses it
      api.defaults.headers.common['Authorization'] =
        `Bearer ${res.data.data.accessToken}`;
    }

    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/admin/auth/logout');
    } catch (err) {
      // silent
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  getMe: async () => {
    // Manually set admin token before this call
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    }
    const res = await api.get('/admin/auth/me');
    return res.data;
  },

  getAllUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  getUserStats: async () => {
    const res = await api.get('/admin/users/stats');
    return res.data;
  },

  toggleUserStatus: async (id) => {
    const res = await api.patch(`/admin/users/${id}/toggle-status`);
    return res.data;
  },

  getAnalytics: async (period = '7') => {
    const res = await api.get('/admin/orders/analytics', {
      params: { period },
    });
    return res.data;
  },
};

export default adminService;