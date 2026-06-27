import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, subtitle, icon, color = 'orange', trend, trendValue }) => {
  const colors = {
    orange: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100'  },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100'   },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100'    },
  };

  const c = colors[color] || colors.orange;

  return (
    <div className={`card p-5 border ${c.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-display font-bold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>
          )}
          {trendValue !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up'
                ? <TrendingUp size={12} />
                : <TrendingDown size={12} />
              }
              {trendValue}% vs last period
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon} text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;