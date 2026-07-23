import React from 'react';

export interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ open, onClose, onConfirm, title, message }) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      margin: 0,
      background: 'rgba(30,41,59,0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '16px' : '0',
      animation: 'fadeInModal 0.3s',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'white',
        borderRadius: isMobile ? '16px' : '20px',
        boxShadow: '0 12px 32px rgba(30,41,59,0.18)',
        padding: isMobile ? '24px 20px' : '32px 28px',
        width: isMobile ? '100%' : 'auto',
        minWidth: isMobile ? 'auto' : '340px',
        maxWidth: isMobile ? '100%' : '90vw',
        textAlign: 'center',
        position: 'relative',
        animation: 'popUpModal 0.4s cubic-bezier(0.175,0.885,0.32,1.275)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: isMobile ? '12px' : '18px',
            right: isMobile ? '12px' : '18px',
            background: 'none',
            border: 'none',
            fontSize: isMobile ? '28px' : '24px',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'color 0.2s',
            borderRadius: '8px',
            padding: '4px',
            lineHeight: '1'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#1e3a8a'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          ×
        </button>
        <div style={{ marginBottom: isMobile ? '16px' : '18px' }}>
          <div style={{
            width: isMobile ? '48px' : '56px',
            height: isMobile ? '48px' : '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #93c5fd 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: isMobile ? '0 auto 10px auto' : '0 auto 12px auto',
            boxShadow: '0 2px 8px rgba(239,68,68,0.12)'
          }}>
            <span style={{ fontSize: isMobile ? '28px' : '32px', color: 'white', fontWeight: 'bold' }}>×</span>
          </div>
          <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0', lineHeight: '1.3' }}>{title}</h2>
          <p style={{ color: '#64748b', fontSize: isMobile ? '14px' : '15px', margin: 0, lineHeight: '1.5' }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? '12px' : '16px', justifyContent: 'center', marginTop: isMobile ? '16px' : '18px', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            style={{
              padding: isMobile ? '10px 24px' : '12px 28px',
              background: '#f3f4f6',
              color: '#64748b',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: isMobile ? '14px' : '15px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(100,116,139,0.08)',
              transition: 'background 0.2s, color 0.2s',
              minWidth: isMobile ? '100px' : '120px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: isMobile ? '10px 24px' : '12px 28px',
              background: 'linear-gradient(90deg, #1e3a8a 0%, #93c5fd 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: isMobile ? '14px' : '15px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239,68,68,0.12)',
              transition: 'background 0.2s',
              minWidth: isMobile ? '100px' : '120px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e3a8a'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(90deg, #1e3a8a 0%, #93c5fd 100%)'}
          >
            Hapus
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popUpModal {
          0% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmationModal;

