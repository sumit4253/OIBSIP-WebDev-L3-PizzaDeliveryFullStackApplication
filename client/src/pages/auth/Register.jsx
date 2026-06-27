import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Pizza } from 'lucide-react';
import authService from '../../services/authService';
import { validators } from '../../utils/validators';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    newErrors.name     = validators.name(formData.name);
    newErrors.email    = validators.email(formData.email);
    newErrors.password = validators.password(formData.password);
    newErrors.phone    = validators.phone(formData.phone);
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.register(formData);
      toast.success('Registration successful! Please check your email for OTP.');
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
            <span className="text-3xl">🍕</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-2">Join Pizza App and start ordering!</p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="form-group">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`input-field ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && <p className="input-error-msg">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={`input-field ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <p className="input-error-msg">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 chars, uppercase & number"
                  className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="input-error-msg">{errors.password}</p>}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="input-label">Phone Number <span className="text-gray-400 font-normal">(Optional)</span></label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className={`input-field ${errors.phone ? 'input-error' : ''}`}
              />
              {errors.phone && <p className="input-error-msg">{errors.phone}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full btn-lg mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                '🍕 Create Account'
              )}
            </button>
          </form>

          <div className="divider mt-6">
            <span className="text-sm text-gray-400">Already have an account?</span>
          </div>

          <Link to="/login" className="btn-secondary w-full text-center block">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;