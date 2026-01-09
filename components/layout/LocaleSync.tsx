'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store';
import { Locale, locales } from '@/i18n/config';

const LocaleSync = () => {
  const pathname = usePathname();
  const { locale, setLocale } = useSettingsStore();

  useEffect(() => {
    // Extract locale from URL path
    const segments = pathname.split('/');
    const urlLocale = segments[1] as Locale;

    // If the URL has a valid locale that's different from the store, sync it
    if (locales.includes(urlLocale) && urlLocale !== locale) {
      setLocale(urlLocale);
    }
  }, [pathname, locale, setLocale]);

  return null;
};

export default LocaleSync;
