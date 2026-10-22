import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { TournamentRegistration } from '../../types';
import { Badge } from '../../components/Badge';
import { formatDate } from '../../lib/formatters';

export const CoachRegistrationList: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['coach-registrations-list'],
    queryFn: () => apiRequest<{ registrations: TournamentRegistration[] }>('/registrations/my'),
  });

  const registrations = data?.registrations || [];

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Tournament Participation Requests</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Track organizer reviews, seedings, and entry decisions for your teams.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Tournament</th>
                <th style={{ padding: '0.75rem 1rem' }}>Team Entry</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Organizer Feedback</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date Submitted</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading registration decisions...</td></tr>
              ) : registrations.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No tournament registration requests found.</td></tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      {typeof reg.tournamentId === 'object' ? (reg.tournamentId as any).name : 'Tournament'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong>{reg.teamId?.name}</strong> <span style={{ color: '#94a3b8' }}>[{reg.teamId?.code}]</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <Badge variant={reg.status === 'APPROVED' ? 'success' : reg.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {reg.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                      {reg.rejectionReason || (reg.status === 'APPROVED' ? 'Approved for official championship bracket.' : 'Under review by tournament organizer.')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {formatDate(reg.createdAt)}
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
