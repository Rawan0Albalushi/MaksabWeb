'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  // Prevent flash on initial load
  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0.9, y: 8 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.2,
            ease: [0.25, 0.1, 0.25, 1]
          }
        }}
        exit={{ 
          opacity: 0.9,
          transition: {
            duration: 0.1,
            ease: [0.25, 0.1, 0.25, 1]
          }
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
