import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subvalue?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subvalue,
  change,
  icon,
  className = '',
}) => {
  return (
    <div className={`bg-surface border border-surface-border rounded-card p-5 shadow-fintech relative overflow-hidden group hover:border-accent/30 transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-tt text-fintech-secondary tracking-wider uppercase font-medium">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-surface-light border border-surface-border flex items-center justify-center text-accent">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-tt-demibold text-fintech-primary tracking-tight">
          {value}
        </span>
        {change && (
          <span className={`text-xs font-tt-demibold px-1.5 py-0.5 rounded ${
            change.isPositive 
              ? 'text-accent bg-accent-muted' 
              : 'text-rose-400 bg-rose-950/40'
          }`}>
            {change.isPositive ? '+' : ''}{change.value}
          </span>
        )}
      </div>

      {subvalue && (
        <p className="text-xs text-fintech-secondary font-tt mt-1">
          {subvalue}
        </p>
      )}
    </div>
  );
};
