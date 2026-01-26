'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import {
  ShoppingCart,
  User,
  Heart,
  Package,
  LogOut,
  Settings,
  ChevronDown,
  Globe,
  Home,
  Store,
  Grid3X3,
} from 'lucide-react';
import { Button, Avatar } from '@/components/ui';
import { useAuthStore, useCartStore, useSettingsStore } from '@/store';
import { Locale, localeNames } from '@/i18n/config';

const Header = () => {
  const t = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const { getItemCount, _hasHydrated: cartHasHydrated } = useCartStore();
  const { locale, setLocale } = useSettingsStore();

  const cartItemCount = cartHasHydrated ? getItemCount() : 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileDropdownOpen(false);
      setIsLangDropdownOpen(false);
    };

    if (isProfileDropdownOpen || isLangDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileDropdownOpen, isLangDropdownOpen]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    logout();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsLangDropdownOpen(false);
    
    // Get the current path without the locale prefix
    const currentPathname = pathname;
    const segments = currentPathname.split('/');
    
    // Replace the locale segment (first segment after empty string)
    if (segments.length > 1 && (segments[1] === 'ar' || segments[1] === 'en')) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    
    const newPath = segments.join('/') || `/${newLocale}`;
    
    // Navigate to the new locale path
    router.push(newPath);
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/shops', label: t('shops'), icon: Store },
    { href: '/categories', label: t('categories'), icon: Grid3X3 },
    // Show orders link only when authenticated
    ...(isAuthenticated ? [{ href: '/orders', label: t('orders'), icon: Package }] : []),
  ];

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 inset-x-0 z-40 transition-all duration-500 ease-out',
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)] border-b border-white/50'
            : 'bg-white/60 backdrop-blur-md border-b border-transparent'
        )}
      >
        {/* Subtle gradient overlay for glass effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
        
        <div className="container relative">
          <div className="flex items-center justify-between h-16 sm:h-[68px] lg:h-[76px]">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center gap-2 shrink-0 group relative z-10"
            >
              <Image
                src="/images/maksab.png"
                alt="Maksab"
                width={120}
                height={40}
                className="h-7 sm:h-8 lg:h-9 w-auto transition-all duration-300 group-hover:scale-[1.03] group-active:scale-[0.98]"
                priority
              />
            </Link>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center gap-8 xl:gap-12 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || 
                  (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      'relative py-2 text-[15px] font-medium transition-all duration-300 whitespace-nowrap group',
                      isActive
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--text-grey)] hover:text-[var(--black)]'
                    )}
                  >
                    {link.label}
                    {/* Underline indicator */}
                    <span 
                      className={clsx(
                        'absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full transition-all duration-300',
                        isActive 
                          ? 'bg-[var(--primary)] scale-x-100' 
                          : 'bg-[var(--primary)] scale-x-0 group-hover:scale-x-100'
                      )}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1.5">
              {/* Language Selector - Desktop */}
              <div className="relative hidden md:block">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLangDropdownOpen(!isLangDropdownOpen);
                    setIsProfileDropdownOpen(false);
                  }}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-300',
                    isLangDropdownOpen
                      ? 'bg-[var(--main-bg)] shadow-inner'
                      : 'hover:bg-[var(--main-bg)]/70'
                  )}
                >
                  <Globe size={17} className="text-[var(--text-grey)]" />
                  <span className="text-sm font-medium text-[var(--black)] hidden lg:inline">{localeNames[locale]}</span>
                  <ChevronDown 
                    size={14} 
                    className={clsx(
                      'text-[var(--text-grey)] transition-transform duration-300',
                      isLangDropdownOpen && 'rotate-180'
                    )} 
                  />
                </button>

                {/* Language Dropdown */}
                <div 
                  className={clsx(
                    'absolute top-full end-0 mt-2 min-w-[160px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 border border-white/50 overflow-hidden z-50 transition-all duration-300 origin-top',
                    isLangDropdownOpen
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-2 px-2">
                    <button
                      onClick={() => handleLanguageChange('ar')}
                      className={clsx(
                        'w-full rounded-xl text-sm transition-all duration-200 flex items-center justify-between',
                        locale === 'ar' 
                          ? 'text-[var(--primary)] bg-[var(--primary)]/8 font-semibold' 
                          : 'text-[var(--black)] hover:bg-[var(--main-bg)]'
                      )}
                      style={{ padding: '12px 20px' }}
                    >
                      <span>العربية</span>
                      {locale === 'ar' && (
                        <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
                      )}
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={clsx(
                        'w-full rounded-xl text-sm transition-all duration-200 flex items-center justify-between',
                        locale === 'en' 
                          ? 'text-[var(--primary)] bg-[var(--primary)]/8 font-semibold' 
                          : 'text-[var(--black)] hover:bg-[var(--main-bg)]'
                      )}
                      style={{ padding: '12px 20px' }}
                    >
                      <span>English</span>
                      {locale === 'en' && (
                        <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider - Desktop */}
              <div className="hidden md:block w-px h-5 bg-[var(--border)]/60 mx-1" />

              {/* Favorites - Desktop */}
              <Link
                href="/favorites"
                className="hidden sm:flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-[var(--main-bg)]/70 active:scale-95 transition-all duration-200 group"
              >
                <Heart 
                  size={19} 
                  className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors duration-200" 
                />
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-[var(--main-bg)]/70 active:scale-95 transition-all duration-200 group"
              >
                <ShoppingCart 
                  size={19} 
                  className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors duration-200" 
                />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[var(--primary)] text-white text-[10px] font-bold rounded-full px-1 shadow-md shadow-[var(--primary)]/30 animate-in zoom-in duration-200">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>

              {/* Auth Section */}
              {!_hasHydrated ? (
                // Loading state
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-20 h-9 bg-[var(--main-bg)]/70 rounded-full animate-pulse" />
                </div>
              ) : isAuthenticated ? (
                // User Profile Dropdown - Desktop
                <div className="relative hidden sm:block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                      setIsLangDropdownOpen(false);
                    }}
                    className={clsx(
                      'flex items-center gap-2 ps-1 pe-2.5 py-1 rounded-full transition-all duration-300',
                      isProfileDropdownOpen
                        ? 'bg-[var(--main-bg)] shadow-inner'
                        : 'hover:bg-[var(--main-bg)]/70'
                    )}
                  >
                    <Avatar
                      src={user?.img}
                      fallback={user?.firstname}
                      size="sm"
                    />
                    <span className="text-sm font-medium max-w-[80px] truncate hidden md:block text-[var(--black)]">
                      {user?.firstname}
                    </span>
                    <ChevronDown 
                      size={14} 
                      className={clsx(
                        'text-[var(--text-grey)] transition-transform duration-300',
                        isProfileDropdownOpen && 'rotate-180'
                      )} 
                    />
                  </button>

                  {/* Profile Dropdown */}
                  <div 
                    className={clsx(
                      'absolute top-full end-0 mt-2 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 border border-white/50 overflow-hidden z-50 transition-all duration-300 origin-top',
                      isProfileDropdownOpen
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* User Info */}
                    <div className="bg-gradient-to-br from-[var(--primary)]/8 to-transparent" style={{ padding: '14px 20px' }}>
                      <p className="font-semibold text-[var(--black)] truncate">
                        {user?.firstname} {user?.lastname}
                      </p>
                      <p className="text-xs text-[var(--text-grey)] mt-0.5 truncate">
                        {user?.email || user?.phone}
                      </p>
                    </div>
                    
                    {/* Menu Items */}
                    <div style={{ padding: '8px 12px' }}>
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-xl text-sm hover:bg-[var(--main-bg)] transition-colors group"
                        style={{ padding: '12px 16px' }}
                      >
                        <User size={17} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
                        <span className="text-[var(--black)]">{t('profile')}</span>
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-xl text-sm hover:bg-[var(--main-bg)] transition-colors group"
                        style={{ padding: '12px 16px' }}
                      >
                        <Package size={17} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
                        <span className="text-[var(--black)]">{t('orders')}</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-xl text-sm hover:bg-[var(--main-bg)] transition-colors group"
                        style={{ padding: '12px 16px' }}
                      >
                        <Settings size={17} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
                        <span className="text-[var(--black)]">{t('settings')}</span>
                      </Link>
                    </div>
                    
                    {/* Logout */}
                    <div className="border-t border-[var(--border)]/50" style={{ padding: '8px 12px' }}>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full rounded-xl text-sm text-[var(--error)] hover:bg-[var(--error)]/8 transition-colors"
                        style={{ padding: '12px 16px' }}
                      >
                        <LogOut size={17} />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Auth Buttons - Desktop
                <div className="hidden sm:flex items-center gap-1.5 ms-1">
                  <Link href="/auth/login">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full text-[13px] h-9 hover:bg-[var(--main-bg)]/70"
                      style={{ padding: '8px 20px' }}
                    >
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button 
                      size="sm" 
                      className="rounded-full text-[13px] h-9 shadow-md shadow-[var(--primary)]/20 !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-hover)]"
                      style={{ padding: '8px 20px' }}
                    >
                      {t('register')}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-[var(--main-bg)]/70 active:scale-95 transition-all duration-200 ms-0.5"
                aria-label="Toggle menu"
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <span 
                    className={clsx(
                      'absolute w-5 h-[2px] bg-[var(--black)] rounded-full transition-all duration-300',
                      isMobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'
                    )} 
                  />
                  <span 
                    className={clsx(
                      'absolute w-5 h-[2px] bg-[var(--black)] rounded-full transition-all duration-300',
                      isMobileMenuOpen && 'opacity-0 scale-0'
                    )} 
                  />
                  <span 
                    className={clsx(
                      'absolute w-5 h-[2px] bg-[var(--black)] rounded-full transition-all duration-300',
                      isMobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'
                    )} 
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Full Screen Drawer */}
      <div
        className={clsx(
          'fixed inset-0 z-50 lg:hidden transition-all duration-400',
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop with blur */}
        <div
          className={clsx(
            'absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-400',
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Mobile Menu Drawer - Slide from side */}
        <div
          className={clsx(
            'absolute top-0 bottom-0 w-[85%] max-w-[340px] bg-white shadow-2xl shadow-black/30 transition-all duration-400 ease-out flex flex-col',
            locale === 'ar' ? 'right-0' : 'left-0',
            isMobileMenuOpen 
              ? 'translate-x-0' 
              : locale === 'ar' ? 'translate-x-full' : '-translate-x-full'
          )}
        >
          {/* Drawer Header with gradient */}
          <div className="relative bg-gradient-to-br from-[var(--primary)] via-[var(--primary)] to-[var(--primary-light)] pt-safe-top">
            {/* Decorative circles */}
            <div className="absolute top-0 end-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 start-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
            
            <div className="relative p-5 pt-14">
              {/* Close Button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 end-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-white">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>

              {/* User Section in Header */}
              {_hasHydrated && isAuthenticated ? (
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 group"
                >
                  <div className="relative">
                    <Avatar src={user?.img} fallback={user?.firstname} size="lg" className="ring-2 ring-white/30" />
                    <div className="absolute -bottom-0.5 -end-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-[17px] truncate group-hover:underline">
                      {user?.firstname} {user?.lastname}
                    </p>
                    <p className="text-white/70 text-sm truncate mt-0.5">
                      {user?.email || user?.phone}
                    </p>
                  </div>
                  <ChevronDown size={18} className="text-white/60 -rotate-90 rtl:rotate-90 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <div>
                  <Image
                    src="/images/maksab.png"
                    alt="Maksab"
                    width={100}
                    height={32}
                    className="h-7 w-auto brightness-0 invert opacity-90"
                  />
                  <p className="text-white/70 text-sm mt-2">
                    {locale === 'ar' ? 'مرحباً بك في مكسب' : 'Welcome to Maksab'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Navigation Links */}
            <nav className="p-4 space-y-1.5">
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href || 
                  (link.href !== '/' && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-semibold text-[15px] transition-all duration-200 active:scale-[0.98]',
                      isActive
                        ? 'text-[var(--primary)] bg-[var(--primary)]/10'
                        : 'text-[var(--black)] hover:bg-[var(--main-bg)]'
                    )}
                    style={{
                      transform: isMobileMenuOpen ? 'translateX(0)' : locale === 'ar' ? 'translateX(20px)' : 'translateX(-20px)',
                      opacity: isMobileMenuOpen ? 1 : 0,
                      transition: `all 0.3s ease ${index * 50 + 100}ms`
                    }}
                  >
                    <span className={clsx(
                      'w-10 h-10 flex items-center justify-center rounded-xl transition-colors',
                      isActive 
                        ? 'bg-[var(--primary)]/15' 
                        : 'bg-[var(--main-bg)]'
                    )}>
                      <Icon size={20} className={isActive ? 'text-[var(--primary)]' : 'text-[var(--text-grey)]'} />
                    </span>
                    <span className="flex-1">{link.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 bg-[var(--primary)] rounded-full" />
                    )}
                  </Link>
                );
              })}
              
              {/* Favorites Link */}
              <Link
                href="/favorites"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[var(--black)] hover:bg-[var(--main-bg)] font-semibold text-[15px] transition-all duration-200 active:scale-[0.98]"
                style={{
                  transform: isMobileMenuOpen ? 'translateX(0)' : locale === 'ar' ? 'translateX(20px)' : 'translateX(-20px)',
                  opacity: isMobileMenuOpen ? 1 : 0,
                  transition: `all 0.3s ease ${navLinks.length * 50 + 100}ms`
                }}
              >
                <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--main-bg)]">
                  <Heart size={20} className="text-[var(--text-grey)]" />
                </span>
                <span className="flex-1">{locale === 'ar' ? 'المفضلة' : 'Favorites'}</span>
              </Link>
            </nav>

            {/* Divider */}
            <div className="mx-6 h-px bg-[var(--border)]/60" />

            {/* Settings Link for Authenticated Users */}
            {_hasHydrated && isAuthenticated && (
              <>
                <div className="p-4 space-y-1.5">
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[var(--black)] hover:bg-[var(--main-bg)] font-semibold text-[15px] transition-all duration-200 active:scale-[0.98]"
                  >
                    <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--main-bg)]">
                      <Settings size={20} className="text-[var(--text-grey)]" />
                    </span>
                    <span className="flex-1">{t('settings')}</span>
                  </Link>
                </div>
                <div className="mx-6 h-px bg-[var(--border)]/60" />
              </>
            )}

            {/* Auth Section for Non-Authenticated Users */}
            {_hasHydrated && !isAuthenticated && (
              <>
                <div className="p-4 space-y-2">
                  <p className="text-sm text-[var(--text-grey)] px-2 mb-3">
                    {locale === 'ar' ? 'سجل دخولك للحصول على تجربة أفضل' : 'Sign in for a better experience'}
                  </p>
                  <div className="flex gap-2">
                    <Link href="/auth/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button 
                        variant="outline" 
                        fullWidth 
                        className="rounded-xl h-11 font-semibold text-[14px] border-2"
                      >
                        {t('login')}
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button 
                        fullWidth 
                        className="rounded-xl h-11 shadow-md shadow-[var(--primary)]/20 font-bold text-[14px] !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-hover)]"
                      >
                        {t('register')}
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="mx-6 h-px bg-[var(--border)]/60" />
              </>
            )}

            {/* Language Section */}
            <div className="p-4">
              <p className="text-xs text-[var(--text-grey)] uppercase tracking-wider mb-3 px-2 font-semibold flex items-center gap-2">
                <Globe size={14} />
                {t('language')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange('ar')}
                  className={clsx(
                    'flex-1 py-3 px-4 rounded-xl text-[14px] font-bold transition-all duration-200 active:scale-[0.98] border-2',
                    locale === 'ar'
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]'
                      : 'bg-[var(--main-bg)] text-[var(--black)] border-transparent hover:bg-[var(--border)]/50'
                  )}
                >
                  العربية
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={clsx(
                    'flex-1 py-3 px-4 rounded-xl text-[14px] font-bold transition-all duration-200 active:scale-[0.98] border-2',
                    locale === 'en'
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]'
                      : 'bg-[var(--main-bg)] text-[var(--black)] border-transparent hover:bg-[var(--border)]/50'
                  )}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Footer - Logout for Authenticated Users */}
          {_hasHydrated && isAuthenticated && (
            <div className="border-t border-[var(--border)]/60 p-4 pb-safe-bottom bg-white">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-3 w-full h-14 rounded-xl text-white font-semibold text-[16px] transition-all duration-200 active:scale-[0.98]"
                style={{ 
                  backgroundColor: '#E53935',
                  boxShadow: '0 4px 6px -1px rgba(229, 57, 53, 0.3)'
                }}
              >
                <LogOut size={20} />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spacer for fixed header - responsive */}
      <div className="h-16 sm:h-[68px] lg:h-[76px]" />
    </>
  );
};

export default Header;

