import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import styles from './LoginPage.module.css';

const resetSchema = z
  .object({
    password: z.string().min(10, 'Password must be at least 10 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetData = z.infer<typeof resetSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
  });

  const currentPassword = watch('password', '');
  const hasMinLength = currentPassword.length >= 10;
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(currentPassword);

  const onSubmit = async (data: ResetData) => {
    setErrorMsg(null);
    if (!token) {
      setErrorMsg('Reset token is missing or invalid.');
      return;
    }

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: data.password }),
      });
      navigate('/login?reset=success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', backgroundColor: 'var(--color-surface-bg)' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#ffffff', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create New Password</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          Please set a secure password for your account.
        </p>

        {errorMsg && (
          <div className={`${styles.alertBanner} ${styles.alertDanger}`} role="alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* New Password */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>New Password</label>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 10 characters"
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

            {/* Inline Password Rules Checklist */}
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '0.775rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasMinLength ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {hasMinLength ? <Check size={14} /> : <X size={14} />}
                <span>Minimum 10 characters in length</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasNumberOrSymbol ? 'var(--color-success)' : 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                {hasNumberOrSymbol ? <Check size={14} /> : <X size={14} />}
                <span>Contains a number or special character</span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword.message}</span>}
          </div>

          <button type="submit" disabled={isSubmitting || !hasMinLength} className={styles.submitBtn}>
            {isSubmitting ? 'Saving Password...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: '0.85rem' }}>Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
};
