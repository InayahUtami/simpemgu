'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserDashboard from '../User/UserDashboard';
import UserNavbar from '../User/UserNavbar';

export default function DashboardPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Force router refresh to prevent stale content
    router.refresh();
    
    // Mark as ready after refresh
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  // Show loading overlay during initial mount to prevent flash of stale content
  if (!isReady) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#0a2972',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.2)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <>
      <UserNavbar />
      <UserDashboard />
    </>
  );
}

