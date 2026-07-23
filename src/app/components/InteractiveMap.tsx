'use client';

import React, { useState, useEffect } from 'react';

interface InteractiveMapProps {
  isAdminPage?: boolean;
}

export default function InteractiveMap({ isAdminPage = false }: InteractiveMapProps) {
  const [adminMode, setAdminMode] = useState(false);
  const defaultLegendData = {
    text: 'Peta Kota Palembang per Kecamatan. Warna menandakan area administrasi.',
    color: '#1e3a8a'
  };
  const [legend, setLegend] = useState(defaultLegendData);
  const [editLegend, setEditLegend] = useState(defaultLegendData);
  const [showNotif, setShowNotif] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ambil data dari API saat pertama render - non-blocking
  React.useEffect(() => {
    const fetchLegend = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 detik timeout

        const response = await fetch('/api/map/legend', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`API legend failed with status: ${response.status}, using default`);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Response was not JSON, using default');
          return;
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setLegend(result.data);
          setEditLegend(result.data);
        }
      } catch (error) {
        // Silently fail and use default
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn('Error fetching legend, using default:', error.message);
        }
      }
    };

    // Delay fetch slightly to allow page to render first
    const timer = setTimeout(() => fetchLegend(), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#1f2937' }}>Peta Kota Palembang</h2>
          {isAdminPage && (
            <button
              onClick={() => setAdminMode(!adminMode)}
              style={{
                padding: isMobile ? '8px 16px' : '10px 20px',
                borderRadius: '8px',
                background: adminMode ? '#1e3a8a' : '#2563eb',
                color: 'white',
                fontWeight: 'bold',
                fontSize: isMobile ? '14px' : '16px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: adminMode ? '0 2px 8px rgba(153,27,65,0.15)' : 'none',
                transition: 'background 0.2s',
              }}
            >
              {adminMode ? 'Keluar Admin Mode' : 'Admin Mode'}
            </button>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '20px' : '32px', 
          alignItems: 'flex-start', 
          justifyContent: 'center', 
          marginTop: 0 
        }}>
          <div style={{ flex: isMobile ? 'none' : 2, minWidth: 0, width: '100%' }}>
            <iframe
              src="https://www.arcgis.com/apps/mapviewer/index.html?webmap=0503dd2786914892878c8715ab2d8a19"
              width="100%"
              height={isMobile ? "400" : "500"}
              style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: isMobile ? '8px' : '12px', 
                background: '#f3f4f6', 
                boxShadow: '0 4px 16px rgba(30,64,175,0.08)',
                display: 'block'
              }}
              title="Peta Kota Palembang ArcGIS"
              allowFullScreen
            />
            <div style={{
              marginTop: '16px',
              textAlign: 'center',
              padding: isMobile ? '10px' : '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              borderRadius: isMobile ? '6px' : '8px',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <p style={{
                fontSize: isMobile ? '12px' : '13px',
                color: '#64748b',
                margin: 0,
                fontWeight: '400',
                fontStyle: 'italic'
              }}>
                Sumber: <a 
                  href="https://www.arcgis.com/apps/mapviewer/index.html?webmap=0503dd2786914892878c8715ab2d8a19" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#3b82f6', 
                    textDecoration: 'none',
                    borderBottom: '1px dotted #3b82f6',
                    fontWeight: '500'
                  }}
                >
                  ArcGIS Web Map
                </a>
              </p>
            </div>
          </div>
          <div style={{ 
            flex: isMobile ? 'none' : 1.2, 
            minWidth: isMobile ? 'auto' : '400px', 
            maxWidth: isMobile ? '100%' : '700px', 
            width: '100%',
            background: '#22c55e', 
            border: '2px solid #22c55e', 
            borderRadius: isMobile ? '12px' : '18px', 
            boxShadow: '0 6px 24px rgba(30,64,175,0.10)', 
            padding: isMobile ? '20px' : '36px 48px'
          }}>
            <h3 style={{ 
              fontSize: isMobile ? '18px' : '22px', 
              fontWeight: 800, 
              color: 'white', 
              marginBottom: isMobile ? '12px' : '16px' 
            }}>
              Informasi Penduduk Palembang
            </h3>
            {legend.text ? (
              <div style={{ 
                fontSize: isMobile ? '14px' : '17px', 
                color: 'white', 
                lineHeight: 1.8, 
                textAlign: 'justify' 
              }}>
                {legend.text}
              </div>
            ) : (
              <div style={{ 
                fontSize: isMobile ? '14px' : '17px', 
                color: 'white', 
                lineHeight: 1.8, 
                textAlign: 'justify', 
                fontStyle: 'italic' 
              }}>
                ...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
