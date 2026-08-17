import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'navy' | 'slate' | 'amber' | 'rose';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'navy',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variantStyles = {
    emerald: 'bg-accent-muted text-accent border border-accent/20',
    navy: 'bg-surface-light text-fintech-primary border border-surface-border',
    slate: 'bg-surface text-fintech-secondary border border-surface-border',
    amber: 'bg-amber-950/40 text-amber-300 border border-amber-800/30',
    rose: 'bg-rose-950/40 text-rose-300 border border-rose-800/30',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-tt-demibold font-semibold rounded-md uppercase tracking-wider ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
