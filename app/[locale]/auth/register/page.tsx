'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, User } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services';

type RegisterMethod = 'email' | 'phone';

const RegisterPage = () => {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();

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
    <div className="min-h-[calc(100vh-80px)] flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] items-center justify-center p-12 relative overflow-hidden">
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
          transition={{ duration: 0.5 }}
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
          <h2 className="text-3xl font-bold mb-4">انضم إلى مكسب</h2>
          <p className="text-lg text-white/80 max-w-sm">
            سجّل الآن واستمتع بعروض حصرية وتوصيل سريع لجميع طلباتك
          </p>

          {/* Features */}
          <div className="mt-10 space-y-4 text-start max-w-xs mx-auto">
            {[
              'توصيل سريع لباب منزلك',
              'عروض وخصومات حصرية',
              'تتبع طلباتك مباشرة',
              'دعم على مدار الساعة',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[var(--main-bg)] lg:bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo - Mobile */}
          <Link href="/" className="inline-block mb-8 lg:hidden">
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
            {t('registerTitle')}
          </h1>
          <p className="text-[var(--text-grey)] mb-8">
            أنشئ حسابك وابدأ بالطلب الآن
          </p>

          {/* Register Method Toggle */}
          <div className="flex bg-[var(--main-bg)] rounded-[var(--radius-md)] p-1 mb-6">
            <button
              type="button"
              onClick={() => setRegisterMethod('email')}
              className={`flex-1 py-2.5 px-4 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                registerMethod === 'email'
                  ? 'bg-white shadow-sm text-[var(--primary)]'
                  : 'text-[var(--text-grey)] hover:text-[var(--black)]'
              }`}
            >
              {t('email')}
            </button>
            <button
              type="button"
              onClick={() => setRegisterMethod('phone')}
              className={`flex-1 py-2.5 px-4 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                registerMethod === 'phone'
                  ? 'bg-white shadow-sm text-[var(--primary)]'
                  : 'text-[var(--text-grey)] hover:text-[var(--black)]'
              }`}
            >
              {t('phone')}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Password */}
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

            {/* Confirm Password */}
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

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                className="w-5 h-5 mt-0.5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[var(--text-grey)]">
                أوافق على{' '}
                <Link href="/terms" className="text-[var(--primary)] hover:underline">
                  الشروط والأحكام
                </Link>{' '}
                و{' '}
                <Link href="/privacy" className="text-[var(--primary)] hover:underline">
                  سياسة الخصوصية
                </Link>
              </span>
            </label>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-[var(--error)] bg-[var(--error-light)] p-3 rounded-[var(--radius-md)]">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <Button type="submit" fullWidth size="lg" isLoading={loading}>
              {t('registerTitle')}
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

          {/* Login Link */}
          <p className="text-center text-[var(--text-grey)] mt-8">
            {t('hasAccount')}{' '}
            <Link
              href="/auth/login"
              className="text-[var(--primary)] font-semibold hover:underline"
            >
              {tCommon('login')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;

