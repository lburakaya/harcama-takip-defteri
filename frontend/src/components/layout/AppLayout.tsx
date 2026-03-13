import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, BottomNav, MenuToggle } from './Sidebar';
import { TopBar } from './TopBar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/table': 'Aylık Tablo',
  '/documents': 'Dökümanlar',
  '/analysis': 'AI Analiz',
  '/reports': 'Raporlar',
  '/settings': 'Ayarlar',
};

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 768 && width < 1280) {
        setCollapsed(true);
      } else if (width >= 1280) {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const title = pageTitles[location.pathname] || '';

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <div className="flex items-center gap-2 px-4 md:px-0">
          <div className="md:hidden py-3">
            <MenuToggle onClick={() => setMobileOpen(true)} />
          </div>
          <div className="flex-1">
            <TopBar title={title} />
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
