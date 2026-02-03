'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services';
import { useAuthStore } from '@/store';

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

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email) {
      setError(t('emailRequired') || 'البريد الإلكتروني مطلوب');
      return;
    }

    setLoading(true);

    try {
      // Send verification code to email
      const response = await authService.sendEmailVerificationCode(email);

      if (response.status && response.data) {
        // Store the contact info in sessionStorage for the verify page
        sessionStorage.setItem('pendingRegistration', JSON.stringify({
          method: 'email',
          verifyId: response.data.verifyId,
          channel: response.data.channel,
          contact: email,
        }));

        // Navigate to verification page
        router.push('/auth/verify');
      } else {
        setError(response.message || t('sendCodeFailed') || 'فشل إرسال كود التحقق');
      }
    } catch (err: unknown) {
      let errorMessage = t('errorOccurred') || 'حدث خطأ';
      
      if (err && typeof err === 'object') {
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary-dark-hover)]">
      
      {/* Left - Register Form on Background */}
      <div className="flex items-center justify-center bg-gradient-to-br from-[#FFF2EE] via-[#F4F8F7] to-[#80d1cd]/30" style={{ padding: '24px 28px' }}>
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
              {t('registerSubtitleEmail') || 'أدخل بريدك الإلكتروني للبدء'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '24px' }}>
              <Input
                type="email"
                name="email"
                label={t('email')}
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={20} />}
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
                {t('agreeToTerms') || 'أوافق على'}{' '}
                <Link href="/terms" className="text-[var(--primary-dark)] font-bold hover:underline">
                  {t('termsAndConditions') || 'الشروط والأحكام'}
                </Link>{' '}
                {t('and') || 'و'}{' '}
                <Link href="/privacy" className="text-[var(--primary-dark)] font-bold hover:underline">
                  {t('privacyPolicy') || 'سياسة الخصوصية'}
                </Link>
              </span>
            </label>

            {error && (
              <p className="text-sm text-[var(--error)] bg-[var(--error-light)] rounded-md" style={{ marginBottom: '20px', padding: '14px 18px' }}>
                {error}
              </p>
            )}

            <div style={{ marginBottom: '32px' }}>
              <Button 
                type="submit" 
                fullWidth 
                size="lg" 
                isLoading={loading} 
                style={{ padding: '16px 24px' }}
                rightIcon={<ArrowLeft size={20} />}
              >
                {t('sendVerificationCode') || 'إرسال كود التحقق'}
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
          <h2 className="text-3xl font-bold text-white" style={{ marginBottom: '20px' }}>{t('joinMaksab') || 'انضم إلى مكسب'}</h2>
          <p className="text-lg text-white">
            {t('registerBenefit') || 'سجّل الآن واستمتع بعروض حصرية وتوصيل سريع لجميع طلباتك'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
