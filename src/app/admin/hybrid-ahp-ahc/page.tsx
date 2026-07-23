'use client';

import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../components/SidebarContext';
import ClusteringPendudukUserPage from '../../data/clustering-penduduk/ClusteringPendudukPage';

type TabType = 'overview' | 'districts' | 'demographics' | 'growth' | 'map' | 'data' | 'statistics' | 'profile' | 'hybrid-ahp-ahc';

export default function AdminHybridAHPAHCPage() {
  const { isSidebarOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState<TabType>('hybrid-ahp-ahc');

  // Hook untuk detect mobile
  function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(false);
    
    React.useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth <= 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    return isMobile;
  }

  const isMobile = useIsMobile();

  return (
    <div className="admin-page-zoom" style={{ 
      minHeight: '100vh',
      background: '#ffffff'
    }}>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        <Sidebar  />
        <main style={{ 
          marginLeft: isMobile ? '0' : (isSidebarOpen ? '260px' : '64px'), 
          flex: 1, 
          padding: 0,
          transition: 'margin-left 0.3s ease-in-out',
          background: '#ffffff'
        }}>
          {/* Display the clustering penduduk page content */}
          <div style={{ 
            padding: isMobile ? '16px' : '32px 16px',
            paddingTop: isMobile ? '80px' : '0'
          }}>
            <ClusteringPendudukUserPage showChrome={false} />
          </div>
        </main>
      </div>
    </div>
  );
}
