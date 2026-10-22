import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { UserCheck, Mail, Phone, Calendar } from 'lucide-react';
import { Badge } from '../../components/Badge';
import { formatDate, formatPhoneNumber } from '../../lib/formatters';

export const AthleteProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '650px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Athlete Profile</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Your verified institutional athlete credentials and active collegiate standing.
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{user?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Badge variant="info">ATHLETE</Badge>
              <Badge variant="success">ACTIVE</Badge>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Mail size={16} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-muted)', width: '120px' }}>Email:</span>
            <strong>{user?.email}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Phone size={16} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-muted)', width: '120px' }}>Phone:</span>
            <strong>{formatPhoneNumber(user?.phone)}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={16} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-muted)', width: '120px' }}>Member Since:</span>
            <strong>{user?.createdAt ? formatDate(user.createdAt) : 'Academic 2026'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
