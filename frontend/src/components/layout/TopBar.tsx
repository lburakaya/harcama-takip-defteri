import { Bell } from '@phosphor-icons/react';
import { useRealTime } from '../../hooks/useRealTime';
import { useAuthStore } from '../../store/authStore';

interface TopBarProps {
  title?: string;
  onMenuToggle?: () => void;
}

export function TopBar({ title }: TopBarProps) {
  const { realDate, realTime, source } = useRealTime();
  const user = useAuthStore((s) => s.user);

  const formattedDate = realDate
    ? new Date(realDate + 'T00:00:00').toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border-custom bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex flex-col">
        {title && <h1 className="text-xl font-display font-semibold">{title}</h1>}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{formattedDate}</span>
          {realTime && <span>• {realTime}</span>}
          {source === 'fallback' && (
            <span className="text-accent-amber">(yerel saat)</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-bg-hover text-text-secondary transition-colors">
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent-green rounded-full" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
            <span className="text-accent-green text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <span className="text-sm font-medium text-text-primary">
            {user?.firstName}
          </span>
        </div>
      </div>
    </header>
  );
}
