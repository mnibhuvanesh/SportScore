import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Trophy, Shield, Building2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Badge } from '../../components/Badge';

export const AdminDashboard: React.FC = () => {
  const { data: usersData, isLoading: loadingUsers, isError: errorUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiRequest<{ users: any[]; pagination: any }>('/users?limit=5'),
  });

  const { data: tournamentsData, isLoading: loadingTournaments } = useQuery({
    queryKey: ['admin-tournaments'],
    queryFn: () => apiRequest<{ tournaments: any[]; pagination: any }>('/tournaments?limit=5'),
  });

  const { data: teamsData, isLoading: loadingTeams } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => apiRequest<{ teams: any[] }>('/teams'),
  });

  const { data: venuesData, isLoading: loadingVenues } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: () => apiRequest<{ venues: any[] }>('/venues'),
  });

  const { data: auditData } = useQuery({
    queryKey: ['admin-audit-recent'],
    queryFn: () => apiRequest<{ logs: any[] }>('/users/audit-logs?limit=6'),
  });

  const getUserCount = () => {
    if (loadingUsers) return '...';
    if (errorUsers) return '—';
    if (usersData?.pagination?.total !== undefined) return usersData.pagination.total;
    return 0;
  };

  const getTournamentCount = () => {
    if (loadingTournaments) return '...';
    if (tournamentsData?.pagination?.total !== undefined) return tournamentsData.pagination.total;
    return 0;
  };

  const getTeamCount = () => {
    if (loadingTeams) return '...';
    if (teamsData?.teams !== undefined) return teamsData.teams.length;
    return 0;
  };

  const getVenueCount = () => {
    if (loadingVenues) return '...';
    if (venuesData?.venues !== undefined) return venuesData.venues.length;
    return 0;
  };

  const stats = [
    { title: 'Total Users', value: getUserCount(), icon: Users, link: '/admin/users', color: '#0284c7' },
    { title: 'Active Tournaments', value: getTournamentCount(), icon: Trophy, link: '/organizer/tournaments', color: '#10b981' },
    { title: 'Registered Teams', value: getTeamCount(), icon: Shield, link: '/admin/teams', color: '#f59e0b' },
    { title: 'Campus Venues', value: getVenueCount(), icon: Building2, link: '/organizer/venues', color: '#6366f1' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Platform Administration Overview
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Centralized governance, user management, and platform audit records.
        </p>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Link
              key={idx}
              to={s.link}
              style={{
                textDecoration: 'none',
                backgroundColor: '#ffffff',
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 150ms ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{s.title}</span>
                <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: `${s.color}15`, color: s.color }}>
                  <Icon size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.value}</div>
            </Link>
          );
        })}
      </div>

      {/* Two-column layout: Recent Users & Recent Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Users */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Users</h2>
            <Link to="/admin/users" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loadingUsers ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>Name</th>
                    <th style={{ padding: '0.5rem' }}>Role</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData?.users?.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <Badge variant="info">{u.role}</Badge>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>{u.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Audit Logs */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Platform Audit Trail</h2>
            <Link to="/admin/audit-logs" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {auditData?.logs?.map((log: any) => (
              <div
                key={log._id}
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{log.action}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Actor: {log.userId?.name || 'System'} ({log.resourceType})
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
