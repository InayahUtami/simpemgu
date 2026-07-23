'use client';

import React from 'react';

interface MainLayoutWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function MainLayoutWrapper({ children, className = '' }: MainLayoutWrapperProps) {
  return (
    <div className={`main-layout-wrapper ${className}`}>
      {children}
      <style jsx>{`
        .main-layout-wrapper {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .main-layout-wrapper {
            padding: 0 12px;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .main-layout-wrapper {
            padding: 0 24px;
          }
        }

        @media (min-width: 1025px) {
          .main-layout-wrapper {
            padding: 0 32px;
          }
        }
      `}</style>
    </div>
  );
}

