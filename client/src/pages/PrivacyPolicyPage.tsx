import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '2rem', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} /> Back
      </Link>

      <div style={{ padding: '0.75rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#92400e' }}>
        <strong>Notice for Organizational Deployment:</strong> This Privacy Policy template must be reviewed by institutional legal counsel prior to formal production adoption.
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Shield size={24} color="var(--color-accent)" /> Privacy Policy
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>Last updated: Academic Year 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.7', fontSize: '0.925rem', color: 'var(--color-text-primary)' }}>
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>1. Scope and Purpose</h2>
          <p>
            The Centralized Sports Management & Performance Analytics Platform processes collegiate athletic scheduling, tournament administration, live scoring, and athletic performance tracking.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>2. Data Collection and Processing</h2>
          <p>
            We process authenticated user identifiers, institutional email addresses, athletic rosters, jersey assignments, match scoring records, and audit logs. Sensitive credentials (passwords, session secrets) are cryptographically hashed and never stored in plain text.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>3. Protection of Minors' Information</h2>
          <p>
            In accordance with institutional guidelines, dates of birth, contact details, and private athlete profile attributes are strictly restricted from unauthenticated public scoreboards.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>4. Security and Access Controls</h2>
          <p>
            Role-based authorization enforces boundaries across Administrators, Organizers, Coaches, Athletes, and Scorers. Audit logging records administrative and score-correction actions for accountability.
          </p>
        </section>
      </div>
    </div>
  );
};
