import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, UserCheck, UserX, Mail, Phone, Calendar } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import adminService   from '../../services/adminService';
import { formatDate, formatDateShort } from '../../utils/formatter';
import toast from 'react-hot-toast';

// ── User Detail Modal ──
const UserDetailModal = ({ user, onClose, onToggle }) => {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await adminService.toggleUserStatus(user._id);
      onToggle(user._id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      onClose();
    } catch (err) {
      toast.error('Failed to update user status');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-pizza flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-900 text-lg">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {user.isActive ? '🟢 Active' : '🔴 Inactive'}
                </span>
                {user.isEmailVerified && (
                  <span className="badge badge-info">✅ Verified</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {[
            { icon: <Mail size={16} />,     label: 'Email',   value: user.email               },
            { icon: <Phone size={16} />,    label: 'Phone',   value: user.phone || '—'         },
            { icon: <Calendar size={16} />, label: 'Joined',  value: formatDate(user.createdAt)},
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 flex-shrink-0">
                {row.icon}
              </div>
              <div>
                <p className="text-xs text-gray-400">{row.label}</p>
                <p className="font-medium text-gray-800">{row.value}</p>
              </div>
            </div>
          ))}

          {user.address?.city && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="text-xs text-gray-400 mb-1">📍 Address</p>
              <p className="text-gray-700">
                {user.address.street && `${user.address.street}, `}
                {user.address.city}, {user.address.state} - {user.address.pincode}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Close</button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex-1 ${user.isActive ? 'btn-danger' : 'btn-success'}`}
          >
            {toggling ? 'Updating...' : user.isActive ? '🚫 Deactivate' : '✅ Activate'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main AdminUsers ──
const AdminUsers = () => {
  const [users,       setUsers]       = useState([]);
  const [userStats,   setUserStats]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 });
  const [filter,      setFilter]      = useState('all');
  // filter: 'all' | 'active' | 'inactive' | 'unverified'

  const fetchUsers = useCallback(async (page = 1, showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminService.getAllUsers({ page, limit: 10, search }),
        adminService.getUserStats(),
      ]);
      setUsers(usersRes.data || []);
      setPagination(usersRes.pagination || { page: 1, pages: 1, total: 0 });
      setUserStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleToggleStatus = (userId) => {
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, isActive: !u.isActive } : u
      )
    );
  };

  // Filter users locally
  const filteredUsers = users.filter((u) => {
    if (filter === 'active')     return u.isActive;
    if (filter === 'inactive')   return !u.isActive;
    if (filter === 'unverified') return !u.isEmailVerified;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading users..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="subtitle mt-1">{pagination.total} registered users</p>
        </div>
        <button
          onClick={() => fetchUsers(1, true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 btn-sm"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users',      value: userStats.total,        icon: '👥', color: 'bg-blue-50   text-blue-700'   },
            { label: 'Active',           value: userStats.active,       icon: '🟢', color: 'bg-green-50  text-green-700'  },
            { label: 'Verified Email',   value: userStats.verified,     icon: '✅', color: 'bg-purple-50 text-purple-700' },
            { label: 'New This Month',   value: userStats.newThisMonth, icon: '🆕', color: 'bg-orange-50 text-orange-700' },
          ].map((stat) => (
            <div key={stat.label} className={`card p-4 ${stat.color}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                  <p className="text-xs opacity-75">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { value: 'all',        label: 'All'       },
              { value: 'active',     label: '🟢 Active'  },
              { value: 'inactive',   label: '🔴 Inactive'},
              { value: 'unverified', label: '📧 Unverified'},
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filter === f.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="card overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="empty-state py-16">
            <p className="text-5xl mb-4">👥</p>
            <p className="empty-state-title">No users found</p>
            <p className="empty-state-text">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Email Verified</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-pizza flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate max-w-40">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">{user.phone || '—'}</td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.isEmailVerified ? 'badge-info' : 'badge-warning'}`}>
                          {user.isEmailVerified ? '✅ Yes' : '⏳ No'}
                        </span>
                      </td>
                      <td className="text-xs text-gray-400">
                        {formatDateShort(user.createdAt)}
                      </td>
                      <td>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await adminService.toggleUserStatus(user._id);
                                handleToggleStatus(user._id);
                                toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
                              } catch {
                                toast.error('Failed to update');
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isActive
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-green-500 hover:bg-green-50'
                            }`}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive
                              ? <UserX size={15} />
                              : <UserCheck size={15} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchUsers(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="btn-secondary btn-sm disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => fetchUsers(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="btn-secondary btn-sm disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggle={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default AdminUsers;