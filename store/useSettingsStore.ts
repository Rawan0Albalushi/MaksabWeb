import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, Currency } from '@/types';
import { Locale } from '@/i18n/config';

interface SettingsState {
  locale: Locale;
  currency: Currency | null;
  languages: Language[];
  currencies: Currency[];
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  setLanguages: (languages: Language[]) => void;
  setCurrencies: (currencies: Currency[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: 'ar',
      currency: null,
      languages: [],
      currencies: [],

      setLocale: (locale) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('locale', locale);
          document.documentElement.lang = locale;
          document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
        }
        set({ locale });
      },

      setCurrency: (currency) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('currency_id', String(currency.id));
        }
        set({ currency });
      },

      setLanguages: (languages) => set({ languages }),

      setCurrencies: (currencies) => set({ currencies }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({ locale: state.locale, currency: state.currency }),
    }
  )
);

