"use client";
import React, { useState, useEffect } from "react";
import { Home, TrendingUp, MapPin, Database, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_THEME = {
  background: 'linear-gradient(180deg, #0c1834 0%, #081027 100%)',
  borderBottom: '1px solid rgba(34, 197, 94, 0.28)',
  text: '#dbeafe',
  activeBg: 'rgba(16, 185, 129, 0.3)',
  activeBorder: '2px solid rgba(34, 197, 94, 0.65)',
  hoverBg: 'rgba(34, 197, 94, 0.14)',
  dropdownBg: 'rgba(15, 23, 42, 0.98)',
  dropdownBorder: '1px solid rgba(34, 197, 94, 0.4)',
  dropdownItemActive: 'rgba(34, 197, 94, 0.24)',
};

export default function UserNavbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataDropdownOpen, setDataDropdownOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Detect desktop on mount
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Force close all dropdowns on mount/refresh and set mounted flag
  useEffect(() => {
    // Immediately set all to false
    setMobileMenuOpen(false);
    setDataDropdownOpen(false);
    
    // Small delay to ensure states are set before marking as mounted
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('sidebar-open');
      // Reset desktop dropdown states when mobile menu opens
      setDataDropdownOpen(false);
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [mobileMenuOpen]);

  // Reset navigating state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
    // Close mobile menu and all dropdowns when navigating
    setMobileMenuOpen(false);
    setDataDropdownOpen(false);
  }, [pathname]);

  // Close desktop dropdowns when resizing to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setDataDropdownOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Call on mount
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle navigation with loading state
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (pathname === href) return;
    setIsNavigating(true);
  };

  // Render simple navbar during SSR/initial load to prevent flash
  if (!mounted) {
    return (
      <nav style={{
        width: "100%",
        background: NAV_THEME.background,
        color: NAV_THEME.text,
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        borderBottom: NAV_THEME.borderBottom,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>
        <div style={{
          maxWidth: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 60,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/asset/simpemgu.png"
              alt="SIMPEMGU Logo"
              style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
            />
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>SIMPEMGU</h1>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav style={{
      width: "100%",
      background: NAV_THEME.background,
      color: NAV_THEME.text,
      boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
      borderBottom: NAV_THEME.borderBottom,
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 100,
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: "100%",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: 60,
        position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: "100%" }}>
          <img
            src="/asset/simpemgu.png"
            alt="SIMPEMGU Logo"
            style={{
              width: 35,
              height: 35,
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 2px 8px rgba(10,36,114,0.10)"
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.5, color: "white" }}>SIMPEMGU</span>
        </div>

        {/* Desktop menu centered */}
        <div className="desktop-menu-center" style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
        }}>
          <ul style={{ gap: 4, alignItems: "center", listStyle: "none", margin: 0, padding: 0 }} className="desktop-menu">
            <li>
              <Link 
                href="/" 
                onClick={(e) => handleNavClick(e, "/")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                  background: pathname === "/" ? NAV_THEME.activeBg : "transparent",
                  boxShadow: pathname === "/" ? "0 4px 16px rgba(16,185,129,0.2)" : "none",
                  border: pathname === "/" ? NAV_THEME.activeBorder : "none",
                  transition: "all 0.2s ease",
                  opacity: isNavigating && pathname !== "/" ? 0.5 : 1,
                  cursor: isNavigating ? 'wait' : 'pointer'
                }}
                onMouseOver={e => !isNavigating && (e.currentTarget.style.background = NAV_THEME.hoverBg)}
                onMouseOut={e => !isNavigating && (e.currentTarget.style.background = pathname === "/" ? NAV_THEME.activeBg : "transparent")}
              >
                <Home style={{ width: 18, height: 18 }} />
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard" 
                onClick={(e) => handleNavClick(e, "/dashboard")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                  background: pathname === "/dashboard" ? NAV_THEME.activeBg : "transparent",
                  boxShadow: pathname === "/dashboard" ? "0 4px 16px rgba(16,185,129,0.2)" : "none",
                  border: pathname === "/dashboard" ? NAV_THEME.activeBorder : "none",
                  transition: "all 0.2s ease",
                  opacity: isNavigating && pathname !== "/dashboard" ? 0.5 : 1,
                  cursor: isNavigating ? 'wait' : 'pointer'
                }}
                onMouseOver={e => !isNavigating && (e.currentTarget.style.background = NAV_THEME.hoverBg)}
                onMouseOut={e => !isNavigating && (e.currentTarget.style.background = pathname === "/dashboard" ? NAV_THEME.activeBg : "transparent")}
              >
                <TrendingUp style={{ width: 18, height: 18 }} />
                Dashboard
              </Link>
            </li>
            <li style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setDataDropdownOpen(!dataDropdownOpen);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: dataDropdownOpen ? NAV_THEME.activeBg : "transparent",
                  boxShadow: dataDropdownOpen ? "0 4px 16px rgba(16,185,129,0.2)" : "none",
                  border: dataDropdownOpen ? NAV_THEME.activeBorder : "none",
                  cursor: "pointer",
                  transition: "background 0.2s, border 0.2s, box-shadow 0.2s"
                }}
                onMouseOver={e => e.currentTarget.style.background = NAV_THEME.hoverBg}
                onMouseOut={e => e.currentTarget.style.background = dataDropdownOpen ? NAV_THEME.activeBg : "transparent"}
              >
                <Database style={{ width: 18, height: 18 }} />
                Data
                <ChevronDown style={{ width: 16, height: 16, transition: "transform 0.2s", transform: dataDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
              <div 
                className="desktop-dropdown" 
                data-mounted={mounted ? "true" : "false"}
                style={{
                  visibility: (mounted && dataDropdownOpen) ? 'visible' : 'hidden',
                  opacity: (mounted && dataDropdownOpen) ? 1 : 0,
                  display: (mounted && dataDropdownOpen) ? 'block' : 'none',
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 10,
                  background: NAV_THEME.dropdownBg,
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  minWidth: 220,
                  padding: "10px 0",
                  zIndex: 30,
                  border: NAV_THEME.dropdownBorder
                }}>
                  <Link href="/data/data-rombel" style={{ display: "block", padding: "12px 20px", color: NAV_THEME.text, textDecoration: "none", fontSize: 15, fontWeight: 600, borderRadius: 8, background: pathname === "/data/data-rombel" ? NAV_THEME.dropdownItemActive : "transparent", marginBottom: 6, transition: "background 0.2s" }}>Data Rombel</Link>
                  <Link href="/data/data-guru" style={{ display: "block", padding: "12px 20px", color: NAV_THEME.text, textDecoration: "none", fontSize: 15, fontWeight: 600, borderRadius: 8, background: pathname === "/data/data-guru" ? NAV_THEME.dropdownItemActive : "transparent", marginBottom: 6, transition: "background 0.2s" }}>Data Guru</Link>
                  <Link href="/data/data-siswa" style={{ display: "block", padding: "12px 20px", color: NAV_THEME.text, textDecoration: "none", fontSize: 15, fontWeight: 600, borderRadius: 8, background: pathname === "/data/data-siswa" ? NAV_THEME.dropdownItemActive : "transparent", marginBottom: 6, transition: "background 0.2s" }}>Data Siswa</Link>
                  <Link href="/data/rasio-guru-siswa" style={{ display: "block", padding: "12px 20px", color: NAV_THEME.text, textDecoration: "none", fontSize: 15, fontWeight: 600, borderRadius: 8, background: pathname === "/data/rasio-guru-siswa" ? NAV_THEME.dropdownItemActive : "transparent", marginBottom: 6, transition: "background 0.2s" }}>Rasio Guru : Siswa</Link>
                  <Link href="/data/nama-sekolah" style={{ display: "block", padding: "12px 20px", color: NAV_THEME.text, textDecoration: "none", fontSize: 15, fontWeight: 600, borderRadius: 8, background: pathname === "/data/nama-sekolah" ? NAV_THEME.dropdownItemActive : "transparent", marginBottom: 6, transition: "background 0.2s" }}>Nama Sekolah</Link>
                  <Link href="/data/jumlah-penduduk" style={{ display: "block", padding: "12px 20px", color: NAV_THEME.text, textDecoration: "none", fontSize: 15, fontWeight: 600, borderRadius: 8, background: pathname === "/data/jumlah-penduduk" ? NAV_THEME.dropdownItemActive : "transparent", marginBottom: 0, transition: "background 0.2s" }}>Jumlah Penduduk</Link>
                </div>
            </li>

            <li>
              <Link 
                href="/peta" 
                onClick={(e) => handleNavClick(e, "/peta")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                  background: pathname === "/peta" ? NAV_THEME.activeBg : "transparent",
                  boxShadow: pathname === "/peta" ? "0 4px 16px rgba(16,185,129,0.2)" : "none",
                  border: pathname === "/peta" ? NAV_THEME.activeBorder : "none",
                  transition: "all 0.2s ease",
                  opacity: isNavigating && pathname !== "/peta" ? 0.5 : 1,
                  cursor: isNavigating ? 'wait' : 'pointer'
                }}
                onMouseOver={e => !isNavigating && (e.currentTarget.style.background = NAV_THEME.hoverBg)}
                onMouseOut={e => !isNavigating && (e.currentTarget.style.background = pathname === "/peta" ? NAV_THEME.activeBg : "transparent")}
              >
                <MapPin style={{ width: 18, height: 18 }} />
                Peta
              </Link>
            </li>
          </ul>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", height: "100%" }}>
        {/* Hamburger button for mobile - moved to right */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="hamburger-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        </div>

        {/* Mobile menu sidebar - slide from right */}
        <>
          {/* Sidebar */}
          {!isDesktop && (
            <div 
              className="mobile-sidebar"
              data-mounted={mounted ? "true" : "false"}
              style={{
                position: 'fixed',
                top: 0,
                bottom: 0,
                right: mobileMenuOpen ? 0 : '-100%',
                width: '85%',
                maxWidth: '320px',
                background: NAV_THEME.background,
                zIndex: 1000,
                overflowY: 'auto',
                padding: '20px 0',
                boxSizing: 'border-box',
              boxShadow: '-2px 0 10px rgba(0,0,0,0.3)',
              transition: 'right 0.3s ease',
            }}
          >
            {/* Sidebar Header */}
            <div style={{ 
              padding: '0 20px 20px 20px',
              borderBottom: NAV_THEME.borderBottom,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: NAV_THEME.activeBg,
                  border: NAV_THEME.activeBorder,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "white",
                }}>SM</div>
                <span style={{ fontWeight: 700, fontSize: 20, color: "white" }}>SIMPEMGU</span>
              </div>
            </div>

            <div style={{ padding: '0 15px' }}>
              {/* Home */}
              <Link 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 20px",
                  color: "white",
                  textDecoration: "none",
                  fontSize: 18,
                  fontWeight: 600,
                  background: pathname === "/" ? NAV_THEME.activeBg : "transparent",
                  borderRadius: 0,
                  marginBottom: 8,
                }}
              >
                <Home style={{ width: 22, height: 22, marginRight: 12 }} />
                Home
              </Link>

              {/* Dashboard */}
              <Link 
                href="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 20px",
                  color: "white",
                  textDecoration: "none",
                  fontSize: 18,
                  fontWeight: 600,
                  background: pathname === "/dashboard" ? NAV_THEME.activeBg : "transparent",
                  borderRadius: 0,
                  marginBottom: 8,
                }}
              >
                <TrendingUp style={{ width: 22, height: 22, marginRight: 12 }} />
                Dashboard
              </Link>

              {/* Data BPS Accordion */}
              <div style={{ marginBottom: 8 }}>
                <button
                  className="mobile-dropdown-btn"
                  onClick={() => setDataDropdownOpen(!dataDropdownOpen)}
                  style={{
                    width: '100%',
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    color: "white",
                    background: "transparent",
                    border: 'none',
                    textDecoration: "none",
                    fontSize: 18,
                    fontWeight: 600,
                    borderRadius: 0,
                    cursor: 'pointer',
                  } as React.CSSProperties}
                >
                  <div className="mobile-dropdown-content" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' } as React.CSSProperties}>
                    <Database style={{ width: 22, height: 22, marginRight: 12 }} />
                    Data
                  </div>
                  <ChevronDown style={{ 
                    width: 20, 
                    height: 20,
                    transition: "transform 0.3s ease",
                    transform: dataDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    flexShrink: 0
                  }} />
                </button>
                {mounted && dataDropdownOpen && (
                  <div style={{ paddingLeft: 20, marginTop: 8 }}>
                    <Link 
                      href="/data/data-rombel"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "12px 20px",
                        color: "white",
                        textDecoration: "none",
                        fontSize: 16,
                        background: pathname === "/data/data-rombel" ? NAV_THEME.activeBg : "transparent",
                        borderRadius: 0,
                        marginBottom: 6,
                      }}
                    >
                      Data Rombel
                    </Link>
                    <Link 
                      href="/data/data-guru"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "12px 20px",
                        color: "white",
                        textDecoration: "none",
                        fontSize: 16,
                        background: pathname === "/data/data-guru" ? NAV_THEME.activeBg : "transparent",
                        borderRadius: 0,
                        marginBottom: 6,
                      }}
                    >
                      Data Guru
                    </Link>
                    <Link 
                      href="/data/data-siswa"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "12px 20px",
                        color: "white",
                        textDecoration: "none",
                        fontSize: 16,
                        background: pathname === "/data/data-siswa" ? NAV_THEME.activeBg : "transparent",
                        borderRadius: 0,
                        marginBottom: 6,
                      }}
                    >
                      Data Siswa
                    </Link>
                    <Link 
                      href="/data/rasio-guru-siswa"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "12px 20px",
                        color: "white",
                        textDecoration: "none",
                        fontSize: 16,
                        background: pathname === "/data/rasio-guru-siswa" ? NAV_THEME.activeBg : "transparent",
                        borderRadius: 0,
                        marginBottom: 6,
                      }}
                    >
                      Rasio Guru : Siswa
                    </Link>
                    <Link 
                      href="/data/nama-sekolah"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "12px 20px",
                        color: "white",
                        textDecoration: "none",
                        fontSize: 16,
                        background: pathname === "/data/nama-sekolah" ? NAV_THEME.activeBg : "transparent",
                        borderRadius: 0,
                        marginBottom: 6,
                      }}
                    >
                      Nama Sekolah
                    </Link>
                    <Link 
                      href="/data/jumlah-penduduk"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "12px 20px",
                        color: "white",
                        textDecoration: "none",
                        fontSize: 16,
                        background: pathname === "/data/jumlah-penduduk" ? NAV_THEME.activeBg : "transparent",
                        borderRadius: 0,
                      }}
                    >
                      Jumlah Penduduk
                    </Link>
                  </div>
                )}
              </div>

              {/* Clustering Menu */}
              <Link 
                href="/peta"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 20px",
                  color: "white",
                  textDecoration: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  background: pathname === "/peta" ? NAV_THEME.activeBg : "transparent",
                  borderRadius: 0,
                  marginBottom: 8,
                }}
              >
                <MapPin style={{ width: 20, height: 20 }} />
                Peta
              </Link>

            </div>
          </div>
          )}
        </>
      </div>

      {/* Responsive CSS */}
      <style jsx>{`
        .desktop-menu {
          display: flex;
        }
        
        .hamburger-btn {
          display: none !important;
        }
        
        @media (max-width: 1024px) {
          .desktop-menu-center {
            display: none !important;
          }
          .desktop-menu {
            display: none !important;
          }
          .desktop-dropdown {
            display: none !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
        }
        @media (min-width: 1025px) {
          .desktop-menu-center {
            display: block !important;
          }
          .mobile-sidebar {
            display: none !important;
            visibility: hidden !important;
          }
        }

        /* Smooth scrollbar for sidebar */
        .mobile-sidebar::-webkit-scrollbar {
          width: 6px;
        }
        .mobile-sidebar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
        }
        .mobile-sidebar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }

        /* Prevent body scroll when sidebar open */
        :global(body.sidebar-open) {
          overflow: hidden;
          position: fixed;
          width: 100%;
        }

        /* Mobile dropdown buttons - force horizontal layout */
        .mobile-dropdown-btn {
          flex-direction: row !important;
        }
        
        .mobile-dropdown-content {
          flex-direction: row !important;
        }
        
        /* Hide hamburger button on desktop (> 1024px) */
        @media (min-width: 1025px) {
          .hamburger-btn {
            display: none !important;
          }
        }
        
        /* Show hamburger button only on mobile (<= 1024px) */
        @media (max-width: 1024px) {
          .hamburger-btn {
            display: flex !important;
          }
        }

        /* CRITICAL: Force hide ALL dropdowns and mobile sidebar on initial page load */
        .desktop-dropdown:not([style*="display: block"]),
        .mobile-sidebar:not([style*="right: 0"]) {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* Ensure hidden state is respected even with inline styles before mounted */
        .desktop-dropdown[data-mounted="false"],
        .mobile-sidebar[data-mounted="false"] {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          transform: translateX(100%) !important;
        }
      `}</style>
    </nav>
  );
}

