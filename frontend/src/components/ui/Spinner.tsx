interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeMap[size]}
          border-2 border-border-custom border-t-accent-green
          rounded-full animate-spin
        `}
      />
    </div>
  );
}

// Full page loader
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <span className="text-sm text-text-muted">Yükleniyor...</span>
      </div>
    </div>
  );
}
