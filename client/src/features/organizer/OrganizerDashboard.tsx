import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Badge } from '../../components/Badge';
import { formatDate } from '../../lib/formatters';

export const OrganizerDashboard: React.FC = () => {
  const { data: tournamentsData } = useQuery({
    queryKey: ['organizer-tournaments'],
    queryFn: () => apiRequest<{ tournaments: any[]; pagination: any }>('/tournaments?limit=6'),
  });

  const { data: matchesData } = useQuery({
    queryKey: ['organizer-upcoming-matches'],
    queryFn: () => apiRequest<{ matches: any[] }>('/matches?limit=6'),
  });

  const tournaments = tournamentsData?.tournaments || [];
  const matches = matchesData?.matches || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Tournament Organizer Center</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage collegiate athletic competitions, registration reviews, and venue allocations.
          </p>
        </div>

        <Link
          to="/organizer/tournaments/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            backgroundColor: 'var(--color-accent)',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          <Plus size={16} /> Create Tournament
        </Link>
      </div>

      {/* Tournaments Grid */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tournaments</h2>
          <Link to="/organizer/tournaments" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {tournaments.map((t: any) => (
            <Link
              key={t._id}
              to={`/organizer/tournaments/${t._id}`}
              style={{
                textDecoration: 'none',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 150ms ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{t.name}</h3>
                  <Badge variant={t.status === 'IN_PROGRESS' ? 'live' : t.status === 'COMPLETED' ? 'success' : 'default'}>
                    {t.status}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                  {t.sportId?.name} &bull; Format: {t.format.replace(/_/g, ' ')}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <span>Max Teams: {t.maxTeams}</span>
                <span>Starts: {formatDate(t.startDate)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming & Live Matches */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>Recent & Upcoming Matches</h2>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Match / Round</th>
                <th style={{ padding: '0.75rem 1rem' }}>Teams</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Score</th>
                <th style={{ padding: '0.75rem 1rem' }}>Venue</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Scorer</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m: any) => (
                <tr key={m._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{m.roundName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.tournamentId?.name}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>
                      {m.homeTeamId?.name || 'TBD'} <span style={{ color: '#94a3b8' }}>vs</span> {m.awayTeamId?.name || (m.isBye ? 'BYE' : 'TBD')}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={m.status === 'LIVE' ? 'live' : m.status === 'COMPLETED' ? 'success' : 'default'}>
                      {m.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                    {m.status === 'SCHEDULED' ? '-' : `${m.homeScore} : ${m.awayScore}`}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    {m.venueId?.name || 'Unassigned'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {m.assignedScorerId?.name || 'Unassigned'}
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
