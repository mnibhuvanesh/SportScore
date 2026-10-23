import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../../lib/api';
import { Badge } from '../../components/Badge';

export const AthleteDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: scheduleData } = useQuery({
    queryKey: ['athlete-schedule'],
    queryFn: () => apiRequest<{ matches: any[] }>('/matches?limit=5'),
  });

  const matches = scheduleData?.matches || [];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Athlete Portal</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Welcome, {user?.name}. Review your personal athletic schedule and squad fixtures.
        </p>
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{user?.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Institutional Athlete</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Status: <Badge variant="success">ACTIVE</Badge><br />
            Email: <strong>{user?.email}</strong>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>PUBLIC FIXTURES & RESULTS</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Check Championship Standings
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Spectate live games, track points tables and tournament brackets.
            </p>
          </div>
          <Link to="/public/tournaments" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '1rem' }}>
            Open Live Scoreboard <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Upcoming Matches */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>Upcoming Athletic Fixtures</h2>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Stage</th>
                <th style={{ padding: '0.75rem 1rem' }}>Matchup</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Venue</th>
                <th style={{ padding: '0.75rem 1rem' }}>Scheduled Time</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m: any) => (
                <tr key={m._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{m.roundName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <strong>{m.homeTeamId?.name || 'TBD'}</strong> vs <strong>{m.awayTeamId?.name || (m.isBye ? 'BYE' : 'TBD')}</strong>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={m.status === 'LIVE' ? 'live' : m.status === 'COMPLETED' ? 'success' : 'default'}>
                      {m.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    {m.venueId?.name || 'To Be Announced'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {m.scheduledStartTime ? new Date(m.scheduledStartTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending assignment'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
