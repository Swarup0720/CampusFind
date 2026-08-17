import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5 font-tt">
      {label && (
        <label className="text-xs font-tt-demibold text-[#FFFFFF] tracking-wide flex items-center justify-between">
          <span>{label}</span>
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-[#01C38D] flex items-center justify-center pointer-events-none z-10">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-[#132D46] text-[#FFFFFF] placeholder-[#696E79] border ${
            error ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-[#696E79]/40 focus:border-[#01C38D] focus:ring-2 focus:ring-[#01C38D]/30'
          } rounded-input ${icon ? 'pl-11' : 'pl-4'} pr-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-inner ${className}`}
          style={{
            backgroundColor: '#132D46',
            color: '#FFFFFF',
          }}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-rose-400 font-tt font-medium">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
