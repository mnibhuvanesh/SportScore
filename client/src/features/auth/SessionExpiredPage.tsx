import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import styles from './LoginPage.module.css';

export const SessionExpiredPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', backgroundColor: 'var(--color-surface-bg)' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#ffffff', padding: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ width: '56px', height: '56px', background: '#fef3c7', color: '#d97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Clock size={28} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Session Expired</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.75rem' }}>
          For your security, your session has timed out due to inactivity or token renewal limits. Please sign in again.
        </p>
        <Link to="/login?expired=true" className={styles.submitBtn} style={{ textDecoration: 'none' }}>
          Sign In Again <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};
