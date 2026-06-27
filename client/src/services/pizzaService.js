import api from './api';

const pizzaService = {
  getAllPizzas: async (params = {}) => {
    const res = await api.get('/pizzas', { params });
    return res.data;
  },

  getFeaturedPizzas: async () => {
    const res = await api.get('/pizzas/featured');
    return res.data;
  },

  getPizzaById: async (id) => {
    const res = await api.get(`/pizzas/${id}`);
    return res.data;
  },

  createPizza: async (formData) => {
    const res = await api.post('/pizzas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updatePizza: async (id, formData) => {
    const res = await api.put(`/pizzas/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deletePizza: async (id) => {
    const res = await api.delete(`/pizzas/${id}`);
    return res.data;
  },

  togglePizza: async (id) => {
    const res = await api.patch(`/pizzas/${id}/toggle`);
    return res.data;
  },
};

export default pizzaService;