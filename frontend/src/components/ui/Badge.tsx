import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: 'bg-bg-hover text-text-secondary',
  success: 'bg-accent-green/10 text-accent-green',
  warning: 'bg-accent-amber/10 text-accent-amber',
  danger: 'bg-accent-red/10 text-accent-red',
  info: 'bg-blue-500/10 text-blue-400',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${variantStyles[variant]} ${sizeStyles[size]}
      `}
    >
      {children}
    </span>
  );
}
