import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Badge } from '../../components/Badge';
import { formatDate, formatPhoneNumber } from '../../lib/formatters';
import { User, UserStatus } from '../../types';

export const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users-list', page, roleFilter, statusFilter, search],
    queryFn: () => {
      let query = `/users?page=${page}&limit=15`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (roleFilter) query += `&role=${roleFilter}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      return apiRequest<{ users: User[]; pagination: any }>(query);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      apiRequest(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
  });

  const handleStatusChange = (userId: string, newStatus: UserStatus) => {
    if (window.confirm(`Are you sure you want to change user status to ${newStatus}?`)) {
      statusMutation.mutate({ userId, status: newStatus });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>User Accounts Management</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Inspect authorized accounts, role memberships, and security statuses.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.45rem 0.65rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
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
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="ORGANIZER">ORGANIZER</option>
          <option value="COACH">COACH</option>
          <option value="ATHLETE">ATHLETE</option>
          <option value="SCORER">SCORER</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
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
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="DEACTIVATED">DEACTIVATED</option>
        </select>
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>User</th>
                <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>Phone</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Last Login</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Loading user records...
                  </td>
                </tr>
              ) : data?.users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No users match the criteria.
                  </td>
                </tr>
              ) : (
                data?.users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant="info">{u.role}</Badge>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)' }}>
                      {formatPhoneNumber(u.phone)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : u.status === 'SUSPENDED' ? 'warning' : 'danger'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleStatusChange(u._id, 'SUSPENDED')}
                          style={{
                            padding: '0.35rem 0.65rem',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            borderRadius: 'var(--radius-xs)',
                            cursor: 'pointer',
                            fontSize: '0.775rem',
                            fontWeight: 600,
                          }}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(u._id, 'ACTIVE')}
                          style={{
                            padding: '0.35rem 0.65rem',
                            border: '1px solid #a7f3d0',
                            background: '#ecfdf5',
                            color: '#047857',
                            borderRadius: 'var(--radius-xs)',
                            cursor: 'pointer',
                            fontSize: '0.775rem',
                            fontWeight: 600,
                          }}
                        >
                          Activate
                        </button>
                      )}
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
