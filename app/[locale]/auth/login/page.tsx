'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services';
import { useAuthStore } from '@/store';

const LoginPage = () => {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { login, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      window.location.href = '/';
    }
  }, [_hasHydrated, isAuthenticated]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      if (response.status && response.data) {
        login(response.data.user, response.data.token);
        window.location.href = '/';
      } else {
        setError(response.message || 'Login failed');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary-dark-hover)]">
      
      {/* Left - Login Form on Background */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex justify-center" style={{ marginBottom: '32px' }}>
            <Image src="/images/maksab.png" alt="Maksab" width={140} height={46} />
          </div>

          <div className="text-center" style={{ marginBottom: '32px' }}>
            <h1 className="text-3xl font-bold" style={{ marginBottom: '12px' }}>
              {t('loginTitle')}
            </h1>
            <p className="text-white text-base">
              أهلاً بك مرة أخرى، سجّل دخولك للمتابعة
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <Input
                type="email"
                label={t('email')}
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={20} />}
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Input
                type="password"
                label={t('password')}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={20} />}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm" style={{ marginBottom: '24px' }}>
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[var(--primary)] cursor-pointer" />
                <span>{t('rememberMe')}</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-white hover:text-white/90 hover:underline transition-colors font-medium"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            {error && (
              <p className="text-sm text-[var(--error)] bg-[var(--error-light)] p-3 rounded-md" style={{ marginBottom: '20px' }}>
                {error}
              </p>
            )}

            <div style={{ marginBottom: '32px' }}>
              <Button type="submit" fullWidth size="lg" isLoading={loading}>
                {t('loginTitle')}
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-4" style={{ marginTop: '32px', marginBottom: '32px' }}>
            <div className="flex-1 h-px bg-[var(--primary-dark)]/40" />
            <span className="text-sm font-medium">
              {t('orContinueWith')}
            </span>
            <div className="flex-1 h-px bg-[var(--primary-dark)]/40" />
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '32px' }}>
            <Button variant="outline" fullWidth>Google</Button>
            <Button variant="outline" fullWidth>Apple</Button>
          </div>

          <p className="text-center text-sm" style={{ marginTop: '24px' }}>
            {t('noAccount')}{' '}
            <Link href="/auth/register" className="text-white font-bold hover:text-white/90 hover:underline transition-colors">
              {tCommon('register')}
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary-dark-hover)] text-white p-12">
        <div className="text-center max-w-md w-full flex flex-col items-center justify-center">
          <Image src="/images/maksab.png" alt="Maksab Right" width={160} height={53} className="mx-auto" style={{ marginBottom: '48px' }}/>
          <h2 className="text-3xl font-bold text-white" style={{ marginBottom: '20px' }}>مرحباً بك في مكسب</h2>
          <p className="text-lg text-white">
            اكتشف أفضل المتاجر والمطاعم واحصل على توصيل سريع لباب منزلك
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;