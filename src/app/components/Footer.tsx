"use client";

import Image from 'next/image';
import React from 'react';

export default function Footer() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <footer className="footer-container" style={{
      background: '#ffffff',
      borderTop: '1px solid #e5e7eb',
      marginTop: 'auto',
      position: 'relative',
      width: '100%'
    }}>

      <div style={{
        maxWidth: isMobile ? '100%' : '1280px',
        margin: '0 auto',
        padding: isMobile ? '0' : '0 20px'
      }}>
        {/* Partner Logos Section - Professional Layout */}
        <div style={{
          paddingTop: isMobile ? '16px' : '20px',
          paddingBottom: isMobile ? '16px' : '20px',
          borderRadius: 0,
          overflow: 'visible'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: isMobile ? '16px' : '24px',
            padding: isMobile ? '0 16px' : '0'
          }}>
            <h4 style={{
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: '600',
              color: '#64748b',
              margin: isMobile ? '0 0 16px 0' : '0 0 24px 0',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
            }}>
              Supported By
            </h4>
            <div style={{
              width: isMobile ? '60px' : '80px',
              height: '3px',
              background: 'linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%)',
              margin: '0 auto'
            }} />
          </div>

          {/* Logo Grid - Fully Responsive Layout */}
          <div className="footer-logo-grid" style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            maxWidth: isMobile ? '100%' : '1200px',
            margin: '0 auto',
            alignItems: 'center',
            gap: isMobile ? '0' : '0'
          }}>
            {/* Universitas Bina Darma */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? '8px' : '12px',
              padding: isMobile ? '12px 16px' : '16px',
              transition: 'transform 0.3s ease',
              cursor: 'pointer',
              borderBottom: isMobile ? '1px solid #f1f5f9' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) e.currentTarget.style.transform = 'translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              if (!isMobile) e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{
                width: isMobile ? '80px' : '100px',
                height: isMobile ? '80px' : '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Image
                  src="/asset/ubd.png"
                  alt="Universitas Bina Darma"
                  width={isMobile ? 80 : 100}
                  height={isMobile ? 80 : 100}
                  style={{
                    objectFit: 'contain',
                    filter: 'grayscale(0%)',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
              <div style={{
                textAlign: 'center',
                width: '100%'
              }}>
                <h5 style={{
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: '600',
                  color: '#334155',
                  margin: '0 0 4px 0',
                  lineHeight: '1.3',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
                }}>
                  Universitas Bina Darma
                </h5>
                <p style={{
                  fontSize: isMobile ? '12px' : '13px',
                  color: '#64748b',
                  margin: '0',
                  lineHeight: '1.4',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
                }}>
                  Teknik Informatika
                </p>
              </div>
            </div>

            {/* Dinas Pendidikan Kota Palembang */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? '16px' : '20px',
              padding: isMobile ? '12px 16px' : '16px',
              transition: 'transform 0.3s ease',
              cursor: 'pointer',
              borderBottom: isMobile ? '1px solid #f1f5f9' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) e.currentTarget.style.transform = 'translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              if (!isMobile) e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{
                width: isMobile ? '60px' : '70px',
                height: isMobile ? '60px' : '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Image
                  src="/asset/dinaspendidikan.png"
                  alt="Dinas Pendidikan Kota Palembang"
                  width={isMobile ? 60 : 70}
                  height={isMobile ? 60 : 70}
                  style={{
                    objectFit: 'contain',
                    filter: 'grayscale(0%)',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
              <div style={{
                textAlign: 'center',
                width: '100%'
              }}>
                <h5 style={{
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: '600',
                  color: '#334155',
                  margin: '0 0 4px 0',
                  lineHeight: '1.3',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
                }}>
                  Dinas Pendidikan Kota Palembang
                </h5>
                <p style={{
                  fontSize: isMobile ? '12px' : '13px',
                  color: '#64748b',
                  margin: '0',
                  lineHeight: '1.4',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
                }}>
                  Pemerintah Kota Palembang
                </p>
              </div>
            </div>

            {/* BPS Kota Palembang */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? '8px' : '12px',
              padding: isMobile ? '12px 16px' : '16px',
              transition: 'transform 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) e.currentTarget.style.transform = 'translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              if (!isMobile) e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{
                width: isMobile ? '80px' : '100px',
                height: isMobile ? '80px' : '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Image
                  src="/asset/bps.png"
                  alt="Badan Pusat Statistik Kota Palembang"
                  width={isMobile ? 80 : 100}
                  height={isMobile ? 80 : 100}
                  style={{
                    objectFit: 'contain',
                    filter: 'grayscale(0%)',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
              <div style={{
                textAlign: 'center',
                width: '100%'
              }}>
                <h5 style={{
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: '600',
                  color: '#334155',
                  margin: '0 0 4px 0',
                  lineHeight: '1.3',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
                }}>
                  BPS Kota Palembang
                </h5>
                <p style={{
                  fontSize: isMobile ? '12px' : '13px',
                  color: '#64748b',
                  margin: '0',
                  lineHeight: '1.4',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
                }}>
                  Badan Pusat Statistik
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

