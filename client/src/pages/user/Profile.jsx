import { useState } from 'react';
import { User, Lock, MapPin, Camera, Save } from 'lucide-react';
import useAuth       from '../../hooks/useAuth';
import authService   from '../../services/authService';
import { validators } from '../../utils/validators';
import toast         from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading,   setLoading]   = useState(false);

  const [profileForm, setProfileForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
    address: {
      street:   user?.address?.street   || '',
      city:     user?.address?.city     || '',
      state:    user?.address?.state    || '',
      pincode:  user?.address?.pincode  || '',
      landmark: user?.address?.landmark || '',
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setProfileForm((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveProfile = async () => {
    const newErrors = {};
    const nameErr  = validators.name(profileForm.name);
    const phoneErr = validators.phone(profileForm.phone);
    if (nameErr)  newErrors.name  = nameErr;
    if (phoneErr) newErrors.phone = phoneErr;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await authService.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const newErrors = {};
    if (!passwordForm.currentPassword) newErrors.currentPassword = 'Current password required';
    const passErr = validators.password(passwordForm.newPassword);
    if (passErr) newErrors.newPassword = passErr;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword:     passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(true);
    try {
      const res = await authService.uploadAvatar(formData);
      updateUser({ ...user, avatar: res.data.avatar });
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile',  label: 'Profile',  icon: <User size={16} />   },
    { id: 'address',  label: 'Address',  icon: <MapPin size={16} /> },
    { id: 'security', label: 'Security', icon: <Lock size={16} />   },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-pizza text-white py-10">
        <div className="container-custom">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white/30">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-gray-50 transition-colors">
                <Camera size={14} className="text-orange-500" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div>
              <h1 className="text-2xl font-display font-bold">{user?.name}</h1>
              <p className="text-orange-200 text-sm mt-0.5">{user?.email}</p>
              {user?.isEmailVerified && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full mt-2">
                  ✅ Email Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 max-w-3xl">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setErrors({}); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card p-6 animate-fade-in">
          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Personal Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="input-label">Full Name *</label>
                  <input
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className={`input-field ${errors.name ? 'input-error' : ''}`}
                  />
                  {errors.name && <p className="input-error-msg">{errors.name}</p>}
                </div>
                <div className="form-group">
                  <label className="input-label">Phone Number</label>
                  <input
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="9876543210"
                    className={`input-field ${errors.phone ? 'input-error' : ''}`}
                  />
                  {errors.phone && <p className="input-error-msg">{errors.phone}</p>}
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Email Address</label>
                <input
                  value={user?.email}
                  disabled
                  className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
                />
                <p className="input-hint">Email cannot be changed</p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* ── Address Tab ── */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Default Address</h2>

              <div className="form-group">
                <label className="input-label">Street Address</label>
                <input
                  name="address.street"
                  value={profileForm.address.street}
                  onChange={handleProfileChange}
                  placeholder="House No, Street, Area"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="input-label">Landmark</label>
                <input
                  name="address.landmark"
                  value={profileForm.address.landmark}
                  onChange={handleProfileChange}
                  placeholder="Near park..."
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="input-label">City</label>
                  <input
                    name="address.city"
                    value={profileForm.address.city}
                    onChange={handleProfileChange}
                    placeholder="Mumbai"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">State</label>
                  <input
                    name="address.state"
                    value={profileForm.address.state}
                    onChange={handleProfileChange}
                    placeholder="Maharashtra"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Pincode</label>
                  <input
                    name="address.pincode"
                    value={profileForm.address.pincode}
                    onChange={handleProfileChange}
                    placeholder="400001"
                    maxLength={6}
                    className="input-field"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Change Password</h2>

              <div className="form-group">
                <label className="input-label">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Your current password"
                  className={`input-field ${errors.currentPassword ? 'input-error' : ''}`}
                />
                {errors.currentPassword && <p className="input-error-msg">{errors.currentPassword}</p>}
              </div>

              <div className="form-group">
                <label className="input-label">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min 6 chars, upper, lower, number"
                  className={`input-field ${errors.newPassword ? 'input-error' : ''}`}
                />
                {errors.newPassword && <p className="input-error-msg">{errors.newPassword}</p>}
              </div>

              <div className="form-group">
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                  className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                />
                {errors.confirmPassword && <p className="input-error-msg">{errors.confirmPassword}</p>}
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                Password must be at least 6 characters with uppercase, lowercase, and a number.
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Lock size={16} />
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;