"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface AIAnalysisButtonProps {
  chartData: any;
  chartType: string;
  title: string;
  context?: string;
  variant?: 'primary' | 'secondary' | 'minimal';
  position?: 'top-right' | 'bottom' | 'inline';
}

export default function AIAnalysisButton({
  chartData,
  chartType,
  title,
  context,
  variant = 'primary',
  position = 'top-right',
}: AIAnalysisButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError('');
    setShowModal(true);

    try {
      console.log('Sending analysis request...', { chartType, title });
      const response = await fetch('/api/ai/analyze-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chartData,
          chartType,
          title,
          context,
        }),
      });

      const data = await response.json();
      console.log('API Response:', { ok: response.ok, status: response.status, data });

      if (!response.ok) {
        const errorMsg = data.details 
          ? `${data.error}\n\nDetail: ${data.details}` 
          : data.error || 'Gagal mendapatkan analisis';
        throw new Error(errorMsg);
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      const errorMessage = err.message || 'Terjadi kesalahan saat menganalisis data';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const buttonStyles = {
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    },
    secondary: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)',
    },
    minimal: {
      background: 'white',
      color: '#667eea',
      border: '2px solid #667eea',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
  };

  const positionStyles = {
    'top-right': {
      position: 'absolute' as const,
      top: '16px',
      right: '16px',
      zIndex: 10,
    },
    bottom: {
      marginTop: '16px',
      width: '100%',
    },
    inline: {
      display: 'inline-block',
    },
  };

  return (
    <>
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        style={{
          ...buttonStyles[variant],
          ...positionStyles[position],
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isAnalyzing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: isAnalyzing ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isAnalyzing) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow =
            variant === 'minimal'
              ? '0 2px 8px rgba(0, 0, 0, 0.1)'
              : '0 4px 15px rgba(102, 126, 234, 0.4)';
        }}
      >
        {isAnalyzing ? (
          <>
            <svg
              style={{ animation: 'spin 1s linear infinite' }}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="3" opacity="0.25" />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Menganalisis...
          </>
        ) : (
          <>
            🤖 Analisis AI
          </>
        )}
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: window.innerWidth <= 768 ? '12px' : '20px',
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: window.innerWidth <= 768 ? '16px' : '24px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: window.innerWidth <= 768 ? '90vh' : '85vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
              animation: 'slideUp 0.4s ease',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: window.innerWidth <= 768 ? '16px 20px' : '24px 32px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: window.innerWidth <= 768 ? '18px' : '24px', fontWeight: '700', marginBottom: '4px', lineHeight: '1.3' }}>
                  🤖 Analisis AI - Gemini
                </h2>
                <p style={{ margin: 0, fontSize: window.innerWidth <= 768 ? '13px' : '14px', opacity: 0.9, lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: window.innerWidth <= 768 ? '36px' : '40px',
                  height: window.innerWidth <= 768 ? '36px' : '40px',
                  borderRadius: '12px',
                  fontSize: window.innerWidth <= 768 ? '22px' : '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                padding: window.innerWidth <= 768 ? '20px 16px' : '32px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {isAnalyzing && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      border: '4px solid #f3f4f6',
                      borderTop: '4px solid #667eea',
                      borderRadius: '50%',
                      margin: '0 auto 24px',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <p style={{ fontSize: '18px', color: '#667eea', fontWeight: '600' }}>
                    Gemini sedang menganalisis data...
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                    Mohon tunggu sebentar
                  </p>
                </div>
              )}

              {error && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '2px solid #fecaca',
                    borderRadius: '16px',
                    padding: '24px',
                    color: '#1e3a8a',
                  }}
                >
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700' }}>
                    ⚠️ Terjadi Kesalahan
                  </h3>
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '13px', 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word',
                    backgroundColor: '#fff1f2',
                    padding: '12px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    lineHeight: '1.6'
                  }}>{error}</pre>
                  <button
                    onClick={handleAnalyze}
                    style={{
                      marginTop: '16px',
                      padding: '10px 20px',
                      background: '#1e3a8a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    🔄 Coba Lagi
                  </button>
                </div>
              )}

              {analysis && !isAnalyzing && (
                <div
                  style={{
                    fontSize: '15px',
                    lineHeight: '1.8',
                    color: '#1f2937',
                  }}
                  className="ai-analysis-content"
                >
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1
                          style={{
                            fontSize: '28px',
                            fontWeight: '800',
                            marginTop: '32px',
                            marginBottom: '16px',
                            color: '#111827',
                            borderBottom: '3px solid #667eea',
                            paddingBottom: '12px',
                          }}
                        >
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2
                          style={{
                            fontSize: '22px',
                            fontWeight: '700',
                            marginTop: '28px',
                            marginBottom: '12px',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span style={{ color: '#667eea' }}>▸</span>
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3
                          style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginTop: '20px',
                            marginBottom: '10px',
                            color: '#374151',
                          }}
                        >
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p
                          style={{
                            marginBottom: '16px',
                            lineHeight: '1.8',
                          }}
                        >
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul
                          style={{
                            marginLeft: '24px',
                            marginBottom: '20px',
                            listStyleType: 'none',
                          }}
                        >
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li
                          style={{
                            marginBottom: '12px',
                            paddingLeft: '28px',
                            position: 'relative',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              left: '0',
                              color: '#667eea',
                              fontWeight: '700',
                            }}
                          >
                            •
                          </span>
                          {children}
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ color: '#667eea', fontWeight: '700' }}>
                          {children}
                        </strong>
                      ),
                      code: ({ children }) => (
                        <code
                          style={{
                            backgroundColor: '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#1e3a8a',
                            fontFamily: 'monospace',
                          }}
                        >
                          {children}
                        </code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote
                          style={{
                            borderLeft: '4px solid #667eea',
                            paddingLeft: '20px',
                            marginLeft: '0',
                            fontStyle: 'italic',
                            color: '#4b5563',
                            backgroundColor: '#f9fafb',
                            padding: '16px 20px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                          }}
                        >
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {analysis}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .ai-analysis-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }

        .ai-analysis-content img {
          max-width: 100%;
          border-radius: 12px;
          margin: 20px 0;
        }

        .ai-analysis-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        .ai-analysis-content th,
        .ai-analysis-content td {
          border: 1px solid #e5e7eb;
          padding: 12px;
          text-align: left;
        }

        .ai-analysis-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}

