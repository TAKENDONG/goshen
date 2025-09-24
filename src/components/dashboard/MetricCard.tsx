import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'green' | 'blue' | 'amber' | 'red' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  metricType?: 'production' | 'mortality' | 'feeding' | 'sales';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onClick,
  metricType,
}) => {
  const colorClasses = {
    green: 'bg-green-500 text-green-100',
    blue: 'bg-blue-500 text-blue-100',
    amber: 'bg-amber-500 text-amber-100',
    red: 'bg-red-500 text-red-100',
    purple: 'bg-purple-500 text-purple-100',
  };

  const trendColor = trend?.isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all ${
        onClick ? 'hover:shadow-lg hover:scale-105 cursor-pointer hover:border-blue-200' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex items-center space-x-2">
          {trend && (
            <div className={`text-sm font-medium ${trendColor}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
          {onClick && (
            <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              📊 Voir historique
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
        {onClick && (
          <p className="text-xs text-blue-500 opacity-75 mt-2">
            Cliquez pour voir l'historique →
          </p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;