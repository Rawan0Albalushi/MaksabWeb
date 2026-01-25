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
                      'absolute top-full end-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 border border-white/50 overflow-hidden z-50 transition-all duration-300 origin-top',
                      isProfileDropdownOpen
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* User Info */}
                    <div className="p-3 bg-gradient-to-br from-[var(--primary)]/8 to-transparent">
                      <p className="font-semibold text-[var(--black)] truncate">
                        {user?.firstname} {user?.lastname}
                      </p>
                      <p className="text-xs text-[var(--text-grey)] mt-0.5 truncate">
                        {user?.email || user?.phone}
                      </p>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="p-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--main-bg)] transition-colors group"
                      >
                        <User size={17} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
                        <span className="text-[var(--black)]">{t('profile')}</span>
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--main-bg)] transition-colors group"
                      >
                        <Package size={17} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
                        <span className="text-[var(--black)]">{t('orders')}</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--main-bg)] transition-colors group"
                      >
                        <Settings size={17} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
                        <span className="text-[var(--black)]">{t('settings')}</span>
                      </Link>
                    </div>
                    
                    {/* Logout */}
                    <div className="p-1.5 border-t border-[var(--border)]/50">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[var(--error)] hover:bg-[var(--error)]/8 transition-colors"
                      >
                        <LogOut size={17} />
                        {t('logout')}
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

      {/* Mobile Menu Overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-30 lg:hidden transition-all duration-300',
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={clsx(
            'absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300',
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Mobile Menu Panel */}
        <div
          className={clsx(
            'absolute top-[72px] sm:top-[76px] inset-x-0 mx-4 sm:mx-6 bg-white rounded-3xl shadow-2xl shadow-black/25 transition-all duration-300 max-h-[calc(100vh-90px)] sm:max-h-[calc(100vh-100px)] overflow-hidden',
            isMobileMenuOpen 
              ? 'translate-y-0 opacity-100 scale-100' 
              : '-translate-y-6 opacity-0 scale-95'
          )}
        >
          <div className="overflow-y-auto max-h-[calc(100vh-110px)] sm:max-h-[calc(100vh-120px)] overscroll-contain p-5 sm:p-6">
            
            {/* Menu Header */}
            <div className="pb-4 flex items-center justify-between" style={{ padding: '0 4px 16px 4px' }}>
              <h3 className="text-lg font-bold text-[var(--black)]">
                {locale === 'ar' ? 'القائمة' : 'Menu'}
              </h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--main-bg)] hover:bg-[var(--border)] transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-grey)]">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="pb-5 space-y-3">
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
                      'flex items-center gap-4 rounded-2xl font-semibold text-[15px] transition-all duration-200',
                      isActive
                        ? 'text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] shadow-lg shadow-[var(--primary)]/30'
                        : 'text-[var(--black)] bg-[var(--main-bg)]/50 hover:bg-[var(--main-bg)] active:scale-[0.98]'
                    )}
                    style={{ 
                      padding: '16px 20px',
                      animationDelay: `${index * 60}ms`,
                      animation: isMobileMenuOpen ? `fadeInUp 0.35s ease ${index * 60}ms forwards` : 'none',
                      opacity: isMobileMenuOpen ? 1 : 0
                    }}
                  >
                    <span className={clsx(
                      'w-10 h-10 flex items-center justify-center rounded-xl transition-colors',
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-white shadow-sm'
                    )}>
                      <Icon size={20} className={isActive ? 'text-white' : 'text-[var(--primary)]'} />
                    </span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              
              {/* Favorites Link */}
              <Link
                href="/favorites"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 rounded-2xl text-[var(--black)] bg-[var(--main-bg)]/50 hover:bg-[var(--main-bg)] font-semibold text-[15px] transition-all duration-200 active:scale-[0.98]"
                style={{ padding: '16px 20px' }}
              >
                <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm">
                  <Heart size={20} className="text-[var(--primary)]" />
                </span>
                <span>{locale === 'ar' ? 'المفضلة' : 'Favorites'}</span>
              </Link>
            </nav>

            {/* Divider */}
            <div className="my-3 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

            {/* Mobile Auth Section */}
            <div className="py-4">
              {!_hasHydrated ? (
                <div className="flex gap-4">
                  <div className="flex-1 h-14 bg-[var(--main-bg)] rounded-2xl animate-pulse" />
                  <div className="flex-1 h-14 bg-[var(--main-bg)] rounded-2xl animate-pulse" />
                </div>
              ) : isAuthenticated ? (
                <div className="space-y-4">
                  {/* User Profile Card */}
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 via-[var(--primary)]/5 to-transparent border border-[var(--primary)]/10 hover:border-[var(--primary)]/20 transition-all active:scale-[0.99]"
                    style={{ padding: '16px 20px' }}
                  >
                    <Avatar src={user?.img} fallback={user?.firstname} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--black)] truncate text-[16px]">
                        {user?.firstname} {user?.lastname}
                      </p>
                      <p className="text-sm text-[var(--text-grey)] truncate mt-0.5">
                        {user?.email || user?.phone}
                      </p>
                    </div>
                    <ChevronDown size={20} className="text-[var(--text-grey)] -rotate-90 rtl:rotate-90" />
                  </Link>
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2.5 rounded-2xl bg-[var(--main-bg)] hover:bg-[var(--border)]/50 transition-colors font-semibold text-[14px]"
                      style={{ padding: '14px 20px' }}
                    >
                      <Package size={18} className="text-[var(--primary)]" />
                      <span>{t('orders')}</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2.5 rounded-2xl bg-[var(--main-bg)] hover:bg-[var(--border)]/50 transition-colors font-semibold text-[14px]"
                      style={{ padding: '14px 20px' }}
                    >
                      <Settings size={18} className="text-[var(--primary)]" />
                      <span>{t('settings')}</span>
                    </Link>
                  </div>
                  
                  {/* Logout Button */}
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleLogout}
                    leftIcon={<LogOut size={18} />}
                    className="rounded-2xl h-13 py-3.5 border-2 border-[var(--error)]/20 text-[var(--error)] hover:bg-[var(--error)]/8 font-semibold"
                    style={{ padding: '14px 20px' }}
                  >
                    {t('logout')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-sm text-[var(--text-grey)] mb-4">
                    {locale === 'ar' ? 'سجل دخولك للحصول على تجربة أفضل' : 'Sign in for a better experience'}
                  </p>
                  <div className="flex gap-3">
                    <Link href="/auth/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" fullWidth className="rounded-2xl h-13 py-3.5 border-2 font-semibold" style={{ padding: '14px 20px' }}>
                        {t('login')}
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button fullWidth className="rounded-2xl h-13 py-3.5 shadow-lg shadow-[var(--primary)]/25 font-semibold !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-hover)]" style={{ padding: '14px 20px' }}>
                        {t('register')}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="my-3 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

            {/* Language Selector - Mobile */}
            <div className="py-4">
              <p className="text-xs text-[var(--text-grey)] uppercase tracking-widest mb-4 font-bold flex items-center gap-2" style={{ paddingInlineStart: '4px' }}>
                <Globe size={14} />
                {t('language')}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleLanguageChange('ar')}
                  className={clsx(
                    'flex-1 rounded-2xl text-[15px] font-bold transition-all duration-300',
                    locale === 'ar'
                      ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[var(--primary)]/30'
                      : 'bg-[var(--main-bg)] text-[var(--black)] hover:bg-[var(--border)]/50 active:scale-[0.98]'
                  )}
                  style={{ padding: '16px 20px' }}
                >
                  <span>العربية</span>
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={clsx(
                    'flex-1 rounded-2xl text-[15px] font-bold transition-all duration-300',
                    locale === 'en'
                      ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[var(--primary)]/30'
                      : 'bg-[var(--main-bg)] text-[var(--black)] hover:bg-[var(--border)]/50 active:scale-[0.98]'
                  )}
                  style={{ padding: '16px 20px' }}
                >
                  <span>English</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Spacer for fixed header - responsive */}
      <div className="h-16 sm:h-[68px] lg:h-[76px]" />
    </>
  );
};

export default Header;

