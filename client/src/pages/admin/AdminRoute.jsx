import { Navigate } from 'react-router-dom';

/**
 * Simple AdminRoute — just checks if adminToken exists in localStorage.
 * The API already verified it during login.
 * If token is expired, api.js interceptor will redirect to /admin/login.
 */
const AdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const adminData  = localStorage.getItem('admin');

  if (!adminToken || !adminData) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;