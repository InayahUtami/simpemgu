"use client";
import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import { Home, BarChart3, Users, User, ChevronDown, Menu, X, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import AdminMobileWrapper from './AdminMobileWrapper';
import { useSidebar } from './SidebarContext';
import ProfileMenu from './ProfileMenu';

const sidebarMenu = [
  { id: 'overview', label: 'Dashboard', icon: Home },
  { id: 'data', label: 'Master Data', icon: BarChart3 },
  { id: 'hybrid-ahp-ahc', label: 'Perhitungan Hybrid AHP-AHC', icon: Calculator },
];

const SIDEBAR_THEME = {
  background: 'linear-gradient(180deg, #0c1834 0%, #081027 100%)',
  border: '1px solid rgba(34, 197, 94, 0.28)',
  text: '#dbeafe',
  textInactive: '#9fb8d4',
  activeBg: 'rgba(16, 185, 129, 0.3)',
  activeGradient: 'linear-gradient(90deg, rgba(34, 197, 94, 0.25), rgba(5, 150, 105, 0.25))',
  hoverBg: 'rgba(34, 197, 94, 0.14)',
  submenuBg: 'rgba(15, 23, 42, 0.45)',
};

type TabType = 'overview' | 'districts' | 'demographics' | 'growth' | 'map' | 'data' | 'statistics' | 'profile'  | 'hybrid-ahp-ahc';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  // Hydration-safe: track mount state and declare all hooks up-front (never conditionally)
  const [mounted, setMounted] = useState(false);
  const [dataDropdownOpen, setDataDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  // Determine dropdown initial state only on client after mount to keep SSR deterministic
  useEffect(() => {
    setMounted(true);
    const clientPath = typeof window !== 'undefined' ? (window.location.pathname ?? '') : pathname;

    // Restore dropdown states from localStorage so they stay open across navigations
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('adminSidebarDropdowns');
        if (stored) {
          const parsed = JSON.parse(stored);
          setDataDropdownOpen(Boolean(parsed.data));
        } else {
          // Fallback: open dropdown based on current route
          if (clientPath.includes('/admin/data')) setDataDropdownOpen(true);
        }
      }
    } catch (err) {
      // If storage parsing fails, fall back to route-based defaults
      if (clientPath.includes('/admin/data')) setDataDropdownOpen(true);
    }

    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run on mount

  // Keep dropdowns open based on current pathname - only open, never close
  useEffect(() => {
    if (!mounted) return;
    const currentPath = pathname ?? '';
    // Auto-open dropdown based on current route (without closing others)
    if (currentPath.includes('/admin/data')) {
      setDataDropdownOpen(prev => prev || true);
    }
  }, [pathname, mounted]);

  // Persist dropdown state so opening submenus doesn't collapse others after navigation.
  // Placed before the mounted guard to keep hook order stable across renders.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('adminSidebarDropdowns', JSON.stringify({
        data: dataDropdownOpen,
      }));
    }
  }, [dataDropdownOpen]);

  // While not mounted, render a deterministic, non-interactive skeleton to avoid
  // hydration mismatches or DOM differences introduced by extensions. All hooks
  // are declared above, so an early return here does not change hook order/count.
  if (!mounted) {
    return (
      <aside
        style={{
          width: isSidebarOpen ? '260px' : '64px',
          background: SIDEBAR_THEME.background,
          boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
          borderRight: SIDEBAR_THEME.border,
          minHeight: '100vh',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: isSidebarOpen ? '32px 0 32px 0' : '32px 0',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 9999,
          overflowY: 'auto',
          transition: 'width 0.3s',
        }}
      >
        {isSidebarOpen && (
          <div className="mb-8 text-xl font-bold" style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '14px', paddingLeft: '32px', fontSize: '16px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#3b82f6',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
            }}>
              <User style={{ width: '32px', height: '32px', color: '#fff' }} />
            </span>
            Admin
          </div>
        )}
        {isSidebarOpen && (
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '32px', paddingRight: '32px' }}>
            <div style={{ height: 12, width: '70%', background: '#1e293b', borderRadius: 8 }} />
            <div style={{ height: 12, width: '50%', background: '#1e293b', borderRadius: 8 }} />
            <div style={{ height: 12, width: '60%', background: '#1e293b', borderRadius: 8 }} />
          </nav>
        )}
      </aside>
    );
  }
  
  // Determine current active tab based on URL
  const getCurrentActiveTab = (): TabType => {
    if ((pathname ?? '').includes('/admin/data')) {
      return 'data';
    } else if ((pathname ?? '').includes('/admin/hybrid-ahp-ahc')) {
      return 'hybrid-ahp-ahc';
    } else if ((pathname ?? '').includes('/admin/dashboard/profile')) {
      return 'profile';
    } else if ((pathname ?? '') === '/admin/dashboard') {
      return 'overview';
    }
    return 'overview';
  };
  
  const currentActiveTab = getCurrentActiveTab();

  const isMainMenuActive = (menuId: string) => {
    if (menuId === 'data') return (pathname ?? '').includes('/admin/data');
    if (menuId === 'hybrid-ahp-ahc') return (pathname ?? '').includes('/admin/hybrid-ahp-ahc');
    return currentActiveTab === menuId;
  };

  const setDropdownStates = (next: { data?: boolean }) => {
    setDataDropdownOpen(prev => next.data ?? prev);
  };

  const isSubmenuActive = (path: string) => {
    return (pathname ?? '') === path;
  };
  const dataRoutes = [
    { label: 'Per Kecamatan', path: '/admin/data/per-kecamatan' },
    { label: 'Jumlah Penduduk', path: '/admin/data/jumlah-penduduk' },
    { label: 'Data Nama Sekolah', path: '/admin/data/data-nama-sekolah' },
    { label: 'Data Guru', path: '/admin/data/data-guru' },
    { label: 'Data Siswa', path: '/admin/data/data-siswa' },
    { label: 'Data Rombel', path: '/admin/data/data-rombel' },
  ];

  return (
    <>
      <AdminMobileWrapper>
        {/* Toggle Button - Desktop Only */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            style={{
              position: 'fixed',
              top: '16px',
              left: isSidebarOpen ? '220px' : '24px',
              zIndex: 10002,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'left 0.3s ease-in-out'
            }}
          >
            {isSidebarOpen ? <ChevronLeft size={20} color="#111827" /> : <ChevronRight size={20} color="#111827" />}
          </button>
        )}

        {/* Mobile Header with Hamburger and Profile Name */}
        {isMobile && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10001,
              background: '#ffffff',
              borderBottom: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {mobileMenuOpen ? <X size={24} color="#111827" /> : <Menu size={24} color="#111827" />}
            </button>
            <ProfileMenu />
          </div>
        )}

      {/* Sidebar */}
      <aside
        style={{
          width: isMobile ? '280px' : (isSidebarOpen ? '260px' : '64px'),
          background: SIDEBAR_THEME.background,
          boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
          borderRight: SIDEBAR_THEME.border,
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? '72px 0 32px 0' : (isSidebarOpen ? '32px 0 32px 0' : '32px 0'),
          position: 'fixed',
          top: 0,
          left: isMobile ? (mobileMenuOpen ? 0 : '-280px') : 0,
          bottom: 0,
          zIndex: 9999,
          overflowY: 'auto',
          boxSizing: 'border-box',
          transition: isMobile ? 'left 0.3s ease-in-out' : 'width 0.3s',
        }}
      onClick={(e) => {
        // Event delegation untuk memastikan klik tertangkap
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        
        if (button && button.textContent) {
          const text = button.textContent;
          
          if (text.includes('Dashboard')) {
            if (isMobile) setMobileMenuOpen(false);
            window.location.href = '/admin/dashboard';
          } else if (text.includes('Profil')) {
            if (isMobile) setMobileMenuOpen(false);
            window.location.href = '/admin/dashboard/profile';
          } else if (text.includes('Perhitungan Hybrid AHP-AHC')) {
            if (isMobile) setMobileMenuOpen(false);
            window.location.href = '/admin/hybrid-ahp-ahc';
          }
        }
      }}
    >
      {(isSidebarOpen && !isMobile) && (
        <div className="mb-8 text-xl font-bold" style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '14px', paddingLeft: '32px', fontSize: '16px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#3b82f6',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          }}>
            <User style={{ width: '32px', height: '32px', color: '#fff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
          </span>
          Admin
        </div>
      )}
      {(isSidebarOpen || isMobile) && (
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sidebarMenu.map(menu => (
            <div key={menu.id} style={{ width: '100%' }}>
              <button
                onClick={() => {
                  if (menu.id === 'data') {
                    setDropdownStates({ data: !dataDropdownOpen });
                  } else {
                    // Saat navigasi ke menu lain, pertahankan state dropdown yang aktif
                    // Hanya tutup dropdown jika user benar-benar ingin menutupnya
                    
                    // Navigasi berdasarkan menu yang diklik - Force reload
                    if (menu.id === 'overview') {
                      window.location.href = '/admin/dashboard';
                    } else if (menu.id === 'profile') {
                      window.location.href = '/admin/dashboard/profile';
                    } else if (menu.id === 'hybrid-ahp-ahc') {
                      window.location.href = '/admin/hybrid-ahp-ahc';
                    }
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  marginLeft: '12px',
                  marginRight: '12px',
                  borderRadius: '12px',
                  fontWeight: isMainMenuActive(menu.id) ? '700' : '500',
                  fontSize: '13px',
                  color: isMainMenuActive(menu.id) ? '#a7f3d0' : SIDEBAR_THEME.textInactive,
                  background: 'transparent',
                  border: isMainMenuActive(menu.id) ? '1px solid #10b981' : '1px solid transparent',
                  borderLeft: isMainMenuActive(menu.id) ? '1px solid #10b981' : '1px solid transparent',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: isMainMenuActive(menu.id)
                    ? '0 8px 18px rgba(16, 185, 129, 0.3)'
                    : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: 'calc(100% - 24px)',
                  pointerEvents: 'auto',
                  transform: isMainMenuActive(menu.id) ? 'translateX(1px)' : 'translateX(0)'
                }}
                onMouseEnter={e => {
                  if (!isMainMenuActive(menu.id)) {
                    e.currentTarget.style.background = SIDEBAR_THEME.hoverBg;
                    e.currentTarget.style.color = '#a7f3d0';
                    e.currentTarget.style.border = '1px solid #10b981';
                    e.currentTarget.style.transform = 'translateX(1px)';
                    e.currentTarget.style.boxShadow = '0 5px 12px rgba(16, 185, 129, 0.2)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isMainMenuActive(menu.id)) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = SIDEBAR_THEME.textInactive;
                    e.currentTarget.style.border = '1px solid transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, textAlign: 'left' }}>
                    {/* Icon dengan background bulat yang elegan */}
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: currentActiveTab === menu.id
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                      transition: 'all 0.3s ease',
                      boxShadow: currentActiveTab === menu.id ? '0 2px 8px rgba(255, 255, 255, 0.1)' : 'none',
                      backdropFilter: currentActiveTab === menu.id ? 'blur(10px)' : 'none',
                      flexShrink: 0
                    }}>
                      <menu.icon
                        style={{
                          width: '20px',
                          height: '20px',
                          color: isMainMenuActive(menu.id) ? '#10b981' : SIDEBAR_THEME.textInactive,
                          filter: isMainMenuActive(menu.id) ? 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))' : 'none'
                        }}
                      />
                    </span>
                    <span style={{ textAlign: 'left', flex: 1 }}>{menu.label}</span>
                  </span>
                  {menu.id === 'data' && mounted && (
                    <ChevronDown 
                      size={18} 
                      style={{
                        marginLeft: 'auto',
                        transition: 'transform 0.3s ease',
                        transform: dataDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: currentActiveTab === menu.id ? '#ffffff' : '#cbd5e1'
                      }}
                    />
                  )}
                </span>
              </button>
              {/* List untuk Data, pindah halaman hanya jika klik item anak */}
              {menu.id === 'data' && dataDropdownOpen && (
                <div style={{ marginLeft: '28px', marginRight: '28px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dataRoutes.map((item) => {
                    const isActive = isSubmenuActive(item.path);
                    return (
                      <button
                        key={item.path}
                        style={{
                          padding: '11px 16px 11px 40px', // padding-left sudah digabung jadi 40px
                          borderRadius: '10px',
                          border: isActive ? '1px solid #10b981' : '1px solid transparent',
                          background: isActive 
                            ? 'rgba(16, 185, 129, 0.14)' 
                            : SIDEBAR_THEME.submenuBg,
                          color: isActive ? '#a7f3d0' : SIDEBAR_THEME.textInactive,
                          fontWeight: isActive ? '600' : '500',
                          fontSize: '13px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          boxShadow: isActive 
                            ? '0 5px 14px rgba(16, 185, 129, 0.4)' 
                            : '0 1px 3px rgba(0, 0, 0, 0.1)',
                          position: 'relative',
                          transform: isActive ? 'translateX(2px)' : 'translateX(0)'
                        }}
                        onClick={() => {
                          router.push(item.path);
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = SIDEBAR_THEME.hoverBg;
                            e.currentTarget.style.color = '#a7f3d0';
                            e.currentTarget.style.border = '1px solid #10b981';
                            e.currentTarget.style.transform = 'translateX(2px)';
                            e.currentTarget.style.boxShadow = '0 5px 14px rgba(16, 185, 129, 0.22)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = SIDEBAR_THEME.submenuBg;
                            e.currentTarget.style.color = SIDEBAR_THEME.textInactive;
                            e.currentTarget.style.border = '1px solid transparent';
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                          }
                        }}
                      >
                        <span style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isActive 
                            ? '#10b981' 
                            : 'rgba(148, 163, 184, 0.5)',
                          transition: 'all 0.3s ease',
                          boxShadow: isActive ? '0 2px 4px rgba(255, 255, 255, 0.3)' : 'none'
                        }}></span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
      {!isSidebarOpen && !isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '32px' }}>
          {sidebarMenu.map(menu => {
            const isActive = isMainMenuActive(menu.id);
            return (
              <button
                key={menu.id}
                title={menu.label}
                onClick={() => {
                  if (menu.id === 'overview') {
                    window.location.href = '/admin/dashboard';
                  } else if (menu.id === 'profile') {
                    window.location.href = '/admin/dashboard/profile';
                  } else if (menu.id === 'data') {
                    window.location.href = '/admin/data/per-kecamatan';
                  } else if (menu.id === 'hybrid-ahp-ahc') {
                    window.location.href = '/admin/hybrid-ahp-ahc';
                  }
                }}
                style={{
                  background: 'transparent',
                  border: isActive ? '1px solid #10b981' : 'none',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  color: isActive ? '#ffffff' : SIDEBAR_THEME.textInactive,
                  fontSize: '22px',
                  transition: 'all 0.2s ease',
                }}
              >
                <menu.icon style={{ width: '24px', height: '24px', color: isActive ? '#ffffff' : SIDEBAR_THEME.textInactive }} />
              </button>
            );
          })}
        </div>
      )}
    </aside>
    </AdminMobileWrapper>
    </>
  );
}

