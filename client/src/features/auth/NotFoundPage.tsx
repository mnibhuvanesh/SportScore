import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import styles from './LoginPage.module.css';

export const NotFoundPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', backgroundColor: 'var(--color-surface-bg)' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', padding: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ width: '56px', height: '56px', background: '#f1f5f9', color: '#475569', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <HelpCircle size={28} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>404 &mdash; Page Not Found</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.75rem' }}>
          The requested tournament, match, or resource page could not be located.
        </p>
        <Link to="/" className={styles.submitBtn} style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Return to Homepage
        </Link>
      </div>
    </div>
  );
};
