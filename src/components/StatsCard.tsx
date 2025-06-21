import React from 'react';
import { DivideIcon as LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'amber' | 'purple';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-600',
};

export default function StatsCard({ title, value, change, trend, icon: Icon, color }: StatsCardProps) {
  const TrendIcon = trendIcons[trend];
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <div className="flex items-center mt-4">
        <TrendIcon className={`w-4 h-4 ${trendColors[trend]} mr-1`} />
        <span className={`text-sm ${trendColors[trend]} font-medium`}>
          {change}
        </span>
      </div>
    </div>
  );
}