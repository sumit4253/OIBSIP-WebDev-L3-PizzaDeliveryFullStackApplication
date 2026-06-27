import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import authService from '../../services/authService';
import { validators } from '../../utils/validators';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email    = location.state?.email || '';

  const [step,     setStep]     = useState(1);  // 1: OTP, 2: New password
  const [otp,      setOtp]      = useState(['', '', '', '', '', '']);
  const [newPass,  setNewPass]  = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const inputRefs = useRef([]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { toast.error('Enter all 6 digits'); return; }

    setLoading(true);
    try {
      await authService.verifyResetOTP({ email, otp: otpStr });
      setStep(2);
      toast.success('OTP verified! Set your new password.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const passErr    = validators.password(newPass);
    const confirmErr = newPass !== confirm ? 'Passwords do not match' : '';
    setErrors({ password: passErr, confirm: confirmErr });
    if (passErr || confirmErr) return;

    setLoading(true);
    try {
      await authService.resetPassword({ email, otp: otp.join(''), newPassword: newPass });
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
            <span className="text-3xl">{step === 1 ? '🔑' : '🔒'}</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            {step === 1 ? 'Enter OTP' : 'New Password'}
          </h1>
          <p className="text-gray-500 mt-2">
            {step === 1
              ? `OTP sent to ${email}`
              : 'Choose a strong password'}
          </p>
        </div>

        <div className="card p-8">
          {step === 1 ? (
            <>
              <div className="flex justify-center gap-3 mb-8">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`w-12 h-12 text-center text-xl font-bold rounded-xl border-2 transition-all ${
                      digit ? 'border-orange-500 bg-orange-50' : 'border-gray-200 focus:border-orange-400'
                    }`}
                  />
                ))}
              </div>
              <button onClick={handleVerifyOTP} disabled={loading} className="btn-primary w-full btn-lg">
                {loading ? 'Verifying...' : 'Verify OTP →'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="form-group">
                <label className="input-label">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Min 6 chars, upper, lower, number"
                    className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="input-error-msg">{errors.password}</p>}
              </div>

              <div className="form-group">
                <label className="input-label">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className={`input-field ${errors.confirm ? 'input-error' : ''}`}
                />
                {errors.confirm && <p className="input-error-msg">{errors.confirm}</p>}
              </div>

              <button onClick={handleResetPassword} disabled={loading} className="btn-primary w-full btn-lg">
                {loading ? 'Resetting...' : '🔒 Reset Password'}
              </button>
            </div>
          )}

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;