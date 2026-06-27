// Format price in Indian Rupees
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
};

// Format date short
export const formatDateShort = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  }).format(new Date(date));
};

// Time ago
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: 'year',   seconds: 31536000 },
    { label: 'month',  seconds: 2592000  },
    { label: 'week',   seconds: 604800   },
    { label: 'day',    seconds: 86400    },
    { label: 'hour',   seconds: 3600     },
    { label: 'minute', seconds: 60       },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
};

// Get order status class
export const getStatusClass = (status) => {
  const map = {
    received:         'status-received',
    preparing:        'status-preparing',
    in_kitchen:       'status-kitchen',
    ready:            'status-ready',
    out_for_delivery: 'status-delivery',
    delivered:        'status-delivered',
    cancelled:        'status-cancelled',
  };
  return map[status] || 'status-received';
};

// Get status label
export const getStatusLabel = (status) => {
  const map = {
    received:         'Order Received',
    preparing:        'Preparing',
    in_kitchen:       'In Kitchen',
    ready:            'Ready',
    out_for_delivery: 'Out for Delivery',
    delivered:        'Delivered',
    cancelled:        'Cancelled',
  };
  return map[status] || status;
};

// Truncate text
export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

// Get image URL
export const getImageUrl = (image) => {
  if (!image) return '/placeholder-pizza.jpg';
  if (image.startsWith('http')) return image;
  return `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${image}`;
};