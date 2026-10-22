import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  CalendarCheck,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { apiRequest, ApiError } from '../../lib/api';
import { User } from '../../types';
import { PitchSvg } from '../../components/PitchSvg';
import styles from './LoginPage.module.css';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export const LoginPage: React.FC = () => {
  const { setUser, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isExpiredNotice = searchParams.get('expired') === 'true';
  const isResetSuccess = searchParams.get('reset') === 'success';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
    mode: 'onBlur',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      const redirectMap: Record<string, string> = {
        ADMIN: '/admin',
        ORGANIZER: '/organizer',
        COACH: '/coach',
        ATHLETE: '/athlete',
        SCORER: '/scorer',
      };
      navigate(redirectMap[role] || '/', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining === null || lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setFormError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const handleKeyEvent = (e: React.KeyboardEvent) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await apiRequest<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setUser(res.user);

      // Redirect to role-specific dashboard
      const routeMap: Record<string, string> = {
        ADMIN: '/admin',
        ORGANIZER: '/organizer',
        COACH: '/coach',
        ATHLETE: '/athlete',
        SCORER: '/scorer',
      };
      navigate(routeMap[res.user.role] || '/', { replace: true });
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 429 && err.remainingSeconds) {
          setLockoutRemaining(err.remainingSeconds);
          setFormError(`Too many failed login attempts. Please wait ${err.remainingSeconds}s before retrying.`);
        } else {
          setFormError(err.message || 'Email or password is incorrect.');
        }
      } else {
        setFormError('Unable to reach authentication server. Please check your network connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Pitch & Branding Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.brandHeader}>
          <div className={styles.badge}>
            <ShieldCheck size={14} /> Collegiate Athletics Platform
          </div>
          <h1 className={styles.platformTitle}>
            Centralized Sports Management & Performance Analytics Platform
          </h1>
        </div>

        <div className={styles.illustrationWrapper}>
          <PitchSvg className={styles.courtSvg} />
        </div>

        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <CalendarCheck className={styles.featureIcon} size={18} />
            <span>Schedule tournaments and venues without clashes.</span>
          </div>
          <div className={styles.featureItem}>
            <Smartphone className={styles.featureIcon} size={18} />
            <span>Enter scores live from any phone.</span>
          </div>
          <div className={styles.featureItem}>
            <TrendingUp className={styles.featureIcon} size={18} />
            <span>Track player and team performance over time.</span>
          </div>
        </div>
      </div>

      {/* Right Sign-in Form Panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Sign in</h2>
            <p className={styles.formSubtitle}>Enter your credentials to access your sports portal</p>
          </div>

          {/* Alert States */}
          {isResetSuccess && (
            <div className={`${styles.alertBanner} ${styles.alertSuccess}`} role="alert">
              <CheckCircle size={18} />
              <span>Password reset successfully. Sign in with your new password.</span>
            </div>
          )}

          {isExpiredNotice && (
            <div className={`${styles.alertBanner} ${styles.alertInfo}`} role="alert">
              <AlertCircle size={18} />
              <span>Your session has expired. Please sign in again to continue.</span>
            </div>
          )}

          {formError && (
            <div className={`${styles.alertBanner} ${styles.alertDanger}`} role="alert">
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email Field */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="email" className={styles.label}>
                  Email
                </label>
              </div>
              <input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                disabled={isSubmitting || !!lockoutRemaining}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="name@institution.edu"
                {...register('email')}
              />
              {errors.email && <span className={styles.fieldError}>{errors.email.message}</span>}
            </div>

            {/* Password Field */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <Link to="/forgot-password" className={styles.forgotLink} tabIndex={0}>
                  Forgot password?
                </Link>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isSubmitting || !!lockoutRemaining}
                  onKeyDown={handleKeyEvent}
                  onKeyUp={handleKeyEvent}
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  placeholder="Enter your password"
                  {...register('password')}
                />
                <button
                  type="button"
                  className={styles.togglePasswordBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {capsLockActive && (
                <div className={styles.capsLockWarning}>
                  <AlertTriangle size={13} /> Caps Lock is ON
                </div>
              )}
              {errors.password && <span className={styles.fieldError}>{errors.password.message}</span>}
            </div>

            {/* Keep me signed in */}
            <div className={styles.checkboxRow}>
              <input
                id="rememberMe"
                type="checkbox"
                disabled={isSubmitting || !!lockoutRemaining}
                className={styles.checkbox}
                {...register('rememberMe')}
              />
              <label htmlFor="rememberMe" className={styles.checkboxLabel}>
                Keep me signed in on this device
              </label>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || !!lockoutRemaining}
              className={styles.submitBtn}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} /> Signing in...
                </>
              ) : lockoutRemaining ? (
                `Locked (${lockoutRemaining}s)`
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* View Public Live Scores */}
          <Link to="/public/tournaments" className={styles.publicScoresLink}>
            View live scores without signing in &rarr;
          </Link>

          {/* Account Access Notice (No signup link per specs) */}
          <div className={styles.organizerNotice}>
            Accounts are created by your organizer. Contact them if you need access.
          </div>

          {/* Footer */}
          <div className={styles.formFooter}>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span>&bull;</span>
            <Link to="/terms">Terms and Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
