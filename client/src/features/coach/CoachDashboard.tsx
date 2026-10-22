import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Team, Match } from '../../types';
import { Badge } from '../../components/Badge';

export const CoachDashboard: React.FC = () => {
  const { data: teamsData, isLoading: loadingTeams } = useQuery({
    queryKey: ['coach-teams'],
    queryFn: () => apiRequest<{ teams: Team[] }>('/teams'),
  });

  const { data: matchesData } = useQuery({
    queryKey: ['coach-matches'],
    queryFn: () => apiRequest<{ matches: Match[] }>('/matches?limit=6'),
  });

  const teams = teamsData?.teams || [];
  const matches = matchesData?.matches || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Coach Management Center</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage collegiate team rosters, register for championships, and track squad analytics.
          </p>
        </div>

        <Link
          to="/coach/teams"
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
          <Plus size={16} /> Manage Teams & Rosters
        </Link>
      </div>

      {/* Coach Teams Grid */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>My Teams</h2>

        {loadingTeams ? (
          <div>Loading team data...</div>
        ) : teams.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: '#ffffff', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>You have not created any teams yet.</p>
            <Link to="/coach/teams" style={{ fontWeight: 600 }}>Create your first squad &rarr;</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {teams.map((team) => (
              <div
                key={team._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{team.name}</h3>
                    <Badge variant="info">{team.code}</Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    Official Email: {team.contactEmail}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <Link
                    to={`/coach/teams/${team._id}`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem',
                      background: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                    }}
                  >
                    Edit Roster <ArrowRight size={14} style={{ marginLeft: '0.25rem' }} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Team Fixtures */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>Scheduled Team Matches</h2>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Tournament / Stage</th>
                <th style={{ padding: '0.75rem 1rem' }}>Fixture</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Score</th>
                <th style={{ padding: '0.75rem 1rem' }}>Venue</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{m.roundName}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <strong>{m.homeTeamId?.name || 'TBD'}</strong> vs <strong>{m.awayTeamId?.name || (m.isBye ? 'BYE' : 'TBD')}</strong>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
