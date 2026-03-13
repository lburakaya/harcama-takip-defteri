import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBar,
  CalendarBlank,
  FolderOpen,
  Robot,
  ChartLine,
  Gear,
  SignOut,
  List,
  X,
} from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: ChartBar },
  { to: '/table', label: 'Aylık Tablo', icon: CalendarBlank },
  { to: '/documents', label: 'Dökümanlar', icon: FolderOpen },
  { to: '/analysis', label: 'AI Analiz', icon: Robot },
  { to: '/reports', label: 'Raporlar', icon: ChartLine },
  { to: '/settings', label: 'Ayarlar', icon: Gear },
];

interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed = false, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-6 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center">
          <span className="text-bg-primary font-display font-bold text-sm">HT</span>
        </div>
        {!collapsed && (
          <span className="font-display font-semibold text-lg gradient-text">
            Harcama Takip
          </span>
        )}
      </div>

      <div className="h-px bg-border-custom mx-4 mb-2" />

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group
                ${isActive
                  ? 'bg-accent-green/10 text-accent-green'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon
                size={20}
                weight={isActive ? 'fill' : 'regular'}
                className="shrink-0"
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeNav"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-green"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="h-px bg-border-custom mx-4 my-2" />

      {/* User + Logout */}
      <div className="px-3 pb-4">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
              <span className="text-accent-green text-xs font-bold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-text-primary truncate">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-[11px] text-text-muted truncate">{user.email}</span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full
            text-text-muted hover:text-accent-red hover:bg-accent-red/10
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <SignOut size={20} />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col
          bg-bg-secondary border-r border-border-custom
          h-screen sticky top-0
          transition-all duration-300
          ${collapsed ? 'w-16' : 'w-60'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-60 bg-bg-secondary border-r border-border-custom z-50 md:hidden"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-bg-hover text-text-muted"
              >
                <X size={18} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Bottom navigation for mobile
export function BottomNav() {
  const location = useLocation();

  const bottomItems = navItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border-custom z-30 md:hidden">
      <div className="flex items-center justify-around py-2">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-1
                ${isActive ? 'text-accent-green' : 'text-text-muted'}
              `}
            >
              <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile menu toggle button
export function MenuToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-bg-hover text-text-secondary md:hidden"
    >
      <List size={22} />
    </button>
  );
}
