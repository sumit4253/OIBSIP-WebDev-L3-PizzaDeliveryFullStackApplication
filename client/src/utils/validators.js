export const validators = {
  email: (value) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email';
    return '';
  },

  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
      return 'Password must have uppercase, lowercase and a number';
    return '';
  },

  name: (value) => {
    if (!value || !value.trim()) return 'Name is required';
    if (value.trim().length < 2)  return 'Name must be at least 2 characters';
    if (value.trim().length > 50) return 'Name cannot exceed 50 characters';
    return '';
  },

  phone: (value) => {
    if (!value) return '';   // Phone is optional
    if (!/^[6-9]\d{9}$/.test(value)) return 'Enter a valid 10-digit Indian phone number';
    return '';
  },

  otp: (value) => {
    if (!value) return 'OTP is required';
    if (!/^\d{6}$/.test(value)) return 'OTP must be 6 digits';
    return '';
  },

  required: (value, fieldName = 'This field') => {
    if (!value || !String(value).trim()) return `${fieldName} is required`;
    return '';
  },

  pincode: (value) => {
    if (!value) return 'Pincode is required';
    if (!/^\d{6}$/.test(value)) return 'Enter a valid 6-digit pincode';
    return '';
  },
};