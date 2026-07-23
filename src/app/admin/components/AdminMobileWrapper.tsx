'use client';

import { useEffect } from 'react';
import { useSidebar } from './SidebarContext';

/**
 * Component to FORCE responsive behavior on admin pages
 * This runs client-side and aggressively overrides ALL inline styles
 */
export default function AdminMobileWrapper({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen } = useSidebar();
  
  useEffect(() => {
    const forceResponsiveStyles = () => {
      const isMobile = window.innerWidth <= 768;
      
      // Find ALL main elements
      const mainElements = document.querySelectorAll('main');
      
      mainElements.forEach((main) => {
        const htmlMain = main as HTMLElement;
        
        if (isMobile) {
          // Mobile: force margin-left 0
          htmlMain.style.setProperty('margin-left', '0', 'important');
          htmlMain.style.setProperty('margin-right', '0', 'important');
          htmlMain.style.setProperty('padding', '80px 16px 16px 16px', 'important');
          htmlMain.style.setProperty('max-width', '100%', 'important');
          htmlMain.style.setProperty('width', '100%', 'important');
          htmlMain.style.setProperty('box-sizing', 'border-box', 'important');
        } else {
          // Desktop: adjust margin-left based on sidebar state
          const marginLeft = isSidebarOpen ? '260px' : '64px';
          htmlMain.style.setProperty('margin-left', marginLeft, 'important');
          htmlMain.style.setProperty('transition', 'margin-left 0.3s ease-in-out', 'important');
          htmlMain.style.removeProperty('margin-right');
          htmlMain.style.removeProperty('max-width');
          htmlMain.style.removeProperty('width');
        }
      });

      // Fix tables to be scrollable on mobile
      if (isMobile) {
        document.querySelectorAll('table').forEach((table) => {
          const wrapper = table.parentElement;
          if (wrapper) {
            wrapper.style.setProperty('overflow-x', 'auto', 'important');
            wrapper.style.setProperty('display', 'block', 'important');
          }
        });
      }
    };

    // Run immediately
    forceResponsiveStyles();
    
    // Run on resize with debounce
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(forceResponsiveStyles, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also run when DOM changes (for dynamic content)
    const observer = new MutationObserver(forceResponsiveStyles);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [isSidebarOpen]); // Re-run when sidebar state changes

  return <>{children}</>;
}

