'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const NavigationProgress = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Track navigation start
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    let resetTimeout: NodeJS.Timeout | null = null;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        const href = link.getAttribute('href');
        // Check if it's an internal navigation
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
          const newPath = href;
          
          // Don't show progress for same-page links
          if (newPath !== currentPath && !href.startsWith('#')) {
            setIsNavigating(true);
            setProgress(0);
            
            // Simulate progress
            progressInterval = setInterval(() => {
              setProgress(prev => {
                if (prev >= 90) {
                  return prev;
                }
                // Fast start, then slow down
                const increment = prev < 50 ? 15 : prev < 80 ? 8 : 3;
                return Math.min(prev + increment, 90);
              });
            }, 100);
          }
        }
      }
    };

    // Add event listener
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      if (progressInterval) clearInterval(progressInterval);
      if (resetTimeout) clearTimeout(resetTimeout);
    };
  }, [pathname, searchParams]);

  // Complete progress when route changes
  useEffect(() => {
    if (isNavigating) {
      // Complete the progress bar
      setProgress(100);
      
      // Reset after animation
      const timeout = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [pathname, searchParams]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] pointer-events-none">
      {/* Progress bar */}
      <div 
        className="h-[3px] bg-gradient-to-r from-[var(--primary)] via-[var(--primary-light)] to-[var(--primary)] transition-all duration-200 ease-out shadow-lg shadow-[var(--primary)]/50"
        style={{ 
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'opacity 300ms ease-out, width 150ms ease-out' : 'width 150ms ease-out'
        }}
      />
      
      {/* Glow effect */}
      <div 
        className="absolute end-0 top-0 w-24 h-[3px] bg-gradient-to-l from-white/80 to-transparent"
        style={{ 
          transform: `translateX(${progress === 100 ? '100%' : '0'})`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
};

export default NavigationProgress;
