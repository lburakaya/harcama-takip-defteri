import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  color?: 'green' | 'amber' | 'red' | 'auto';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

function getAutoColor(value: number): string {
  if (value < 65) return 'bg-accent-green';
  if (value < 90) return 'bg-accent-amber';
  return 'bg-accent-red';
}

const colorMap = {
  green: 'bg-accent-green',
  amber: 'bg-accent-amber',
  red: 'bg-accent-red',
  auto: '',
};

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  color = 'auto',
  size = 'md',
  showLabel = false,
  label,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const barColor = color === 'auto' ? getAutoColor(clampedValue) : colorMap[color];

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showLabel && (
            <span className="text-xs font-medium text-text-primary">%{clampedValue.toFixed(1)}</span>
          )}
        </div>
      )}
      <div className={`w-full bg-bg-hover rounded-full overflow-hidden ${sizeMap[size]}`}>
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
