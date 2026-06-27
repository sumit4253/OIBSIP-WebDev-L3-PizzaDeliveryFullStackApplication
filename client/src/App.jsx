import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import MainLayout      from './layouts/MainLayout';
import AdminLayout     from './layouts/AdminLayout';
import ProtectedRoute  from './components/common/ProtectedRoute';
import AdminRoute      from './components/common/AdminRoute';
import NotFound        from './components/common/NotFound';

// Auth pages
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import VerifyEmail    from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// User pages
import Home          from './pages/user/Home';
import PizzaList     from './pages/user/PizzaList';
import BuildPizza    from './pages/user/BuildPizza';
import Cart          from './pages/user/Cart';
import Checkout      from './pages/user/Checkout';
import OrderHistory  from './pages/user/OrderHistory';
import OrderTracking from './pages/user/OrderTracking';
import Profile       from './pages/user/Profile';

// Admin pages
import AdminLogin     from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders    from './pages/admin/AdminOrders';
import AdminInventory from './pages/admin/AdminInventory';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontFamily:   'Inter, sans-serif',
            fontSize:     '14px',
            fontWeight:   '500',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />


      <Routes>
        {/* ── Auth Routes ── */}
        <Route path="/login"           element={<Login />}          />
        <Route path="/register"        element={<Register />}       />
        <Route path="/verify-email"    element={<VerifyEmail />}    />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />}  />

        {/* ── User Routes ── */}
        <Route element={<MainLayout />}>
          <Route path="/"      element={<Home />}      />
          <Route path="/menu"  element={<PizzaList />} />
          <Route path="/build" element={<BuildPizza />}/>
          <Route path="/cart"  element={<Cart />}      />
          <Route path="/checkout" element={
            <ProtectedRoute><Checkout /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><OrderHistory /></ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute><OrderTracking /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
        </Route>

        {/* ── Admin Login ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin"       element={<Navigate to="/admin/dashboard" replace />} />

        {/* ── Admin Routes — wrapped individually ── */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminInventory />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminAnalytics />
              </AdminLayout>
            </AdminRoute>
          }
        />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;