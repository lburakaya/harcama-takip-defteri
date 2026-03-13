import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddings = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className = '', hover = false, padding = 'md', onClick }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { scale: 1.01, borderColor: 'rgba(0, 217, 126, 0.2)' } : undefined}
      onClick={onClick}
      className={`
        bg-bg-card border border-border-custom rounded-2xl
        ${paddings[padding]}
        ${hover ? 'cursor-pointer transition-colors hover:border-accent-green/20' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

// Stat card variant for dashboard
interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  subtitle?: string;
}

export function StatCard({ title, value, icon, change, subtitle }: StatCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-muted uppercase tracking-wider">{title}</span>
          <motion.span
            className="text-2xl font-display font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            {value}
          </motion.span>
          {change !== undefined && (
            <span className={`text-xs font-medium ${change >= 0 ? 'text-accent-red' : 'text-accent-green'}`}>
              {change >= 0 ? '↑' : '↓'} %{Math.abs(change).toFixed(1)} geçen aya göre
            </span>
          )}
          {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
        </div>
        <div className="p-2.5 bg-accent-green/10 rounded-xl text-accent-green text-xl">
          {icon}
        </div>
      </div>
    </Card>
  );
}
