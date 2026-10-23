import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Match } from '../../types';
import { Badge } from '../../components/Badge';
import { formatDateTime } from '../../lib/formatters';

export const AthleteSchedule: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['athlete-full-schedule'],
    queryFn: () => apiRequest<{ matches: Match[] }>('/matches?limit=30'),
  });

  const matches = data?.matches || [];

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Personal Athletic Schedule</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Official timetable of collegiate fixtures, assigned arenas, and confirmed results.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Tournament / Stage</th>
                <th style={{ padding: '0.75rem 1rem' }}>Matchup</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Score</th>
                <th style={{ padding: '0.75rem 1rem' }}>Venue</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading schedule...</td></tr>
              ) : matches.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No matches currently on schedule.</td></tr>
              ) : (
                matches.map((m) => (
                  <tr key={m._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{m.roundName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{typeof m.tournamentId === 'object' ? (m.tournamentId as any).name : ''}</div>
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
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {m.scheduledStartTime ? formatDateTime(m.scheduledStartTime) : 'To Be Announced'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
