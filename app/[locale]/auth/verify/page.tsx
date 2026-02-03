'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services';
import { useAuthStore } from '@/store';

type VerifyStep = 'otp' | 'complete';

interface PendingRegistration {
  method: 'email';
  verifyId: string;
  channel?: number;
  contact: string;
}

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 30;

const VerifyPage = () => {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { login: authLogin, isAuthenticated, _hasHydrated } = useAuthStore();

  // Refs for OTP inputs
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // State
  const [step, setStep] = useState<VerifyStep>('otp');
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false); // Track if we've attempted verification

  // Form data for completing registration
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referral: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      window.location.href = '/';
    }
  }, [_hasHydrated, isAuthenticated]);

  // Load pending registration data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('pendingRegistration');
    if (stored) {
      try {
        const data = JSON.parse(stored) as PendingRegistration;
        setPendingRegistration(data);
        // Pre-fill email
        setFormData(prev => ({ ...prev, email: data.contact }));
      } catch {
        router.push('/auth/register');
      }
    } else {
      router.push('/auth/register');
    }
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Reset attempt flag when OTP changes so auto-submit can work again
    setHasAttempted(false);
    setError('');

    // Auto-focus next input when digit is entered
    if (value && index < OTP_LENGTH - 1) {
      setTimeout(() => {
        otpInputsRef.current[index + 1]?.focus();
      }, 0);
    }
  };

  // Handle OTP input keydown (for backspace)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = useCallback(async () => {
    if (!pendingRegistration) return;
    
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setError(t('invalidOtpLength') || 'يجب إدخال 6 أرقام');
      return;
    }

    setHasAttempted(true);
    setLoading(true);
    setError('');

    try {
      // Verify email code
      const response = await authService.verifyEmailCode(otpCode);

      if (response.status) {
        setVerified(true);
        // Wait a moment to show success animation
        setTimeout(() => {
          setStep('complete');
        }, 800);
      } else {
        setError(response.message || t('invalidOtp') || 'كود التحقق غير صحيح');
      }
    } catch (err: unknown) {
      // Extract error message from axios error response
      let errorMessage = t('verificationFailed') || 'فشل التحقق';
      
      if (err && typeof err === 'object') {
        const axiosError = err as { response?: { data?: { message?: string; status?: boolean } }; message?: string };
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
  }, [otp, pendingRegistration, t]);

  // Auto-submit when OTP is complete (only if not already attempted)
  useEffect(() => {
    if (otp.every(digit => digit !== '') && !loading && !verified && !hasAttempted) {
      handleVerifyOtp();
    }
  }, [otp, loading, verified, hasAttempted, handleVerifyOtp]);

  // Resend OTP
  const handleResendOtp = async () => {
    if (!pendingRegistration || !canResend) return;

    setResending(true);
    setError('');

    try {
      const response = await authService.sendEmailVerificationCode(pendingRegistration.contact);

      if (response.status && response.data) {
        // Update verifyId
        setPendingRegistration(prev => prev ? { ...prev, verifyId: response.data.verifyId } : null);
        sessionStorage.setItem('pendingRegistration', JSON.stringify({
          ...pendingRegistration,
          verifyId: response.data.verifyId,
        }));
        
        // Reset countdown and OTP
        setCountdown(COUNTDOWN_SECONDS);
        setCanResend(false);
        setOtp(Array(OTP_LENGTH).fill(''));
        setHasAttempted(false);
        otpInputsRef.current[0]?.focus();
      } else {
        setError(response.message || t('resendFailed') || 'فشل إعادة الإرسال');
      }
    } catch (err: unknown) {
      let errorMessage = t('resendFailed') || 'فشل إعادة الإرسال';
      
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
      setResending(false);
    }
  };

  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Complete registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingRegistration) return;

    setError('');

    // Validation
    if (!formData.firstName.trim()) {
      setError(t('firstNameRequired') || 'الاسم الأول مطلوب');
      return;
    }

    if (!formData.phone.trim()) {
      setError(t('phoneRequired') || 'رقم الهاتف مطلوب');
      return;
    }

    if (formData.password.length < 8) {
      setError(t('passwordMinLength') || 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordMismatch') || 'كلمة المرور غير متطابقة');
      return;
    }

    setLoading(true);

    try {
      // Complete email registration
      const response = await authService.completeEmailRegistration({
        firstname: formData.firstName,
        lastname: formData.lastName || undefined,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password_conformation: formData.confirmPassword,
        referral: formData.referral || undefined,
      });

      if (response.status && response.data) {
        // Clean up sessionStorage
        sessionStorage.removeItem('pendingRegistration');
        
        // Login user
        const token = response.data.token.replace('Bearer ', '');
        authLogin(response.data.user, token);
        
        // Redirect to home
        window.location.href = '/';
      } else {
        setError(response.message || t('registrationFailed') || 'فشل التسجيل');
      }
    } catch (err: unknown) {
      let errorMessage = t('registrationFailed') || 'فشل التسجيل';
      
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

  // Format countdown time
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!pendingRegistration) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="auth-page min-h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary-dark-hover)]">
      
      {/* Left - Form */}
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

          <AnimatePresence mode="wait">
            {step === 'otp' ? (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* OTP Verification Step */}
                <div className="text-center" style={{ marginBottom: '32px' }}>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary)]/10 mb-4">
                    <Mail size={32} className="text-[var(--primary)]" />
                  </div>
                  <h1 className="text-2xl font-bold text-[var(--primary-dark)]" style={{ marginBottom: '12px' }}>
                    {t('verifyEmail')}
                  </h1>
                  <p className="text-[var(--text-secondary)] text-base">
                    {t('otpSent')} <br />
                    <span className="font-semibold text-[var(--primary-dark)]">{pendingRegistration.contact}</span>
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center gap-3 dir-ltr" style={{ marginBottom: '24px' }}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { otpInputsRef.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
                        if (pastedData) {
                          const newOtp = [...otp];
                          pastedData.split('').forEach((char, i) => {
                            if (index + i < OTP_LENGTH) {
                              newOtp[index + i] = char;
                            }
                          });
                          setOtp(newOtp);
                          setHasAttempted(false);
                          setError('');
                          const nextIndex = Math.min(index + pastedData.length, OTP_LENGTH - 1);
                          otpInputsRef.current[nextIndex]?.focus();
                        }
                      }}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all outline-none ${
                        verified
                          ? 'border-green-500 bg-green-50 text-green-600'
                          : error
                          ? 'border-[var(--error)] bg-[var(--error-light)]'
                          : 'border-[var(--border-color)] focus:border-[var(--primary)] bg-white'
                      }`}
                      disabled={loading || verified}
                    />
                  ))}
                </div>

                {verified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex justify-center mb-4"
                  >
                    <CheckCircle size={48} className="text-green-500" />
                  </motion.div>
                )}

                {error && (
                  <p className="text-sm text-center text-[var(--error)] bg-[var(--error-light)] rounded-md" style={{ marginBottom: '20px', padding: '14px 18px' }}>
                    {error}
                  </p>
                )}

                {/* Countdown & Resend */}
                <div className="text-center" style={{ marginBottom: '24px' }}>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="text-[var(--primary)] font-semibold hover:underline flex items-center justify-center gap-2 mx-auto"
                    >
                      {resending ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          {t('sending') || 'جاري الإرسال...'}
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          {t('resendOtp')}
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="text-[var(--text-secondary)]">
                      {t('resendIn') || 'إعادة الإرسال بعد'} <span className="font-semibold text-[var(--primary-dark)]">{formatCountdown(countdown)}</span>
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  fullWidth
                  size="lg"
                  isLoading={loading}
                  disabled={otp.some(d => !d) || verified}
                  onClick={handleVerifyOtp}
                  style={{ padding: '16px 24px' }}
                >
                  {t('verify') || 'تحقق'}
                </Button>

                <Link
                  href="/auth/register"
                  className="flex items-center justify-center gap-2 mt-6 text-[var(--text-secondary)] hover:text-[var(--primary-dark)] transition-colors"
                >
                  <ArrowRight size={18} />
                  {t('changeContactInfo') || 'تغيير البريد/الهاتف'}
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Complete Registration Step */}
                <div className="text-center" style={{ marginBottom: '32px' }}>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-[var(--primary-dark)]" style={{ marginBottom: '12px' }}>
                    {t('completeRegistration') || 'إكمال التسجيل'}
                  </h1>
                  <p className="text-[var(--text-secondary)] text-base">
                    {t('completeRegistrationSubtitle') || 'أدخل بياناتك لإنشاء حسابك'}
                  </p>
                </div>

                <form onSubmit={handleCompleteRegistration}>
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
                    <Input
                      name="firstName"
                      label={t('firstName')}
                      placeholder={t('firstNamePlaceholder') || 'الاسم الأول'}
                      value={formData.firstName}
                      onChange={handleFormChange}
                      leftIcon={<User size={20} />}
                      required
                    />
                    <Input
                      name="lastName"
                      label={t('lastName')}
                      placeholder={t('lastNamePlaceholder') || 'الاسم الأخير'}
                      value={formData.lastName}
                      onChange={handleFormChange}
                    />
                  </div>

                  {/* Phone field - required for email registration */}
                  <div style={{ marginBottom: '20px' }}>
                    <Input
                      type="tel"
                      name="phone"
                      label={t('phone')}
                      placeholder="968XXXXXXXX"
                      value={formData.phone}
                      onChange={handleFormChange}
                      leftIcon={<Phone size={20} />}
                      hint={t('phoneHint') || 'أدخل الرقم بدون علامة +'}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: '20px' }}>
                    <Input
                      type="password"
                      name="password"
                      label={t('password')}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleFormChange}
                      leftIcon={<Lock size={20} />}
                      hint={t('passwordHint') || 'يجب أن تكون 8 أحرف على الأقل'}
                      required
                    />
                  </div>

                  {/* Confirm Password */}
                  <div style={{ marginBottom: '20px' }}>
                    <Input
                      type="password"
                      name="confirmPassword"
                      label={t('confirmPassword')}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleFormChange}
                      leftIcon={<Lock size={20} />}
                      required
                    />
                  </div>

                  {/* Referral Code (Optional) */}
                  <div style={{ marginBottom: '24px' }}>
                    <Input
                      name="referral"
                      label={`${t('referralCode') || 'كود الإحالة'} (${tCommon('optional')})`}
                      placeholder={t('referralCodePlaceholder') || 'أدخل كود الإحالة'}
                      value={formData.referral}
                      onChange={handleFormChange}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-[var(--error)] bg-[var(--error-light)] rounded-md" style={{ marginBottom: '20px', padding: '14px 18px' }}>
                      {error}
                    </p>
                  )}

                  <Button type="submit" fullWidth size="lg" isLoading={loading} style={{ padding: '16px 24px' }}>
                    {t('createAccount') || 'إنشاء الحساب'}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary-dark-hover)] text-white p-12">
        <div className="text-center max-w-md w-full flex flex-col items-center justify-center">
          <Image src="/images/maksab.png" alt="Maksab Right" width={160} height={53} className="mx-auto" style={{ marginBottom: '48px' }}/>
          <h2 className="text-3xl font-bold text-white" style={{ marginBottom: '20px' }}>
            {step === 'otp' ? (t('verifyYourAccount') || 'تحقق من حسابك') : (t('almostDone') || 'أوشكت على الانتهاء!')}
          </h2>
          <p className="text-lg text-white">
            {step === 'otp' 
              ? (t('verifyDescription') || 'أدخل كود التحقق المرسل إليك للتأكد من هويتك')
              : (t('completeDescription') || 'أكمل بياناتك وابدأ بالاستمتاع بمزايا مكسب')
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
