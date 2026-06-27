export const ORDER_STATUSES = [
  { value: 'received',         label: 'Order Received',    color: 'gray',   icon: '📋', step: 1 },
  { value: 'preparing',        label: 'Preparing',         color: 'yellow', icon: '👨‍🍳', step: 2 },
  { value: 'in_kitchen',       label: 'In Kitchen',        color: 'orange', icon: '🍕', step: 3 },
  { value: 'ready',            label: 'Ready',             color: 'blue',   icon: '✅', step: 4 },
  { value: 'out_for_delivery', label: 'Out for Delivery',  color: 'purple', icon: '🛵', step: 5 },
  { value: 'delivered',        label: 'Delivered',         color: 'green',  icon: '🎉', step: 6 },
  { value: 'cancelled',        label: 'Cancelled',         color: 'red',    icon: '❌', step: 0 },
];

export const PIZZA_SIZES = [
  { value: 'small',  label: 'Small',  description: '8 inches • 2-3 slices',  multiplier: 1    },
  { value: 'medium', label: 'Medium', description: '10 inches • 4-5 slices', multiplier: 1.5  },
  { value: 'large',  label: 'Large',  description: '12 inches • 6-8 slices', multiplier: 2    },
];

export const PIZZA_CATEGORIES = [
  { value: 'veg',     label: '🥦 Veg',     color: 'green'  },
  { value: 'non-veg', label: '🍗 Non-Veg', color: 'red'    },
  { value: 'vegan',   label: '🌱 Vegan',   color: 'emerald'},
];

export const INVENTORY_CATEGORIES = [
  { value: 'base',      label: 'Pizza Base',  icon: '🫓' },
  { value: 'sauce',     label: 'Sauce',       icon: '🍅' },
  { value: 'cheese',    label: 'Cheese',      icon: '🧀' },
  { value: 'vegetable', label: 'Vegetables',  icon: '🥦' },
  { value: 'topping',   label: 'Toppings',    icon: '🌶️' },
  { value: 'other',     label: 'Other',       icon: '📦' },
];

export const PAYMENT_METHODS = [
  { value: 'razorpay', label: '💳 Pay Online (Razorpay)', description: 'UPI, Cards, Net Banking' },
  { value: 'cod',      label: '💵 Cash on Delivery',      description: 'Pay when delivered'      },
];

export const DELIVERY_FEE     = 40;
export const FREE_DELIVERY_MIN = 500;
export const GST_RATE          = 0.18;