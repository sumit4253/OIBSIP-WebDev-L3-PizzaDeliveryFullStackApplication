import api from './api';

const paymentService = {
  // Create Razorpay order on backend
  createOrder: async (amount) => {
    const res = await api.post('/payment/create-order', { amount });
    return res.data;
  },

  // Verify payment signature on backend
  verifyPayment: async (data) => {
    const res = await api.post('/payment/verify', data);
    return res.data;
  },

  // Load Razorpay script dynamically
  loadRazorpayScript: () => {
    return new Promise((resolve) => {
      // Check if already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src   = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  // Open Razorpay checkout modal
  openCheckout: (options) => {
    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        ...options,
        handler: (response) => resolve(response),
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user')),
        },
      });
      rzp.on('payment.failed', (response) => {
        reject(new Error(response.error?.description || 'Payment failed'));
      });
      rzp.open();
    });
  },
};

export default paymentService;