import api from './api';

const authService = {
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  verifyEmail: async (data) => {
    const res = await api.post('/auth/verify-email', data);
    if (res.data.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  resendOTP: async (email) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  },

  login: async (data) => {
    const res = await api.post('/auth/login', data);
    if (res.data.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  // ← ADD THIS
  refreshToken: async () => {
    const res = await api.post('/auth/refresh-token');
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Silently fail
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  verifyResetOTP: async (data) => {
    const res = await api.post('/auth/verify-reset-otp', data);
    return res.data;
  },

  resetPassword: async (data) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/users/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/users/profile', data);
    return res.data;
  },

  changePassword: async (data) => {
    const res = await api.put('/users/change-password', data);
    return res.data;
  },

  uploadAvatar: async (formData) => {
    const res = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default authService;