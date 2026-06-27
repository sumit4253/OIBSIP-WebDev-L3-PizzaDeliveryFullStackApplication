import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto min-h-screen">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* Support both children (from App.jsx) and Outlet (nested routes) */}
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;