import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import styles from './LoginPage.module.css';

export const ForbiddenPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', backgroundColor: 'var(--color-surface-bg)' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', padding: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ width: '56px', height: '56px', background: '#fee2e2', color: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>403 &mdash; Access Restricted</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.75rem' }}>
          You do not have the required permissions or authorized scope to access this section of the sports platform.
        </p>
        <Link to="/" className={styles.submitBtn} style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
};
