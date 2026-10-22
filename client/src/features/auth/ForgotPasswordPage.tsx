import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import styles from './LoginPage.module.css';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
});

type ForgotData = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotData) => {
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ message: string; devResetUrl?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setIsSuccess(true);
      if (res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit request');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', backgroundColor: 'var(--color-surface-bg)' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#ffffff', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Sign in
        </Link>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Forgot your password?</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          Enter your registered institutional email address and we will provide password reset instructions.
        </p>

        {errorMsg && (
          <div className={`${styles.alertBanner} ${styles.alertDanger}`} role="alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess ? (
          <div>
            <div className={`${styles.alertBanner} ${styles.alertSuccess}`} role="alert">
              <CheckCircle size={18} />
              <span>If an account exists with this email, password reset instructions have been generated.</span>
            </div>
            {devResetUrl && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                <strong>Development Reset Link:</strong><br />
                <a href={devResetUrl} style={{ wordBreak: 'break-all' }}>{devResetUrl}</a>
              </div>
            )}
            <Link to="/login" className={styles.submitBtn} style={{ marginTop: '1.5rem', textDecoration: 'none' }}>
              Return to Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Institutional Email</label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="name@institution.edu"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  {...register('email')}
                />
              </div>
              {errors.email && <span className={styles.fieldError}>{errors.email.message}</span>}
            </div>

            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
              {isSubmitting ? 'Submitting...' : 'Send Reset Instructions'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
