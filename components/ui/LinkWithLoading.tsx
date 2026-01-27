'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, forwardRef } from 'react';
import { clsx } from 'clsx';

interface LinkWithLoadingProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
  className?: string;
  showLoadingIndicator?: boolean;
  loadingClassName?: string;
}

const LinkWithLoading = forwardRef<HTMLAnchorElement, LinkWithLoadingProps>(
  ({ children, className, showLoadingIndicator = false, loadingClassName, ...props }, ref) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = useState(false);

    // Get target href
    const targetHref = typeof props.href === 'string' ? props.href : props.href.pathname || '';

    // Check if we're already on the target page
    const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    const isSamePage = targetHref === currentPath || targetHref === pathname;

    const handleClick = () => {
      if (!isSamePage && targetHref.startsWith('/')) {
        setIsNavigating(true);
      }
    };

    // Reset navigation state when route changes
    useEffect(() => {
      setIsNavigating(false);
    }, [pathname, searchParams]);

    // Reset after timeout (fallback)
    useEffect(() => {
      if (isNavigating) {
        const timeout = setTimeout(() => {
          setIsNavigating(false);
        }, 5000);
        return () => clearTimeout(timeout);
      }
    }, [isNavigating]);

    return (
      <Link
        ref={ref}
        {...props}
        onClick={(e) => {
          handleClick();
          props.onClick?.(e as any);
        }}
        className={clsx(
          className,
          isNavigating && 'pointer-events-none',
          isNavigating && loadingClassName
        )}
      >
        {showLoadingIndicator && isNavigating ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </span>
        ) : (
          children
        )}
      </Link>
    );
  }
);

LinkWithLoading.displayName = 'LinkWithLoading';

export default LinkWithLoading;
