'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from './SidebarContext';

const Navbar: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <nav style={{
      width: isMobile ? '100%' : (isSidebarOpen ? 'calc(100% - 260px)' : 'calc(100% - 64px)'),
      background: 'linear-gradient(90deg, #1e40af, #2563eb, #1e3a8a)',
      color: 'white',
      padding: isMobile ? '12px 16px' : '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'fixed',
      top: 0,
      left: isMobile ? 0 : (isSidebarOpen ? '260px' : '64px'),
      right: 0,
      zIndex: 1000,
      boxShadow: '0 5px 14px rgba(30, 58, 138, 0.28)',
      transition: 'left 0.3s, width 0.3s'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: isMobile ? '16px' : '18px' }}>
        Admin Dashboard
      </div>
      {!isMobile && (
        <ul style={{ display: 'flex', gap: '24px', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><a href="/admin/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</a></li>
          <li><a href="/admin/dashboard/profile" style={{ color: 'white', textDecoration: 'none' }}>Profil</a></li>
        </ul>
      )}
    </nav>
  );
};

export default Navbar;

