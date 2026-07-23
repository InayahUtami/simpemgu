'use client';

import UserNavbar from "./User/UserNavbar";
import dynamic from 'next/dynamic';
import { Info, Users, Database, MapPin, BookOpen, HelpCircle, Plus, Minus, ArrowRight, ChevronRight, ChevronDown, UserCheck, FileText, BarChart2, Activity } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const Footer = dynamic(() => import('./components/Footer'), { ssr: false });

export default function Home() {
  // Typing animation for 'Data collaboration by'
  const typingText = 'Data collaboration by';
  const [typedText, setTypedText] = useState('');
  const i = useRef(0);
  useEffect(() => {
    setTypedText('');
    i.current = 0;
    const interval = setInterval(() => {
      if (i.current < typingText.length) {
        setTypedText(typingText.slice(0, i.current + 1));
        i.current++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [faqColumns, setFaqColumns] = useState(3);

  // Reset expandedCard on mount/page load
  useEffect(() => {
    setExpandedCard(null);
  }, []);

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      
      // Update FAQ columns based on screen width
      if (width <= 768) {
        setFaqColumns(1);
      } else if (width <= 1024) {
        setFaqColumns(2);
      } else {
        setFaqColumns(3);
      }
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => {
      window.removeEventListener('resize', updateLayout);
    };
  }, []);

  return (
    <>
      <UserNavbar />
      <div className="user-content-zoom" style={{ 
        minHeight: '100vh',
        background: '#ffffff',
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Plain background layer */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#ffffff',
          zIndex: 0
        }} />

        <div style={{ padding: '0', position: 'relative', zIndex: 1 }}>
          {/* Modern Hero Section - Fixed Background */}
          <div style={{
            position: 'relative',
            width: '100%',
            minHeight: isMobile ? '550px' : '700px',
            backgroundImage: `url('/asset/userbps.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: isMobile ? '40px' : '80px',
            overflow: 'hidden'
          }}
          className="hero-section-responsive"
          >
            {/* Animated Overlay with Modern Gradient */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(135deg, rgba(3, 37, 38, 0.68) 0%, rgba(6, 78, 59, 0.5) 52%, rgba(146, 64, 14, 0.38) 100%)',
              backgroundSize: '400% 400%',
              zIndex: 1,
              animation: 'modernGradient 15s ease infinite'
            }} />

            {/* Floating Grid Pattern */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              animation: 'gridFloat 20s linear infinite',
              zIndex: 1
            }} />

            {/* Modern Particles - Fixed values for SSR */}
            {[
              { size: 8, color: '16, 185, 129', opacity: 0.6, top: 15, left: 10, anim: 1, duration: 12 },
              { size: 6, color: '14, 165, 233', opacity: 0.5, top: 25, left: 85, anim: 2, duration: 14 },
              { size: 10, color: '245, 158, 11', opacity: 0.7, top: 45, left: 20, anim: 3, duration: 16 },
              { size: 7, color: '16, 185, 129', opacity: 0.4, top: 65, left: 75, anim: 4, duration: 10 },
              { size: 9, color: '14, 165, 233', opacity: 0.6, top: 80, left: 50, anim: 1, duration: 15 },
              { size: 5, color: '245, 158, 11', opacity: 0.5, top: 35, left: 60, anim: 2, duration: 13 },
              { size: 11, color: '16, 185, 129', opacity: 0.7, top: 55, left: 30, anim: 3, duration: 11 },
              { size: 8, color: '14, 165, 233', opacity: 0.6, top: 70, left: 90, anim: 4, duration: 14 }
            ].map((particle, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  borderRadius: '50%',
                  background: `rgba(${particle.color}, ${particle.opacity})`,
                  top: `${particle.top}%`,
                  left: `${particle.left}%`,
                  filter: 'blur(1px)',
                  animation: `floatParticle${particle.anim} ${particle.duration}s ease-in-out infinite`
                }}
              />
            ))}

            <style jsx>{`
              @keyframes gridFloat {
                0% { transform: translate(0, 0); }
                100% { transform: translate(50px, 50px); }
              }
              @keyframes floatParticle1 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
                33% { transform: translate(-40px, -60px) scale(1.3); opacity: 1; }
                66% { transform: translate(30px, 40px) scale(0.8); opacity: 0.4; }
              }
              @keyframes floatParticle2 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
                50% { transform: translate(60px, -40px) scale(1.4); opacity: 0.9; }
              }
              @keyframes floatParticle3 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
                25% { transform: translate(50px, -50px) scale(1.2); opacity: 0.9; }
                75% { transform: translate(-40px, 30px) scale(0.9); opacity: 0.5; }
              }
              @keyframes floatParticle4 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                50% { transform: translate(-35px, -55px) scale(1.5); opacity: 0.8; }
              }
              @keyframes fadeInDown {
                from {
                  opacity: 0;
                  transform: translateY(-40px) scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(40px) scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
              @keyframes shimmerGlow {
                0%, 100% {
                  text-shadow:
                    0 0 30px rgba(255, 255, 255, 0.5),
                    0 0 60px rgba(59, 130, 246, 0.4),
                    0 0 90px rgba(139, 92, 246, 0.3);
                }
                50% {
                  text-shadow:
                    0 0 40px rgba(255, 255, 255, 0.8),
                    0 0 80px rgba(59, 130, 246, 0.6),
                    0 0 120px rgba(139, 92, 246, 0.5);
                }
              }
              @keyframes fadeZoomIn {
                from {
                  opacity: 0;
                  transform: scale(0.8) translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }
              @keyframes floatSoft {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              @keyframes pulseScale {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.03); }
              }
              @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-15px); }
              }
              @keyframes slideInLeft {
                from {
                  opacity: 0;
                  transform: translateX(-50px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              @keyframes slideInRight {
                from {
                  opacity: 0;
                  transform: translateX(50px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              @keyframes slideRight {
                from {
                  transform: translateX(-100%);
                }
                to {
                  transform: translateX(100%);
                }
              }
              .animate-title {
                animation: fadeInDown 1.5s ease-out forwards, shimmerGlow 4s ease-in-out infinite, pulseScale 5s ease-in-out infinite;
                opacity: 0;
              }
              .animate-subtitle {
                animation: fadeInUp 1.5s ease-out 0.4s forwards;
                opacity: 0;
              }
              .animate-description {
                animation: fadeInUp 1.5s ease-out 0.8s forwards;
                opacity: 0;
              }
              .animate-badge {
                animation: fadeInUp 1.5s ease-out 1.2s forwards, float 3s ease-in-out 1.5s infinite;
                opacity: 0;
              }
              .stat-card {
                animation: fadeInUp 1s ease-out forwards;
              }
              @keyframes rotateGlow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>

            {/* Content with Modern Design */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              color: 'white',
              padding: isMobile ? '40px 24px' : '60px 40px',
              maxWidth: '1200px'
            }}>
              <h1 className="animate-title" style={{
                fontSize: 'clamp(32px, 8vw, 80px)',
                fontWeight: '900',
                marginBottom: '16px',
                letterSpacing: '-0.02em',
                lineHeight: '1.1',
                textTransform: 'uppercase',
                color: '#f8fafc',
                textShadow: '0 6px 24px rgba(0, 0, 0, 0.55), 0 0 32px rgba(255, 255, 255, 0.28)'
              }}>
                SELAMAT DATANG
              </h1>
              <h2 className="animate-subtitle" style={{
                fontSize: 'clamp(16px, 4vw, 32px)',
                fontWeight: '700',
                marginBottom: '20px',
                marginTop: '20px',
                letterSpacing: '0.01em',
                lineHeight: '1.5',
                textTransform: 'uppercase',
                color: 'white',
                textShadow: '0 2px 30px rgba(0, 0, 0, 0.5)',
                maxWidth: '950px',
                margin: '0 auto'
              }}>
                SISTEM PEMERETAAN GURU KOTA PALEMBANG
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
                  padding: '4px 20px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginTop: '12px',
                  fontSize: 'clamp(14px, 3.5vw, 28px)',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.45)'
                }}>
                  SIMPEMGU
                </span>
              </h2>
              <div className="animate-description" style={{
                fontSize: 'clamp(18px, 4vw, 28px)',
                fontWeight: '700',
                marginTop: '24px',
                marginBottom: '4px',
                letterSpacing: '0.05em',
                background: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 50%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 2px 10px rgba(251, 191, 36, 0.5))',
                minHeight: isMobile ? '28px' : '36px',
                display: 'inline-block'
              }}>
              </div>

              {/* New: Call to Action Buttons */}
              <div className="animate-badge" style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                marginTop: '20px',
                flexWrap: 'wrap'
              }}>
                <a href="/dashboard" style={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                  color: 'white',
                  padding: isMobile ? '14px 28px' : '16px 36px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: isMobile ? '14px' : '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 30px rgba(5, 150, 105, 0.45)',
                  transition: 'all 0.3s ease',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(5, 150, 105, 0.62)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(5, 150, 105, 0.45)';
                }}>
                  <Database size={20} />
                  Lihat Dashboard
                  <ArrowRight size={18} />
                </a>
                <a href="#map" style={{
                  textDecoration: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  padding: isMobile ? '14px 28px' : '16px 36px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: isMobile ? '14px' : '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
                }}>
                  <MapPin size={20} />
                  Jelajahi Peta
                  <ChevronRight size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Information Cards - Creative Card Flip Design */}
          <div style={{
            padding: '0 20px',
            maxWidth: '1400px',
            margin: '0 auto 80px auto'
          }}>
            {/* Section Header with Animation */}
            <div style={{
              textAlign: 'center',
              marginBottom: '60px',
              position: 'relative'
            }}>
              {/* Animated Background Text */}
              <div style={{
                fontSize: isMobile ? '60px' : '120px',
                fontWeight: '900',
                color: 'rgba(255,255,255,0.03)',
                position: 'absolute',
                top: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                letterSpacing: '10px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 0
              }}>
                INFORMASI
              </div>
              
              <div style={{
                fontSize: '14px',
                fontWeight: '800',
                color: '#1f2937',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                marginBottom: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 24px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50px',
                border: '2px solid rgba(31, 41, 55, 0.2)',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#0f766e',
                  animation: 'pulseGlow 2s ease-in-out infinite'
                }} />
                Yang Perlu Anda Ketahui
              </div>
              
              <h2 style={{
                fontSize: isMobile ? '36px' : '56px',
                fontWeight: '900',
                color: '#1f2937',
                margin: '0 0 16px 0',
                letterSpacing: '-0.03em',
                lineHeight: '1.2',
                position: 'relative',
                zIndex: 1
              }}>
                Tentang Distribusi Guru
              </h2>
              
              <p style={{
                fontSize: isMobile ? '16px' : '18px',
                color: '#4b5563',
                maxWidth: '700px',
                margin: '0 auto',
                lineHeight: '1.6',
                position: 'relative',
                zIndex: 1
              }}>
                Temukan informasi lengkap seputar distribusi guru dengan cara yang menarik dan interaktif
              </p>
            </div>

            {/* Interactive Timeline Information Section */}
            <div style={{
              position: 'relative',
              padding: isMobile ? '60px 0 100px 0' : '100px 0 150px 0',
              marginBottom: expandedCard !== null ? (isMobile ? '450px' : '500px') : '0',
              transition: 'margin-bottom 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {/* Timeline Line - Hide on mobile */}
              {!isMobile && (
              <div style={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                right: '10%',
                height: '6px',
                background: 'linear-gradient(90deg, #0f766e 0%, #0ea5e9 50%, #f59e0b 100%)',
                borderRadius: '6px',
                boxShadow: '0 0 40px rgba(15, 118, 110, 0.5)',
                transform: 'translateY(-50%)',
                zIndex: 0
              }}>
                {/* Animated Pulse */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  animation: 'slideRight 3s ease-in-out infinite',
                  borderRadius: '6px'
                }} />
              </div>
              )}

              {/* Timeline Nodes */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '100px' : '0'
              }}>
                {[
                  {
                    id: 0,
                    emoji: '01',
                    icon: <UserCheck size={36} />,
                    color: '#0f766e',
                    gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    title: 'Distribusi Guru',
                    desc: 'Distribusi Guru adalah penempatan dan alokasi tenaga pendidik yang optimal dan adil di setiap sekolah berdasarkan analisis kebutuhan. Sistem ini menggunakan data demografi, jumlah siswa, dan kondisi geografis untuk memastikan setiap wilayah mendapat porsi guru yang sesuai. Tujuannya mengurangi kesenjangan kualitas pendidikan dengan menjamin akses guru berkualitas di sekolah pinggiran dan daerah terpencil.',
                    stats: [],
                    useBlackText: true
                  },
                  {
                    id: 1,
                    emoji: '02',
                    icon: <FileText size={36} />,
                    color: '#0284c7',
                    gradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                    title: 'Sumber Data',
                    desc: '- Dinas Pendidikan Kota Palembang: Menyediakan data guru, rombel, dan siswa dari catatan administrasi resmi.\n\n- Data BPS Kota Palembang: Menggunakan data Disdik semester ganjil sebagai basis karena periode ini paling konsisten untuk validasi awal tahun ajaran, kemudian dipadukan dengan indikator jumlah penduduk untuk melihat kebutuhan pemerataan guru per wilayah secara lebih akurat.',
                    stats: [],
                    useBlackText: true,
                    showSource: true
                  },
                  {
                    id: 2,
                    emoji: '03',
                    icon: <Database size={36} />,
                    color: '#b45309',
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    title: 'Data Tersedia',
                    desc: 'Dashboard ini menyediakan data:\n\n- Jumlah Guru per Kecamatan (Dinas Pendidikan Kota Palembang)\n- Jumlah Siswa per Kecamatan\n- Jumlah Rombongan Belajar (Rombel) per Kecamatan\n- Rasio Guru-Siswa per Kecamatan\n- Nama Sekolah & Status (Negeri/Swasta)\n- Jumlah Penduduk per Kecamatan (BPS Kota Palembang)\n- Peta menggunakan metode AHP dan AHC',
                    stats: [],
                    useBlackText: true
                  }
                ].map((node) => {
                  const isActive = expandedCard === node.id;

                  return (
                    <div key={node.id} style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      {/* Popup Detail (appears below node) */}
                      <div style={{
                        position: 'absolute',
                        top: '180px',
                        left: '50%',
                        width: isMobile ? '85vw' : '400px',
                        maxWidth: '420px',
                        background: '#ffffff',
                        borderRadius: '24px',
                        padding: '28px',
                        border: `3px solid ${node.color}`,
                        boxShadow: `0 25px 80px rgba(0,0,0,0.15)`,
                        opacity: isActive ? 1 : 0,
                        visibility: isActive ? 'visible' : 'hidden',
                        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isActive 
                          ? 'translateX(-50%) translateY(0) scale(1)' 
                          : 'translateX(-50%) translateY(-20px) scale(0.95)',
                        zIndex: 15,
                        pointerEvents: isActive ? 'auto' : 'none'
                      }}>
                        {/* Arrow Pointer pointing up to node */}
                        <div style={{
                          position: 'absolute',
                          top: '-16px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '16px solid transparent',
                          borderRight: '16px solid transparent',
                          borderBottom: '16px solid #ffffff',
                          filter: 'drop-shadow(0 -4px 8px rgba(0,0,0,0.1))'
                        }} />

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            fontSize: '48px',
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
                          }}>
                            {node.emoji}
                          </div>
                          <h3 style={{
                            fontSize: isMobile ? '18px' : '22px',
                            fontWeight: '900',
                            color: node.useBlackText ? '#1f2937' : 'white',
                            margin: 0,
                            flex: 1,
                            letterSpacing: '-0.01em',
                            textShadow: node.useBlackText ? 'none' : '0 2px 8px rgba(0,0,0,0.2)'
                          }}>
                            {node.title}
                          </h3>
                        </div>

                        <div style={{
                          height: '3px',
                          background: node.gradient,
                          borderRadius: '3px',
                          marginBottom: '16px',
                          boxShadow: `0 0 20px ${node.color}80`
                        }} />

                        <p style={{
                          fontSize: '13px',
                          lineHeight: '1.7',
                          color: node.useBlackText ? '#374151' : 'rgba(255,255,255,0.95)',
                          marginBottom: '16px',
                          whiteSpace: 'pre-line'
                        }}>
                          {node.desc}
                        </p>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                          gap: '8px'
                        }}>
                          {node.stats.map((stat, i) => (
                            <div key={i} style={{
                              background: '#f3f4f6',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              color: '#1f2937',
                              textAlign: 'center',
                              border: `2px solid ${node.color}`,
                              fontWeight: '700',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                              {stat}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline Node (clickable) */}
                      <div
                        onClick={() => setExpandedCard(expandedCard === node.id ? null : node.id)}
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          background: node.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: 'scale(1)',
                          boxShadow: 'none',
                          zIndex: isActive ? 10 : 2,
                          animation: 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {/* Icon */}
                        <div style={{
                          position: 'relative',
                          zIndex: 1,
                          filter: 'none'
                        }}>
                          {node.icon}
                        </div>
                      </div>

                      {/* Label Below Node */}
                      <div style={{
                        marginTop: '28px',
                        textAlign: 'center',
                        fontSize: '15px',
                        fontWeight: '800',
                        color: node.useBlackText 
                          ? (isActive ? '#1f2937' : '#374151') 
                          : (isActive ? node.color : 'rgba(255,255,255,0.8)'),
                        transition: 'all 0.4s ease',
                        textShadow: node.useBlackText 
                          ? 'none' 
                          : (isActive ? `0 0 30px ${node.color}, 0 2px 8px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.3)'),
                        letterSpacing: '-0.01em'
                      }}>
                        {node.title}
                      </div>

                      {/* Click hint indicator */}
                      {!isActive && (
                        <div style={{
                          marginTop: '12px',
                          fontSize: '12px',
                          color: '#1f2937',
                          fontWeight: '600',
                          animation: 'bounce 2s ease-in-out infinite'
                        }}>
                          Klik di sini 👆
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Map Section - Enhanced */}
          <div id="map" style={{
            background: '#ffffff',
            backdropFilter: 'none',
            borderRadius: '32px',
            padding: isMobile ? '32px' : '48px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '2px solid rgba(255,255,255,0.5)',
            marginBottom: '60px',
            maxWidth: '1400px',
            margin: '0 auto 60px auto',
            marginTop: '-80px',
            marginLeft: isMobile ? '20px' : 'auto',
            marginRight: isMobile ? '20px' : 'auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '40px',
              paddingBottom: '32px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(15, 118, 110, 0.35)'
              }}>
                <MapPin size={32} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{
                  fontSize: isMobile ? '24px' : '32px',
                  fontWeight: '900',
                  color: '#1f2937',
                  margin: 0,
                  letterSpacing: '-0.02em'
                }}>
                  Peta Kota Palembang
                </h2>
                <p style={{
                  fontSize: isMobile ? '14px' : '16px',
                  color: '#6b7280',
                  margin: '6px 0 0 0',
                  fontWeight: '500'
                }}>
                  Gunakan peta sekolah resmi Kemendikdasmen untuk melihat sebaran sekolah di Kota Palembang
                </p>
              </div>
            </div>
            <div style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '0',
              padding: 0,
              textAlign: 'left'
            }}>
              <div style={{
                width: '100%',
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                marginBottom: '20px',
                background: '#ffffff'
              }}>
                <iframe
                  title="Peta Sekolah Kota Palembang"
                  src="https://sekolah.data.kemendikdasmen.go.id/peta-sekolah"
                  style={{
                    width: '100%',
                    height: isMobile ? '420px' : '560px',
                    border: 'none'
                  }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p style={{
                margin: '0',
                color: '#475569',
                fontSize: isMobile ? '13px' : '14px',
                lineHeight: '1.6',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Sumber: Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) - Peta Sekolah
              </p>
            </div>
          </div>

          {/* FAQ Section - Modern & Beautiful */}
          <div 
            style={{
              marginTop: isMobile ? '40px' : '80px',
              marginBottom: isMobile ? '40px' : '80px',
              padding: isMobile ? '40px 20px' : '80px 48px',
              background: '#ffffff',
              backdropFilter: 'none',
              borderRadius: isMobile ? '16px' : '32px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
              position: 'relative',
              overflow: 'hidden',
              maxWidth: '1400px',
              marginLeft: isMobile ? '20px' : 'auto',
              marginRight: isMobile ? '20px' : 'auto'
            }}
          >
            {/* Header - Modern Layout */}
            <div style={{ marginBottom: '60px', position: 'relative', zIndex: 1 }}>
              <div style={{ 
                display: 'flex',
                justifyContent: isMobile ? 'center' : 'space-between',
                alignItems: 'center',
                gap: '24px',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                {/* Left: Text */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: isMobile ? '13px' : '15px',
                    fontWeight: '800', 
                    color: '#0f766e', 
                    letterSpacing: '2px',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    textAlign: isMobile ? 'center' : 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    justifyContent: isMobile ? 'center' : 'flex-start'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#0f766e',
                      animation: 'pulseGlow 2s ease-in-out infinite'
                    }} />
                    TOPIK PEMERATAAN
                  </div>
                  <h2 style={{ 
                    fontSize: isMobile ? '24px' : '48px',
                    fontWeight: '900', 
                    color: '#1f2937',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                    lineHeight: '1.2',
                    textAlign: isMobile ? 'center' : 'left'
                  }}>
                    Pertanyaan{' '}
                    <span style={{ 
                      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                      padding: isMobile ? '4px 10px' : '6px 20px',
                      borderRadius: '12px',
                      color: 'white',
                      display: 'inline-block',
                      fontSize: isMobile ? '20px' : 'inherit',
                      boxShadow: '0 8px 24px rgba(15, 118, 110, 0.38)'
                    }}>Pemerataan</span>
                  </h2>
                  <p style={{
                    fontSize: isMobile ? '13px' : '16px',
                    color: '#6b7280',
                    margin: 0,
                    textAlign: isMobile ? 'center' : 'left',
                    fontWeight: '500'
                  }}>
                    Temukan jawaban seputar pemerataan pendidikan Kota Palembang
                  </p>
                </div>
                
                {/* Right: Icon with Glow - Hide on mobile */}
                {!isMobile && (
                <div style={{
                  width: '120px',
                  height: '120px',
                  background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 15px 40px rgba(15,118,110,0.28)',
                  flexShrink: 0,
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #14b8a6 0%, #f59e0b 100%)',
                    opacity: 0.3,
                    filter: 'blur(20px)',
                    animation: 'rotateGlow 4s linear infinite'
                  }} />
                  <HelpCircle 
                    size={70} 
                    color="white" 
                    strokeWidth={2.5} 
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                </div>
                )}
              </div>
            </div>

            {/* Responsive Grid Layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: isMobile ? '16px' : '32px',
                maxWidth: '1200px',
                margin: '0 auto',
                alignItems: 'start',
                padding: '0',
                overflowX: 'visible'
              }}
            >
              {[
                {
                  question: 'Kenapa ada kecamatan yang kelebihan guru dan ada yang kekurangan guru?',
                  answer: 'Hal ini terjadi karena pemerataan guru di Kota Palembang belum merata secara merata. Distribusi guru selama ini lebih banyak terkonsentrasi di kecamatan pusat kota atau sekolah negeri yang mudah dijangkau, sementara kecamatan pinggiran dan sekolah swasta justru kekurangan tenaga pendidik. Faktor lain yang memperparah kondisi ini adalah mutasi guru yang tidak terencana, pensiun massal tanpa rekrutmen pengganti yang proporsional, serta pertumbuhan jumlah siswa yang tidak seimbang antar wilayah. Akibatnya, satu kecamatan bisa memiliki rasio guru-siswa yang sangat rendah (kelebihan guru) sementara kecamatan lain harus menanggung beban mengajar yang sangat tinggi (kekurangan guru). Sistem informasi seperti SIMPEMGU hadir untuk memvisualisasikan ketimpangan ini secara real-time, sehingga Dinas Pendidikan dapat mengambil kebijakan redistribusi guru yang tepat sasaran.',
                  showSource: false
                },
                {
                  question: 'Apa hubungan antara jumlah penduduk dan kebutuhan guru di suatu kecamatan?',
                  answer: 'Jumlah penduduk per kecamatan yang tersedia di SIMPEMGU (bersumber dari BPS) dapat dijadikan acuan untuk menilai kesesuaian distribusi guru. Kecamatan dengan jumlah penduduk tinggi wajarnya memiliki lebih banyak siswa dan rombel, sehingga kebutuhan guru juga lebih besar. Dengan membandingkan data jumlah penduduk, data guru, data siswa, dan rasio guru-siswa antar kecamatan yang tersedia di sistem ini, dapat terlihat apakah kecamatan dengan penduduk padat sudah mendapatkan alokasi guru yang memadai — atau justru masih kekurangan dibanding kecamatan lain yang penduduknya lebih sedikit.',
                  showSource: false
                },
                {
                  question: 'Kenapa BPS memakai data Dinas Pendidikan semester ganjil?',
                  answer: 'Data semester ganjil dipakai karena periode ini umumnya paling stabil untuk menggambarkan kondisi awal tahun ajaran. Semester ganjil biasanya berlangsung dari bulan Juli sampai Desember, saat komposisi siswa, guru, dan rombel sudah lebih lengkap setelah proses daftar ulang. Dengan memakai semester ganjil sebagai baseline, perbandingan antar kecamatan menjadi lebih konsisten dan meminimalkan distorsi perubahan di tengah tahun ajaran. Karena itu, dalam SIMPEMGU data Dinas Pendidikan semester ganjil dipadukan dengan indikator BPS agar analisis pemerataan lebih akurat dan dapat dipertanggungjawabkan.',
                  showSource: false
                }
              ].map((faq, index) => {
                const isOpen = openFaqIndex !== null && openFaqIndex === index;
                
                return (
                <div 
                  key={`faq-${index}`}
                  style={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Container wrapper - Modern Clean Design */}
                  <div
                    style={{ 
                      background: '#ffffff',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: isOpen 
                        ? '0 8px 24px rgba(59,130,246,0.15)' 
                        : '0 2px 8px rgba(0,0,0,0.06)',
                      border: isOpen 
                        ? '2px solid #3b82f6'
                        : '2px solid #e5e7eb',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      height: isOpen ? 'auto' : '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 'fit-content'
                    }}
                  >
                    {/* Top accent bar when open */}
                    {isOpen && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                      }} />
                    )}
                    
                    {/* Button Header */}
                    <button
                      onClick={() => {
                        setOpenFaqIndex((prev) => prev === index ? null : index);
                      }}
                      style={{
                        width: '100%',
                        padding: isMobile ? '14px 12px' : '20px 24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'left',
                        outline: 'none',
                        position: 'relative',
                        gap: isMobile ? '8px' : '16px'
                      }}
                    >
                    {/* Question number badge */}
                    <div style={{
                      position: 'absolute',
                      left: isMobile ? '12px' : '28px',
                      top: isMobile ? '12px' : '20px',
                      width: isMobile ? '22px' : '28px',
                      height: isMobile ? '22px' : '28px',
                      borderRadius: '50%',
                      background: isOpen 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                        : 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '10px' : '12px',
                      fontWeight: '700',
                      color: isOpen ? '#ffffff' : '#3b82f6',
                      transition: 'all 0.3s ease',
                      boxShadow: isOpen ? '0 4px 12px rgba(59,130,246,0.3)' : 'none'
                    }}>
                      {index + 1}
                    </div>
                    
                    <h5 style={{ 
                      fontSize: isMobile ? '13px' : '18px', 
                      fontWeight: isOpen ? '700' : '600', 
                      color: isOpen ? '#1e40af' : '#334155',
                      margin: 0,
                      flex: 1,
                      paddingLeft: isMobile ? '38px' : '44px',
                      paddingRight: isMobile ? '8px' : '20px',
                      lineHeight: '1.5',
                      transition: 'all 0.3s ease',
                      letterSpacing: '-0.01em',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      {faq.question}
                    </h5>
                    <div style={{
                      width: isMobile ? '28px' : '36px',
                      height: isMobile ? '28px' : '36px',
                      borderRadius: '10px',
                      background: isOpen 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                        : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      flexShrink: 0,
                      boxShadow: isOpen ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      {isOpen ? (
                        <Minus 
                          size={isMobile ? 16 : 20} 
                          color="#ffffff"
                          strokeWidth={3}
                        />
                      ) : (
                        <Plus 
                          size={isMobile ? 16 : 20} 
                          color="#64748b"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                  </button>
                  
                  {/* Content Area - Clean Answer Section */}
                  <div 
                    style={{
                      maxHeight: isOpen ? '1000px' : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s ease, opacity 0.3s ease',
                      padding: isOpen 
                        ? (isMobile ? '0 16px 16px 16px' : '0 24px 24px 24px')
                        : '0 16px',
                      opacity: isOpen ? 1 : 0,
                      visibility: isOpen ? 'visible' : 'hidden'
                    }}
                  >
                    {isOpen && (
                      <div style={{
                        background: '#f8fafc',
                        padding: isMobile ? '14px' : '20px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}>
                        {/* Answer text */}
                        <div style={{
                          fontSize: isMobile ? '12px' : '14px',
                          lineHeight: '1.7',
                          color: '#4b5563',
                          fontWeight: '400',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          {faq.answer}
                        </div>
                        
                        {/* Bottom decorative line - only show if showSource is true */}
                        {faq.showSource && (
                          <div style={{
                            marginTop: isMobile ? '12px' : '16px',
                            paddingTop: isMobile ? '12px' : '16px',
                            borderTop: '1px dashed #dbeafe',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: isMobile ? '12px' : '13px',
                            color: '#64748b',
                            fontStyle: 'italic'
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="16" x2="12" y2="12"></line>
                              <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            <span>Sumber: Menurut UU No. 16/1997 jo. PP No. 51/1999 & UU No. 23/2006 jo. UU No. 24/2013</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </>
  );
}


