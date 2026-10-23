import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Badge } from '../../components/Badge';
import { formatDate } from '../../lib/formatters';
import { Tournament, Sport } from '../../types';
import { Modal } from '../../components/Modal';

export const TournamentList: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: tournamentsData } = useQuery({
    queryKey: ['organizer-tournaments-list', search, statusFilter],
    queryFn: () => {
      let q = `/tournaments?limit=24`;
      if (search) q += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) q += `&status=${statusFilter}`;
      return apiRequest<{ tournaments: Tournament[] }>(q);
    },
  });

  const { data: sportsData } = useQuery({
    queryKey: ['sports-options'],
    queryFn: () => apiRequest<{ sports: Sport[] }>('/sports'),
  });

  const [formData, setFormData] = useState({
    name: '',
    sportId: '',
    format: 'SINGLE_ELIMINATION',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxTeams: 8,
    minTeams: 4,
    description: '',
  });

  const createMutation = useMutation({
    mutationFn: (newTourn: any) =>
      apiRequest('/tournaments', {
        method: 'POST',
        body: JSON.stringify(newTourn),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-tournaments-list'] });
      setIsCreateOpen(false);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Tournaments Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Browse, manage, and launch athletic tournaments.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            backgroundColor: 'var(--color-accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          <Plus size={16} /> New Tournament
        </button>
      </div>

      {/* Filters */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search tournament name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', background: '#ffffff' }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="REGISTRATION_OPEN">REGISTRATION_OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>

      {/* Tournament Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {tournamentsData?.tournaments.map((t) => (
          <div
            key={t._id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.name}</h3>
                <Badge variant={t.status === 'IN_PROGRESS' ? 'live' : t.status === 'COMPLETED' ? 'success' : 'default'}>
                  {t.status}
                </Badge>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                {t.description || 'Collegiate athletics championship.'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                <div>Format: <strong>{t.format.replace(/_/g, ' ')}</strong></div>
                <div>Dates: {formatDate(t.startDate)} &ndash; {formatDate(t.endDate)}</div>
                <div>Capacity: {t.maxTeams} Teams (Min {t.minTeams})</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <Link
                to={`/organizer/tournaments/${t._id}`}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                <Eye size={15} /> Manage
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* New Tournament Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Tournament" maxWidth="600px">
        <form onSubmit={handleCreateSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Tournament Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Spring Intercollegiate Volleyball Cup"
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Sport
                </label>
                <select
                  required
                  value={formData.sportId}
                  onChange={(e) => setFormData({ ...formData, sportId: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#ffffff' }}
                >
                  <option value="">Select sport...</option>
                  {sportsData?.sports.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Format
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#ffffff' }}
                >
                  <option value="SINGLE_ELIMINATION">Single Elimination</option>
                  <option value="ROUND_ROBIN">Round Robin</option>
                  <option value="DOUBLE_ROUND_ROBIN">Double Round Robin</option>
                  <option value="GROUP_AND_KNOCKOUT">Group Stage + Knockout</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Registration Deadline
              </label>
              <input
                type="date"
                required
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
