'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, User } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services';
import { useAuthStore } from '@/store';

type RegisterMethod = 'email' | 'phone';

const RegisterPage = () => {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      window.location.href = '/';
    }
  }, [_hasHydrated, isAuthenticated]);

  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>('email');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        firstname: formData.firstName,
        lastname: formData.lastName,
        email: registerMethod === 'email' ? formData.email : undefined,
        phone: registerMethod === 'phone' ? formData.phone : undefined,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      };

      const response = await authService.register(registerData);

      if (response.status && response.data) {
        // Navigate to verification page
        router.push(`/auth/verify?verifyId=${response.data.verifyId}&method=${registerMethod}`);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary-dark-hover)]">
      
      {/* Left - Register Form on Background */}
      <div className="flex items-center justify-center bg-gradient-to-br from-[#FFF5F3] via-[#F5FAFA] to-[#E8F7F7]" style={{ padding: '24px 28px' }}>
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
            <h1 className="text-3xl font-bold text-[var(--primary-dark)]" style={{ marginBottom: '12px' }}>
              {t('registerTitle')}
            </h1>
            <p className="text-[var(--text-secondary)] text-base">
              أنشئ حسابك وابدأ بالطلب الآن
            </p>
          </div>

          {/* Register Method Toggle */}
          <div className="flex bg-[var(--primary-dark)]/15 rounded-lg" style={{ marginBottom: '24px', padding: '4px' }}>
            <button
              type="button"
              onClick={() => setRegisterMethod('email')}
              className={`flex-1 rounded-md text-sm font-semibold transition-all ${
                registerMethod === 'email'
                  ? 'bg-white text-[var(--primary-dark)] shadow-sm'
                  : 'text-[var(--primary-dark)]/60 hover:text-[var(--primary-dark)]'
              }`}
              style={{ padding: '12px 18px' }}
            >
              {t('email')}
            </button>
            <button
              type="button"
              onClick={() => setRegisterMethod('phone')}
              className={`flex-1 rounded-md text-sm font-semibold transition-all ${
                registerMethod === 'phone'
                  ? 'bg-white text-[var(--primary-dark)] shadow-sm'
                  : 'text-[var(--primary-dark)]/60 hover:text-[var(--primary-dark)]'
              }`}
              style={{ padding: '12px 18px' }}
            >
              {t('phone')}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
              <Input
                name="firstName"
                label={t('firstName')}
                placeholder="الاسم الأول"
                value={formData.firstName}
                onChange={handleChange}
                leftIcon={<User size={20} />}
                required
              />
              <Input
                name="lastName"
                label={t('lastName')}
                placeholder="الاسم الأخير"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            {/* Email or Phone */}
            <div style={{ marginBottom: '20px' }}>
              {registerMethod === 'email' ? (
                <Input
                  type="email"
                  name="email"
                  label={t('email')}
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  leftIcon={<Mail size={20} />}
                  required
                />
              ) : (
                <Input
                  type="tel"
                  name="phone"
                  label={t('phone')}
                  placeholder="+968 XXXX XXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  leftIcon={<Phone size={20} />}
                  required
                />
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <Input
                type="password"
                name="password"
                label={t('password')}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                leftIcon={<Lock size={20} />}
                hint="يجب أن تكون 6 أحرف على الأقل"
                required
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '24px' }}>
              <Input
                type="password"
                name="confirmPassword"
                label={t('confirmPassword')}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                leftIcon={<Lock size={20} />}
                required
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer text-[var(--text-primary)]" style={{ marginBottom: '24px' }}>
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-0.5 accent-[var(--primary)] cursor-pointer"
              />
              <span className="text-sm">
                أوافق على{' '}
                <Link href="/terms" className="text-[var(--primary-dark)] font-bold hover:underline">
                  الشروط والأحكام
                </Link>{' '}
                و{' '}
                <Link href="/privacy" className="text-[var(--primary-dark)] font-bold hover:underline">
                  سياسة الخصوصية
                </Link>
              </span>
            </label>

            {error && (
              <p className="text-sm text-[var(--error)] bg-[var(--error-light)] rounded-md" style={{ marginBottom: '20px', padding: '14px 18px' }}>
                {error}
              </p>
            )}

            <div style={{ marginBottom: '32px' }}>
              <Button type="submit" fullWidth size="lg" isLoading={loading} style={{ padding: '16px 24px' }}>
                {t('registerTitle')}
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-4" style={{ marginTop: '32px', marginBottom: '32px' }}>
            <div className="flex-1 h-px bg-[var(--border-color)]" />
            <span className="text-sm font-medium text-[var(--text-secondary)]" style={{ padding: '0 12px' }}>
              {t('orContinueWith')}
            </span>
            <div className="flex-1 h-px bg-[var(--border-color)]" />
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '32px' }}>
            <Button variant="outline" fullWidth style={{ padding: '14px 20px' }}>Google</Button>
            <Button variant="outline" fullWidth style={{ padding: '14px 20px' }}>Apple</Button>
          </div>

          <p className="text-center text-sm text-[var(--text-secondary)]" style={{ marginTop: '24px' }}>
            {t('hasAccount')}{' '}
            <Link href="/auth/login" className="text-[var(--primary)] font-bold hover:text-[var(--primary-hover)] hover:underline transition-colors">
              {tCommon('login')}
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary-dark-hover)] text-white p-12">
        <div className="text-center max-w-md w-full flex flex-col items-center justify-center">
          <Image src="/images/maksab.png" alt="Maksab Right" width={160} height={53} className="mx-auto" style={{ marginBottom: '48px' }}/>
          <h2 className="text-3xl font-bold text-white" style={{ marginBottom: '20px' }}>انضم إلى مكسب</h2>
          <p className="text-lg text-white">
            سجّل الآن واستمتع بعروض حصرية وتوصيل سريع لجميع طلباتك
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
