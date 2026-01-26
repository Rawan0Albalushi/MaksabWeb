'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Apple,
  PlayIcon,
} from 'lucide-react';
import { Button } from '@/components/ui';

const Footer = () => {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');

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

  return (
    <footer className="bg-[var(--black)] text-white">
      {/* Main Footer */}
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* About Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/images/maksab.png"
                alt="Maksab"
                width={140}
                height={46}
                className="h-10 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t('aboutUsText')}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-[var(--primary)] transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-5">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-bold mb-5">{t('support')}</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h3 className="text-lg font-bold mb-5">{t('downloadApp')}</h3>
            <div className="space-y-3">
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-[var(--radius-md)] hover:bg-white/20 transition-colors"
              >
                <Apple size={28} />
                <div>
                  <p className="text-xs text-gray-400">Download on the</p>
                  <p className="font-semibold">App Store</p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-[var(--radius-md)] hover:bg-white/20 transition-colors"
              >
                <PlayIcon size={28} />
                <div>
                  <p className="text-xs text-gray-400">Get it on</p>
                  <p className="font-semibold">Google Play</p>
                </div>
              </a>
            </div>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a
                href="tel:+96893456789"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Phone size={16} />
                +968 9345 6789
              </a>
              <a
                href="mailto:support@maksab.om"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Mail size={16} />
                support@maksab.om
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} {t('copyright')}
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                الشروط والأحكام
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-gray-400 hover:text-white transition-colors"
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

