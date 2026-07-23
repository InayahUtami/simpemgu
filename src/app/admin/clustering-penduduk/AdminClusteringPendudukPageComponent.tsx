'use client';

import React from 'react';
import Sidebar from '../components/Sidebar';
import ProfileMenu from '../components/ProfileMenu';
import { useSidebar } from '../components/SidebarContext';
import ClusteringPendudukUserPage from '../../data/clustering-penduduk/ClusteringPendudukPage';

type TabType = 'overview' | 'districts' | 'demographics' | 'growth' | 'map' | 'data' | 'statistics' | 'profile'  | 'hybrid-ahp-ahc';

export default function AdminClusteringPendudukPageComponent() {
  const { isSidebarOpen } = useSidebar();
  const [activeTab, setActiveTab] = React.useState<TabType>('data');
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="admin-page-zoom" style={{ minHeight: '100vh', background: '#ffffff' }}>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        <Sidebar  />
        <main style={{
          marginLeft: isMobile ? '0' : (isSidebarOpen ? '260px' : '64px'),
          flex: 1,
          padding: isMobile ? '0' : '0',
          transition: 'margin-left 0.3s ease-in-out',
          background: '#ffffff'
        }}>
          {!isMobile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '16px 32px' }}>
              <ProfileMenu />
            </div>
          )}
          <div style={{
            padding: isMobile ? '16px' : '32px 16px',
            paddingTop: isMobile ? '80px' : '0'
          }}>
            <ClusteringPendudukUserPage />
          </div>
        </main>
      </div>
    </div>
  );
}
