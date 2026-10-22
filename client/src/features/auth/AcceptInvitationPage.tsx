import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from './AuthContext';
import { User, UserRole } from '../../types';
import styles from './LoginPage.module.css';

const acceptSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    password: z.string().min(10, 'Password must be at least 10 characters long'),
    confirmPassword: z.string(),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AcceptData = z.infer<typeof acceptSchema>;

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [invitationInfo, setInvitationInfo] = useState<{ email: string; role: UserRole } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AcceptData>({
    resolver: zodResolver(acceptSchema),
    mode: 'onChange',
  });

  const currentPassword = watch('password', '');
  const hasMinLength = currentPassword.length >= 10;

  useEffect(() => {
    async function loadInfo() {
      if (!token) {
        setErrorMsg('Invalid or missing invitation link.');
        setLoadingInfo(false);
        return;
      }
      try {
        const data = await apiRequest<{ email: string; role: UserRole }>(`/auth/invitations/info?token=${token}`);
        setInvitationInfo(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Invitation is invalid, expired, or has already been accepted.');
      } finally {
        setLoadingInfo(false);
      }
    }
    loadInfo();
  }, [token]);

  const onSubmit = async (data: AcceptData) => {
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ user: User }>('/auth/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({
          token,
          name: data.name,
          password: data.password,
          phone: data.phone,
        }),
      });

      setUser(res.user);

      const routeMap: Record<string, string> = {
        ADMIN: '/admin',
        ORGANIZER: '/organizer',
        COACH: '/coach',
        ATHLETE: '/athlete',
        SCORER: '/scorer',
      };
      navigate(routeMap[res.user.role] || '/', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept invitation');
    }
  };

  if (loadingInfo) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <span className={styles.spinner} style={{ borderColor: '#0284c7', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', backgroundColor: 'var(--color-surface-bg)' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          <Shield size={16} /> Invitation to Join Sports Platform
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Set Up Your Account</h2>

        {invitationInfo && (
          <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bae6fd', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            <div>Invited Email: <strong>{invitationInfo.email}</strong></div>
            <div>Assigned Role: <strong>{invitationInfo.role}</strong></div>
          </div>
        )}

        {errorMsg && (
          <div className={`${styles.alertBanner} ${styles.alertDanger}`} role="alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {invitationInfo && (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Full Name */}
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>Full Name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                autoFocus
                placeholder="e.g. Marcus Sterling"
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                {...register('name')}
              />
              {errors.name && <span className={styles.fieldError}>{errors.name.message}</span>}
            </div>

            {/* Phone (Optional) */}
            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.label}>Contact Phone (Optional)</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 (555) 000-0000"
                className={styles.input}
                {...register('phone')}
              />
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Create Password</label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 10 characters"
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className={styles.togglePasswordBtn}
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className={styles.fieldError}>{errors.password.message}</span>}

              <div style={{ marginTop: '0.4rem', padding: '0.5rem', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '0.775rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasMinLength ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                  {hasMinLength ? <Check size={14} /> : <X size={14} />}
                  <span>Minimum 10 characters</span>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" disabled={isSubmitting || !hasMinLength} className={styles.submitBtn}>
              {isSubmitting ? 'Activating Account...' : 'Accept Invitation & Sign In'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: '0.85rem' }}>Already have credentials? Sign in</Link>
        </div>
      </div>
    </div>
  );
};
