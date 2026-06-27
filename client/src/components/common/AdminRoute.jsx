import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import adminService   from '../../services/adminService';

const AdminRoute = ({ children }) => {
  const [status, setStatus] = useState('checking');
  // 'checking' | 'ok' | 'fail'

  useEffect(() => {
    const verify = async () => {
      const adminToken = localStorage.getItem('adminToken');
      const adminData  = localStorage.getItem('admin');

      // No token → fail immediately, no API call needed
      if (!adminToken || !adminData) {
        setStatus('fail');
        return;
      }

      try {
        // Verify token with backend
        await adminService.getMe();
        setStatus('ok');
      } catch (err) {
        // Token invalid
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        setStatus('fail');
      }
    };

    verify();
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🍕</div>
          <LoadingSpinner size="lg" text="Verifying admin access..." />
        </div>
      </div>
    );
  }

  if (status === 'fail') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;