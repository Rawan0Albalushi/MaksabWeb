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
  Menu,
  X,
  Heart,
  Package,
  LogOut,
  Settings,
  ChevronDown,
  Globe,
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
  const { getItemCount } = useCartStore();
  const { locale, setLocale } = useSettingsStore();

  const cartItemCount = getItemCount();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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

  const handleLogout = async () => {
    logout();
    setIsProfileDropdownOpen(false);
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
    { href: '/', label: t('home') },
    { href: '/shops', label: t('shops') },
    { href: '/categories', label: t('categories') },
  ];

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 inset-x-0 z-40 transition-all duration-300 border-b',
          isScrolled
            ? 'bg-white/98 backdrop-blur-lg shadow-sm border-transparent'
            : 'bg-white border-[var(--border)]'
        )}
      >
        <div className="container">
          <div className="flex items-center justify-between h-[70px] lg:h-[88px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <Image
                src="/images/maksab.png"
                alt="Maksab"
                width={120}
                height={40}
                className="h-8 lg:h-10 w-auto transition-transform group-hover:scale-[1.02]"
              />
            </Link>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'group relative py-2 text-[15px] transition-colors duration-150',
                    pathname === link.href
                      ? 'text-[var(--primary)] font-semibold'
                      : 'text-[var(--text-grey)] font-medium hover:text-[var(--primary)]'
                  )}
                >
                  {link.label}
                  {/* Underline indicator */}
                  <span 
                    className={clsx(
                      'absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[var(--primary)] rounded-full transition-transform duration-200 origin-center',
                      pathname === link.href 
                        ? 'scale-x-100' 
                        : 'scale-x-0 group-hover:scale-x-100'
                    )}
                  />
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Language Selector */}
              <div className="relative hidden sm:block">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLangDropdownOpen(!isLangDropdownOpen);
                    setIsProfileDropdownOpen(false);
                  }}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200',
                    isLangDropdownOpen
                      ? 'bg-[var(--main-bg)]'
                      : 'hover:bg-[var(--main-bg)]'
                  )}
                >
                  <Globe size={18} className="text-[var(--text-grey)]" />
                  <span className="text-sm font-medium text-[var(--black)]">{localeNames[locale]}</span>
                  <ChevronDown 
                    size={14} 
                    className={clsx(
                      'text-[var(--text-grey)] transition-transform duration-200',
                      isLangDropdownOpen && 'rotate-180'
                    )} 
                  />
                </button>

                {isLangDropdownOpen && (
                  <div 
                    className="absolute top-full end-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-[var(--border)] overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => handleLanguageChange('ar')}
                        className={clsx(
                          'w-full px-4 py-2.5 text-start text-sm transition-colors flex items-center justify-between',
                          locale === 'ar' 
                            ? 'text-[var(--primary)] bg-[var(--primary)]/5 font-medium' 
                            : 'hover:bg-[var(--main-bg)]'
                        )}
                      >
                        العربية
                        {locale === 'ar' && <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />}
                      </button>
                      <button
                        onClick={() => handleLanguageChange('en')}
                        className={clsx(
                          'w-full px-4 py-2.5 text-start text-sm transition-colors flex items-center justify-between',
                          locale === 'en' 
                            ? 'text-[var(--primary)] bg-[var(--primary)]/5 font-medium' 
                            : 'hover:bg-[var(--main-bg)]'
                        )}
                      >
                        English
                        {locale === 'en' && <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-[var(--border)] mx-1" />

              {/* Favorites */}
              <Link
                href="/favorites"
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--main-bg)] transition-all duration-200 group"
              >
                <Heart size={20} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--main-bg)] transition-all duration-200 group"
              >
                <ShoppingCart size={20} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[var(--primary)] text-white text-[10px] font-bold rounded-full px-1 animate-in zoom-in duration-200">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>

              {/* Auth */}
              {!_hasHydrated ? (
                // Show loading state while hydrating to prevent flash
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-20 h-9 bg-[var(--main-bg)] rounded-full animate-pulse" />
                </div>
              ) : isAuthenticated ? (
                <div className="relative hidden sm:block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                      setIsLangDropdownOpen(false);
                    }}
                    className={clsx(
                      'flex items-center gap-2 ps-1.5 pe-3 py-1.5 rounded-full transition-all duration-200',
                      isProfileDropdownOpen
                        ? 'bg-[var(--main-bg)]'
                        : 'hover:bg-[var(--main-bg)]'
                    )}
                  >
                    <Avatar
                      src={user?.img}
                      fallback={user?.firstname}
                      size="sm"
                    />
                    <span className="text-sm font-medium max-w-[100px] truncate hidden md:block text-[var(--black)]">
                      {user?.firstname}
                    </span>
                    <ChevronDown 
                      size={14} 
                      className={clsx(
                        'text-[var(--text-grey)] transition-transform duration-200',
                        isProfileDropdownOpen && 'rotate-180'
                      )} 
                    />
                  </button>

                  {isProfileDropdownOpen && (
                    <div 
                      className="absolute top-full end-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-[var(--border)] overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4 bg-gradient-to-br from-[var(--primary)]/5 to-transparent">
                        <p className="font-semibold text-[var(--black)]">
                          {user?.firstname} {user?.lastname}
                        </p>
                        <p className="text-sm text-[var(--text-grey)] mt-0.5">
                          {user?.email || user?.phone}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--main-bg)] transition-colors group"
                        >
                          <User size={18} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
                          {t('profile')}
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--main-bg)] transition-colors group"
                        >
                          <Package size={18} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
                          {t('orders')}
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--main-bg)] transition-colors group"
                        >
                          <Settings size={18} className="text-[var(--text-grey)] group-hover:text-[var(--primary)] transition-colors" />
                          {t('settings')}
                        </Link>
                      </div>
                      <div className="p-2 border-t border-[var(--border)]">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors"
                        >
                          <LogOut size={18} />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="rounded-full">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="rounded-full px-5">{t('register')}</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--main-bg)] transition-all duration-200"
              >
                <div className="relative w-5 h-5">
                  <span 
                    className={clsx(
                      'absolute left-0 w-5 h-0.5 bg-[var(--black)] transition-all duration-200',
                      isMobileMenuOpen ? 'top-[9px] rotate-45' : 'top-1'
                    )} 
                  />
                  <span 
                    className={clsx(
                      'absolute left-0 top-[9px] w-5 h-0.5 bg-[var(--black)] transition-all duration-200',
                      isMobileMenuOpen && 'opacity-0'
                    )} 
                  />
                  <span 
                    className={clsx(
                      'absolute left-0 w-5 h-0.5 bg-[var(--black)] transition-all duration-200',
                      isMobileMenuOpen ? 'top-[9px] -rotate-45' : 'top-[17px]'
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
          'fixed inset-0 z-30 lg:hidden transition-opacity duration-300',
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Mobile Menu Panel */}
        <div
          className={clsx(
            'absolute top-[70px] inset-x-0 bg-white rounded-b-2xl shadow-xl transition-all duration-300 max-h-[calc(100vh-70px)] overflow-y-auto',
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          )}
        >
          {/* Mobile Nav Links */}
          <nav className="p-2">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  'flex items-center px-4 py-3.5 rounded-xl font-medium transition-all duration-200',
                  pathname === link.href
                    ? 'text-[var(--primary)] bg-[var(--primary)]/8'
                    : 'text-[var(--black)] hover:bg-[var(--main-bg)] active:scale-[0.98]'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="ms-auto w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
                )}
              </Link>
            ))}
            <Link
              href="/favorites"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[var(--black)] hover:bg-[var(--main-bg)] transition-all duration-200 active:scale-[0.98]"
            >
              <Heart size={20} className="text-[var(--text-grey)]" />
              {locale === 'ar' ? 'المفضلة' : 'Favorites'}
            </Link>
          </nav>

          {/* Mobile Auth */}
          <div className="p-4 border-t border-[var(--border)]">
            {!_hasHydrated ? (
              // Show loading state while hydrating
              <div className="flex gap-3">
                <div className="flex-1 h-10 bg-[var(--main-bg)] rounded-xl animate-pulse" />
                <div className="flex-1 h-10 bg-[var(--main-bg)] rounded-xl animate-pulse" />
              </div>
            ) : isAuthenticated ? (
              <div className="space-y-4">
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-[var(--primary)]/5 to-transparent"
                >
                  <Avatar src={user?.img} fallback={user?.firstname} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user?.firstname} {user?.lastname}</p>
                    <p className="text-sm text-[var(--text-grey)] truncate">{user?.email || user?.phone}</p>
                  </div>
                  <ChevronDown size={18} className="text-[var(--text-grey)] -rotate-90" />
                </Link>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleLogout}
                  leftIcon={<LogOut size={18} />}
                  className="rounded-xl"
                >
                  {t('logout')}
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/auth/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" fullWidth className="rounded-xl">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/auth/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button fullWidth className="rounded-xl">{t('register')}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Language Selector Mobile */}
          <div className="p-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-grey)] uppercase tracking-wider mb-3 font-medium">{t('language')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageChange('ar')}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  locale === 'ar'
                    ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/25'
                    : 'bg-[var(--main-bg)] text-[var(--black)] hover:bg-[var(--border)]'
                )}
              >
                العربية
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  locale === 'en'
                    ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/25'
                    : 'bg-[var(--main-bg)] text-[var(--black)] hover:bg-[var(--border)]'
                )}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[70px] lg:h-[88px]" />
    </>
  );
};

export default Header;

