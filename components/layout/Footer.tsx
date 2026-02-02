'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Twitter,
  Instagram,
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
    { icon: Instagram, href: 'https://www.instagram.com/maksab_oman', label: 'Instagram' },
    { icon: Twitter, href: 'https://x.com/maksab_oman', label: 'Twitter' },
  ];

  const quickLinks = [
    { href: '/shops', label: tCommon('shops') },
    // { href: '/categories', label: tCommon('categories') }, // Hidden temporarily
    { href: '/orders', label: tCommon('orders') },
    // { href: '/favorites', label: 'المفضلة' }, // Hidden temporarily
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
        className="flex items-center justify-between w-full md:hidden active:bg-white/5 rounded-md"
        onClick={() => toggleSection(sectionKey)}
        style={{ padding: '8px 4px' }}
      >
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <ChevronDown
          size={18}
          className={`text-gray-500 transition-transform duration-300 ease-out ${
            openSection === sectionKey ? 'rotate-180' : ''
          }`}
        />
      </button>
      {/* Desktop: Always visible header */}
      <h3 className="hidden md:block text-[13px] lg:text-sm font-bold" style={{ marginBottom: '8px' }}>
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
        <div style={{ padding: '10px 14px' }}>
          {/* App Download Buttons */}
          <div className="flex gap-2" style={{ marginBottom: '8px' }}>
            <a
              href="https://apps.apple.com/om/app/maksab-مكسب/id1668516381"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 rounded-md active:bg-white/20 transition-colors"
              style={{ padding: '8px 10px' }}
            >
              <Apple size={14} />
              <span className="text-[11px] font-semibold">App Store</span>
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=om.thawani.user"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 rounded-md active:bg-white/20 transition-colors"
              style={{ padding: '8px 10px' }}
            >
              <PlayIcon size={14} />
              <span className="text-[11px] font-semibold">Google Play</span>
            </a>
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-2">
            <a
              href="tel:+96893456789"
              className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--primary)] text-white rounded-md active:opacity-90 transition-opacity"
              style={{ padding: '8px 10px' }}
            >
              <Phone size={12} />
              <span className="text-[11px] font-semibold">اتصل بنا</span>
            </a>
            <a
              href="mailto:support@maksab.om"
              className="flex-1 flex items-center justify-center gap-1.5 border border-white/20 rounded-md active:bg-white/10 transition-colors"
              style={{ padding: '8px 10px' }}
            >
              <Mail size={12} />
              <span className="text-[11px] font-medium">راسلنا</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="md:container" style={{ padding: '10px 16px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-8 lg:gap-12">
          {/* About Section */}
          <div className="border-b border-white/10 md:border-0" style={{ paddingBottom: '8px', marginBottom: '2px' }}>
            <Link href="/" className="inline-block" style={{ marginBottom: '6px' }}>
              <Image
                src="/images/maksab.png"
                alt="Maksab"
                width={100}
                height={32}
                className="h-5 md:h-7 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-gray-400 text-[11px] md:text-[12px] leading-relaxed" style={{ marginBottom: '8px' }}>
              {t('aboutUsText')}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-1">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-[var(--primary)] active:scale-95 transition-all"
                  aria-label={social.label}
                >
                  <social.icon size={12} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <CollapsibleSection title={t('quickLinks')} sectionKey="quick">
            <ul className="space-y-1 md:space-y-1.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white active:text-white/80 transition-colors text-[12px] md:text-[13px] inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Download App & Contact - Desktop Only */}
          <div className="hidden md:block">
            <h3 className="text-[13px] lg:text-sm font-bold" style={{ marginBottom: '8px' }}>
              {t('downloadApp')}
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://apps.apple.com/om/app/maksab-مكسب/id1668516381"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 rounded-md hover:bg-white/15 transition-colors"
                style={{ padding: '8px 10px' }}
              >
                <Apple size={18} />
                <div>
                  <p className="text-[8px] text-gray-400 leading-tight">
                    Download on the
                  </p>
                  <p className="text-[12px] font-semibold">App Store</p>
                </div>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=om.thawani.user"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 rounded-md hover:bg-white/15 transition-colors"
                style={{ padding: '8px 10px' }}
              >
                <PlayIcon size={18} />
                <div>
                  <p className="text-[8px] text-gray-400 leading-tight">
                    Get it on
                  </p>
                  <p className="text-[12px] font-semibold">Google Play</p>
                </div>
              </a>
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5" style={{ marginTop: '10px' }}>
              <a
                href="tel:+96893456789"
                className="flex items-center gap-2 text-[12px] text-gray-400 hover:text-white transition-colors group"
              >
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-[var(--primary)] transition-colors">
                  <Phone size={11} />
                </div>
                <span dir="ltr">+968 9345 6789</span>
              </a>
              <a
                href="mailto:support@maksab.om"
                className="flex items-center gap-2 text-[12px] text-gray-400 hover:text-white transition-colors group"
              >
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-[var(--primary)] transition-colors">
                  <Mail size={11} />
                </div>
                support@maksab.om
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="md:container" style={{ padding: '8px 16px' }}>
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-1.5 md:gap-2">
            <p className="text-[9px] md:text-[11px] text-gray-500">
              © {new Date().getFullYear()} {t('copyright')}
            </p>
            <div className="flex items-center gap-3 md:gap-4">
              <Link
                href="/terms"
                className="text-[9px] md:text-[11px] text-gray-400 hover:text-white active:text-white/80 transition-colors"
              >
                الشروط والأحكام
              </Link>
              <span className="w-1 h-1 rounded-full bg-gray-600 md:hidden" />
              <Link
                href="/privacy"
                className="text-[9px] md:text-[11px] text-gray-400 hover:text-white active:text-white/80 transition-colors"
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

