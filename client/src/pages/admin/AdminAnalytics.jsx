import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard      from '../../components/admin/StatsCard';
import adminService   from '../../services/adminService';
import inventoryService from '../../services/inventoryService';
import { formatPrice, formatDateShort, getStatusLabel } from '../../utils/formatter';
import toast from 'react-hot-toast';

// ── Simple Bar Chart (pure CSS) ──
const BarChart = ({ data, valueKey = 'count', labelKey = '_id', title, color = 'orange' }) => {
  if (!data?.length) {
    return (
      <div className="empty-state py-8">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm text-gray-500">No data for this period</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d[valueKey] || 0));

  const colors = {
    orange: 'bg-orange-500',
    green:  'bg-green-500',
    blue:   'bg-blue-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      {title && <h3 className="font-display font-bold text-gray-900 mb-4">{title}</h3>}
      <div className="space-y-3">
        {data.map((item, i) => {
          const value = item[valueKey] || 0;
          const pct   = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 truncate pr-2 max-w-32">
                  {item[labelKey] || 'Unknown'}
                </span>
                <span className="font-bold text-gray-900 flex-shrink-0">{value}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`${colors[color]} h-2.5 rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Daily Revenue Chart (SVG line chart) ──
const RevenueLineChart = ({ data }) => {
  if (!data?.length) {
    return (
      <div className="empty-state py-8">
        <p className="text-3xl mb-2">📈</p>
        <p className="text-sm text-gray-500">No revenue data</p>
      </div>
    );
  }

  const width  = 600;
  const height = 200;
  const pad    = { top: 20, right: 20, bottom: 40, left: 60 };

  const revenues = data.map((d) => d.revenue || 0);
  const maxRev   = Math.max(...revenues, 1);
  const minRev   = 0;

  const xScale = (i) =>
    pad.left + (i / Math.max(data.length - 1, 1)) * (width - pad.left - pad.right);

  const yScale = (v) =>
    pad.top + (1 - (v - minRev) / (maxRev - minRev)) * (height - pad.top - pad.bottom);

  const points = data.map((d, i) => ({
    x: xScale(i),
    y: yScale(d.revenue || 0),
    ...d,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaD = [
    `M ${points[0].x.toFixed(1)} ${(height - pad.bottom).toFixed(1)}`,
    ...points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${points[points.length - 1].x.toFixed(1)} ${(height - pad.bottom).toFixed(1)}`,
    'Z',
  ].join(' ');

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: 300 }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.top + t * (height - pad.top - pad.bottom);
          const v = maxRev * (1 - t);
          return (
            <g key={t}>
              <line
                x1={pad.left} y1={y} x2={width - pad.right} y2={y}
                stroke="#f3f4f6" strokeWidth="1"
              />
              <text
                x={pad.left - 8} y={y + 4}
                textAnchor="end" fontSize="10" fill="#9ca3af"
              >
                ₹{(v / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Line */}
        <path d={pathD} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#f97316" strokeWidth="2" />
            {/* X-axis label */}
            {(i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0) && (
              <text
                x={p.x} y={height - 8}
                textAnchor="middle" fontSize="10" fill="#9ca3af"
              >
                {p._id?.slice(5)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

// ── Donut Chart (CSS) ──
const StatusDonut = ({ data }) => {
  const colors = {
    received:         '#94a3b8',
    preparing:        '#eab308',
    in_kitchen:       '#f97316',
    ready:            '#3b82f6',
    out_for_delivery: '#a855f7',
    delivered:        '#22c55e',
    cancelled:        '#ef4444',
  };

  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <div className="empty-state py-8">
        <p className="text-3xl mb-2">🥧</p>
        <p className="text-sm text-gray-500">No order data</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
        return (
          <div key={item._id} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors[item._id] || '#94a3b8' }}
            />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{getStatusLabel(item._id)}</span>
                <span className="font-semibold text-gray-900">
                  {item.count} <span className="text-gray-400 font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: colors[item._id] || '#94a3b8',
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Main AdminAnalytics ──
const AdminAnalytics = () => {
  const [period,     setPeriod]     = useState('7');
  const [analytics,  setAnalytics]  = useState(null);
  const [lowStock,   setLowStock]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [analyticsRes, lowStockRes] = await Promise.all([
        adminService.getAnalytics(period),
        inventoryService.getLowStock(),
      ]);
      setAnalytics(analyticsRes.data);
      setLowStock(lowStockRes.data?.items || []);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const daily   = analytics?.dailyOrders || [];
  const status  = analytics?.statusBreakdown || [];

  // Calculate revenue trend
  const halfLen     = Math.ceil(daily.length / 2);
  const firstHalf   = daily.slice(0, halfLen).reduce((s, d) => s + (d.revenue || 0), 0);
  const secondHalf  = daily.slice(halfLen).reduce((s, d) => s + (d.revenue || 0), 0);
  const revTrend    = firstHalf > 0
    ? (((secondHalf - firstHalf) / firstHalf) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="subtitle mt-1">Performance insights for your pizza store</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
            {[
              { value: '7',  label: '7D'  },
              { value: '30', label: '30D' },
              { value: '90', label: '90D' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p.value
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 btn-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={summary.totalOrders || 0}
          subtitle={`Last ${period} days`}
          icon="📦"
          color="orange"
        />
        <StatsCard
          title={`Revenue (${period}d)`}
          value={formatPrice(summary.recentRevenue || 0)}
          subtitle={`All time: ${formatPrice(summary.totalRevenue || 0)}`}
          icon="💰"
          color="green"
          trend={revTrend >= 0 ? 'up' : 'down'}
          trendValue={Math.abs(revTrend)}
        />
        <StatsCard
          title="Delivered"
          value={summary.deliveredOrders || 0}
          subtitle={`${summary.totalOrders > 0
            ? ((summary.deliveredOrders / summary.totalOrders) * 100).toFixed(1)
            : 0}% success rate`}
          icon="✅"
          color="blue"
        />
        <StatsCard
          title="Cancelled"
          value={summary.cancelledOrders || 0}
          subtitle={`${summary.totalOrders > 0
            ? ((summary.cancelledOrders / summary.totalOrders) * 100).toFixed(1)
            : 0}% cancellation rate`}
          icon="❌"
          color="red"
        />
      </div>

      {/* ── Revenue Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label:    'Total Revenue (All Time)',
            value:    formatPrice(summary.totalRevenue || 0),
            icon:     '💎',
            bg:       'bg-gradient-to-br from-orange-500 to-red-500',
            text:     'text-white',
          },
          {
            label:    `Revenue (Last ${period} Days)`,
            value:    formatPrice(summary.recentRevenue || 0),
            icon:     '📈',
            bg:       'bg-gradient-to-br from-green-500 to-emerald-600',
            text:     'text-white',
          },
          {
            label:    'Avg Order Value',
            value:    formatPrice(
              summary.deliveredOrders > 0
                ? Math.round(summary.totalRevenue / summary.deliveredOrders)
                : 0
            ),
            icon:     '🎯',
            bg:       'bg-gradient-to-br from-blue-500 to-indigo-600',
            text:     'text-white',
          },
        ].map((card) => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm ${card.text} opacity-80 mb-1`}>{card.label}</p>
                <p className={`text-2xl font-display font-bold ${card.text}`}>{card.value}</p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Daily Revenue Line Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-lg">
              📈 Daily Revenue
            </h2>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              revTrend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {revTrend >= 0
                ? <TrendingUp size={14} />
                : <TrendingDown size={14} />
              }
              {Math.abs(revTrend)}%
            </div>
          </div>
          <RevenueLineChart data={daily} />
        </div>

        {/* Order Status Breakdown */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 text-lg mb-4">
            🥧 Order Status Breakdown
          </h2>
          <StatusDonut data={status} />
        </div>
      </div>

      {/* ── Daily Orders Bar Chart ── */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-gray-900 text-lg mb-4">
          📊 Daily Order Volume
        </h2>
        <div className="space-y-2">
          {daily.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm text-gray-500">No orders in this period</p>
            </div>
          ) : (
            <>
              {/* Mini table */}
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-center">Orders</th>
                      <th className="text-right">Revenue</th>
                      <th>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...daily].reverse().map((day) => {
                      const maxOrders = Math.max(...daily.map((d) => d.count), 1);
                      const pct       = (day.count / maxOrders) * 100;
                      return (
                        <tr key={day._id}>
                          <td className="text-sm font-medium">{formatDateShort(day._id)}</td>
                          <td className="text-center font-bold text-orange-500">{day.count}</td>
                          <td className="text-right font-semibold">{formatPrice(day.revenue)}</td>
                          <td className="w-32">
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-orange-400 h-2 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Low Stock Section ── */}
      {lowStock.length > 0 && (
        <div className="card p-6 border-red-100">
          <h2 className="font-display font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            ⚠️ Inventory Alerts
            <span className="badge-danger badge">{lowStock.length} items</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100"
              >
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {item.category === 'base'       ? '🫓'
                  : item.category === 'sauce'     ? '🍅'
                  : item.category === 'cheese'    ? '🧀'
                  : item.category === 'vegetable' ? '🥦'
                  : '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-red-800 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-red-500">
                    {item.quantity} / {item.threshold} {item.unit}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {item.quantity === 0
                    ? <span className="badge-danger badge">Empty</span>
                    : <span className="badge-warning badge">Low</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;