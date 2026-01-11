'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services';
import { useAuthStore } from '@/store';

type LoginMethod = 'email' | 'phone';

const LoginPage = () => {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { login, isAuthenticated, _hasHydrated } = useAuthStore();

  // Redirect if already authenticated (on page load)
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      window.location.href = '/';
    }
  }, [_hasHydrated, isAuthenticated]);

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials = loginMethod === 'email' 
        ? { email, password }
        : { phone, password };

      const response = await authService.login(credentials);
      
      if (response.status && response.data) {
        // Store token and user data
        login(response.data.user, response.data.token);
        // Use full page redirect to ensure token is used in subsequent requests
        window.location.href = '/';
      } else {
        setError(response.message || 'Login failed');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      setLoading(false);
    }
    // Don't set loading to false on success - let the redirect happen
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="inline-block mb-8">
            <Image
              src="/images/maksab.png"
              alt="Maksab"
              width={140}
              height={46}
              className="h-10 w-auto"
            />
          </Link>

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--black)] mb-2">
            {t('loginTitle')}
          </h1>
          <p className="text-[var(--text-grey)] mb-8">
            أهلاً بك مرة أخرى! سجّل دخولك للمتابعة
          </p>

          {/* Login Method Toggle */}
          <div className="flex bg-[var(--main-bg)] rounded-[var(--radius-md)] p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2.5 px-4 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-white shadow-sm text-[var(--primary)]'
                  : 'text-[var(--text-grey)] hover:text-[var(--black)]'
              }`}
            >
              {t('email')}
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2.5 px-4 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                loginMethod === 'phone'
                  ? 'bg-white shadow-sm text-[var(--primary)]'
                  : 'text-[var(--text-grey)] hover:text-[var(--black)]'
              }`}
            >
              {t('phone')}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {loginMethod === 'email' ? (
              <Input
                type="email"
                label={t('email')}
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={20} />}
                required
              />
            ) : (
              <Input
                type="tel"
                label={t('phone')}
                placeholder="+968 XXXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone size={20} />}
                required
              />
            )}

            <Input
              type="password"
              label={t('password')}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={20} />}
              required
            />

            {/* Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text-grey)]">
                  {t('rememberMe')}
                </span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-[var(--primary)] hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-[var(--error)] bg-[var(--error-light)] p-3 rounded-[var(--radius-md)]">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <Button type="submit" fullWidth size="lg" isLoading={loading}>
              {t('loginTitle')}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-sm text-[var(--text-grey)]">
              {t('orContinueWith')}
            </span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Social Login */}
          <div className="flex gap-4">
            <Button variant="outline" fullWidth className="gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t('google')}
            </Button>
            <Button variant="outline" fullWidth className="gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              {t('apple')}
            </Button>
          </div>

          {/* Register Link */}
          <p className="text-center text-[var(--text-grey)] mt-8">
            {t('noAccount')}{' '}
            <Link
              href="/auth/register"
              className="text-[var(--primary)] font-semibold hover:underline"
            >
              {tCommon('register')}
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary-dark-hover)] items-center justify-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center text-white relative z-10"
        >
          <div className="w-48 h-48 mx-auto mb-8 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Image
              src="/images/maksab.png"
              alt="Maksab"
              width={160}
              height={53}
              className="w-32 brightness-0 invert"
            />
          </div>
          <h2 className="text-3xl font-bold mb-4">مرحباً بك في مكسب</h2>
          <p className="text-lg text-white/80 max-w-sm">
            اكتشف أفضل المتاجر والمطاعم واحصل على توصيل سريع لباب منزلك
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;

