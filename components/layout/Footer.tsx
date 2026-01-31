'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  Apple,
  PlayIcon,
  ChevronDown,
} from 'lucide-react';

const Footer = () => {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const [openSection, setOpenSection] = useState<string | null>(null);

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'Youtube' },
  ];

  const quickLinks = [
    { href: '/shops', label: tCommon('shops') },
    { href: '/categories', label: tCommon('categories') },
    { href: '/orders', label: tCommon('orders') },
    { href: '/favorites', label: 'المفضلة' },
  ];

  const supportLinks = [
    { href: '/help', label: t('faq') },
    { href: '/contact', label: t('contactUs') },
    { href: '/terms', label: 'الشروط والأحكام' },
    { href: '/privacy', label: 'سياسة الخصوصية' },
  ];

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Collapsible section component for mobile
  const CollapsibleSection = ({
    title,
    sectionKey,
    children,
  }: {
    title: string;
    sectionKey: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-white/10 last:border-b-0 md:border-0">
      {/* Mobile: Collapsible header */}
      <button
        className="flex items-center justify-between w-full py-3.5 md:hidden active:bg-white/5 -mx-1 px-1 rounded-lg"
        onClick={() => toggleSection(sectionKey)}
      >
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <ChevronDown
          size={18}
          className={`text-gray-500 transition-transform duration-300 ease-out ${
            openSection === sectionKey ? 'rotate-180' : ''
          }`}
        />
      </button>
      {/* Desktop: Always visible header */}
      <h3 className="hidden md:block text-base lg:text-lg font-bold mb-4 lg:mb-5">
        {title}
      </h3>
      {/* Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out md:overflow-visible md:max-h-none ${
          openSection === sectionKey ? 'max-h-60 pb-3' : 'max-h-0'
        }`}
      >
        {children}
      </div>
    </div>
  );

  return (
    <footer className="bg-[var(--black)] text-white">
      {/* Mobile: Quick Actions Bar */}
      <div className="md:hidden bg-gradient-to-b from-white/[0.08] to-transparent">
        <div className="px-4 py-4">
          {/* App Download Buttons */}
          <div className="flex gap-2.5 mb-3">
            <a
              href="#"
              className="flex-1 flex items-center justify-center gap-2 h-11 bg-white/10 rounded-xl active:bg-white/20 transition-colors"
            >
              <Apple size={20} />
              <span className="text-[13px] font-semibold">App Store</span>
            </a>
            <a
              href="#"
              className="flex-1 flex items-center justify-center gap-2 h-11 bg-white/10 rounded-xl active:bg-white/20 transition-colors"
            >
              <PlayIcon size={20} />
              <span className="text-[13px] font-semibold">Google Play</span>
            </a>
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-2.5">
            <a
              href="tel:+96893456789"
              className="flex-1 flex items-center justify-center gap-2 h-11 bg-[var(--primary)] text-white rounded-xl active:opacity-90 transition-opacity"
            >
              <Phone size={16} />
              <span className="text-[13px] font-semibold">اتصل بنا</span>
            </a>
            <a
              href="mailto:support@maksab.om"
              className="flex-1 flex items-center justify-center gap-2 h-11 border border-white/20 rounded-xl active:bg-white/10 transition-colors"
            >
              <Mail size={16} />
              <span className="text-[13px] font-medium">راسلنا</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="px-4 md:container py-5 md:py-10 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8 lg:gap-10">
          {/* About Section */}
          <div className="lg:col-span-1 pb-4 md:pb-0 mb-1 md:mb-0 border-b border-white/10 md:border-0">
            <Link href="/" className="inline-block mb-3 md:mb-5">
              <Image
                src="/images/maksab.png"
                alt="Maksab"
                width={120}
                height={40}
                className="h-7 md:h-9 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-gray-400 text-[13px] md:text-sm leading-relaxed mb-4 md:mb-5">
              {t('aboutUsText')}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-[var(--primary)] active:scale-95 transition-all"
                  aria-label={social.label}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <CollapsibleSection title={t('quickLinks')} sectionKey="quick">
            <ul className="space-y-2.5 md:space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white active:text-white/80 transition-colors text-[13px] md:text-sm inline-block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Support Links */}
          <CollapsibleSection title={t('support')} sectionKey="support">
            <ul className="space-y-2.5 md:space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white active:text-white/80 transition-colors text-[13px] md:text-sm inline-block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Download App & Contact - Desktop Only */}
          <div className="hidden md:block">
            <h3 className="text-base lg:text-lg font-bold mb-4 lg:mb-5">
              {t('downloadApp')}
            </h3>
            <div className="space-y-2.5">
              <a
                href="#"
                className="flex items-center gap-3 px-3.5 py-2.5 bg-white/10 rounded-xl hover:bg-white/15 transition-colors"
              >
                <Apple size={24} />
                <div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Download on the
                  </p>
                  <p className="text-sm font-semibold">App Store</p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-3.5 py-2.5 bg-white/10 rounded-xl hover:bg-white/15 transition-colors"
              >
                <PlayIcon size={24} />
                <div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Get it on
                  </p>
                  <p className="text-sm font-semibold">Google Play</p>
                </div>
              </a>
            </div>

            {/* Contact Info */}
            <div className="mt-5 space-y-2.5">
              <a
                href="tel:+96893456789"
                className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-[var(--primary)] transition-colors">
                  <Phone size={14} />
                </div>
                <span dir="ltr">+968 9345 6789</span>
              </a>
              <a
                href="mailto:support@maksab.om"
                className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-[var(--primary)] transition-colors">
                  <Mail size={14} />
                </div>
                support@maksab.om
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="px-4 md:container py-3.5 md:py-5">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-2.5 md:gap-4">
            <p className="text-[11px] md:text-sm text-gray-500">
              © {new Date().getFullYear()} {t('copyright')}
            </p>
            <div className="flex items-center gap-5 md:gap-6">
              <Link
                href="/terms"
                className="text-[11px] md:text-sm text-gray-400 hover:text-white active:text-white/80 transition-colors"
              >
                الشروط والأحكام
              </Link>
              <span className="w-1 h-1 rounded-full bg-gray-600 md:hidden" />
              <Link
                href="/privacy"
                className="text-[11px] md:text-sm text-gray-400 hover:text-white active:text-white/80 transition-colors"
              >
                سياسة الخصوصية
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

