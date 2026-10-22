import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Badge } from '../../components/Badge';

export const AuditLogsViewer: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter],
    queryFn: () => {
      let q = `/users/audit-logs?page=${page}&limit=20`;
      if (actionFilter) q += `&action=${actionFilter}`;
      return apiRequest<{ logs: any[]; pagination: any }>(q);
    },
  });

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Security & Platform Audit Logs</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Immutable operational logs tracking administrative interventions, match score modifications, and system events.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: '1.5rem',
        }}
      >
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '0.45rem 0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            backgroundColor: '#ffffff',
          }}
        >
          <option value="">All Actions</option>
          <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          <option value="SCORE_EVENT_RECORDED">SCORE_EVENT_RECORDED</option>
          <option value="EVENT_REVERSED">EVENT_REVERSED</option>
          <option value="TOURNAMENT_CREATED">TOURNAMENT_CREATED</option>
          <option value="FIXTURES_GENERATED">FIXTURES_GENERATED</option>
          <option value="MATCH_SCHEDULED">MATCH_SCHEDULED</option>
          <option value="INVITATION_CREATED">INVITATION_CREATED</option>
        </select>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                <th style={{ padding: '0.75rem 1rem' }}>Actor</th>
                <th style={{ padding: '0.75rem 1rem' }}>Resource</th>
                <th style={{ padding: '0.75rem 1rem' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Loading audit trail...
                  </td>
                </tr>
              ) : data?.logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                data?.logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <Badge variant="default">{log.action}</Badge>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{log.userId?.name || 'System / Unauth'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.userId?.email || log.ipAddress}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>
                      {log.resourceType} {log.resourceId ? `(${log.resourceId.slice(-6)})` : ''}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {JSON.stringify(log.details)}
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
