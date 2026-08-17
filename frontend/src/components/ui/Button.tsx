import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent-outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-tt-demibold transition-all duration-200 rounded-input focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs font-semibold",
    md: "px-4.5 py-2.5 text-sm font-bold",
    lg: "px-6 py-3.5 text-base font-extrabold tracking-wide",
  };

  const variantStyles = {
    primary: "bg-[#01C38D] hover:bg-[#00AB7B] text-[#191E29] shadow-[0_4px_16px_rgba(1,195,141,0.35)] hover:shadow-[0_6px_22px_rgba(1,195,141,0.55)]",
    secondary: "bg-[#132D46] hover:bg-[#1A3B5C] text-[#FFFFFF] border border-[#696E79]/40 hover:border-[#01C38D]/60 shadow-sm",
    'accent-outline': "bg-transparent hover:bg-[#01C38D]/10 text-[#01C38D] border border-[#01C38D] shadow-sm",
    ghost: "bg-transparent hover:bg-[#132D46] text-[#696E79] hover:text-[#FFFFFF]",
    danger: "bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800/60 shadow-sm",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
