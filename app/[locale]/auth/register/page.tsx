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
import { useSocialAuth, SocialProvider } from '@/hooks';

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
  
  // Social auth
  const { signInWithProvider, isLoading: socialLoading, error: socialError } = useSocialAuth();

  const handleSocialLogin = async (provider: SocialProvider) => {
    setError('');
    const result = await signInWithProvider(provider);
    if (result.success) {
      window.location.href = '/';
    } else if (result.error) {
      setError(result.error);
    }
  };

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
            <Button 
              variant="outline" 
              fullWidth 
              style={{ padding: '14px 20px' }}
              onClick={() => handleSocialLogin('google')}
              disabled={loading || socialLoading}
              isLoading={socialLoading}
            >
              <svg className="w-5 h-5 me-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              style={{ padding: '14px 20px' }}
              onClick={() => handleSocialLogin('apple')}
              disabled={loading || socialLoading}
              isLoading={socialLoading}
            >
              <svg className="w-5 h-5 me-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </Button>
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
