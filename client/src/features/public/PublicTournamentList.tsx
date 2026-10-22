import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Tournament } from '../../types';
import { Badge } from '../../components/Badge';
import { formatDate } from '../../lib/formatters';

export const PublicTournamentList: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['public-tournaments-browser'],
    queryFn: () => apiRequest<{ tournaments: Tournament[] }>('/tournaments?limit=30'),
  });

  const tournaments = data?.tournaments || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b12', color: '#ffffff', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--color-accent)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Collegiate Athletics Championship Center</h1>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Live match tracking, results, and tournament brackets</p>
            </div>
          </div>

          <Link
            to="/login"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Institutional Sign In &rarr;
          </Link>
        </header>

        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Championship Tournaments</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Select any competition to view live scoreboard, round progression, and official points standings.
          </p>
        </div>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#0f172a', borderRadius: 'var(--radius-md)' }}>
            No public tournaments currently active.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {tournaments.map((t) => (
              <Link
                key={t._id}
                to={`/public/tournaments/${t._id}`}
                style={{
                  textDecoration: 'none',
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'border-color 150ms ease, transform 150ms ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>{t.name}</h3>
                    <Badge variant={t.status === 'IN_PROGRESS' ? 'live' : t.status === 'COMPLETED' ? 'success' : 'default'}>
                      {t.status}
                    </Badge>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {t.description || 'Collegiate athletics championship.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                  <span>{formatDate(t.startDate)} &ndash; {formatDate(t.endDate)}</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    View Live <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
