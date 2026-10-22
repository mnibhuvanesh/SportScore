import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '2rem', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} /> Back
      </Link>

      <div style={{ padding: '0.75rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#92400e' }}>
        <strong>Notice for Organizational Deployment:</strong> These Terms and Conditions constitute a reference template and must be formally verified by institutional counsel.
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FileText size={24} color="var(--color-accent)" /> Terms and Conditions
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>Effective: Academic Year 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.7', fontSize: '0.925rem', color: 'var(--color-text-primary)' }}>
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>1. Authorized Platform Use</h2>
          <p>
            Access to administrative, scheduling, and live scoring capabilities is restricted to verified institutional accounts created via authorized invitation or administrative provisioning.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>2. Integrity of Match Records & Live Scoring</h2>
          <p>
            Official match scorers and organizers are strictly obligated to record factual event outcomes. Non-destructive event-reversal workflows exist solely to preserve historical accuracy without overwriting truth.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>3. Venue & Resource Reservations</h2>
          <p>
            Exclusive venue bookings and equipment allocations are binding upon confirmation. Automated conflict resolution prevents double-booking and enforces maintenance schedules.
          </p>
        </section>
      </div>
    </div>
  );
};
