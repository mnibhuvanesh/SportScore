import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Shield,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { Team, Sport } from '../../types';
import { useAuth } from '../auth/AuthContext';

export const TeamList: React.FC = () => {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sportId: '',
    contactEmail: '',
    contactPhone: '',
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    contactEmail: '',
    contactPhone: '',
  });

  // 1. Fetch Teams
  const { data: teamsData, isLoading: loadingTeams, error: teamsError } = useQuery({
    queryKey: ['teams-list', search, selectedSport],
    queryFn: () => {
      let q = '/teams';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedSport) params.append('sportId', selectedSport);
      const queryString = params.toString();
      return apiRequest<{ teams: Team[] }>(queryString ? `${q}?${queryString}` : q);
    },
  });

  // 2. Fetch Sports for dropdown
  const { data: sportsData } = useQuery({
    queryKey: ['sports-list'],
    queryFn: () => apiRequest<{ sports: Sport[] }>('/sports'),
  });

  const teams = teamsData?.teams || [];
  const sports = sportsData?.sports || [];

  // Create Team Mutation
  const createMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest<{ team: Team }>('/teams', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
      queryClient.invalidateQueries({ queryKey: ['coach-teams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      setIsCreateOpen(false);
      setFormData({ name: '', code: '', sportId: '', contactEmail: '', contactPhone: '' });
      setFormError(null);
      setSuccessMsg('Team successfully registered and added to the platform roster.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create team');
    },
  });

  // Edit Team Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiRequest<{ team: Team }>(`/teams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
      queryClient.invalidateQueries({ queryKey: ['coach-teams'] });
      setEditingTeam(null);
      setSuccessMsg('Team details updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update team');
    },
  });

  // Delete Team Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/teams/${id}`, { method: 'DELETE' }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
      queryClient.invalidateQueries({ queryKey: ['coach-teams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      setSuccessMsg(res.message || 'Team updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete team');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    setFormError(null);
    editMutation.mutate({ id: editingTeam._id, body: editFormData });
  };

  const openEditModal = (t: Team) => {
    setEditingTeam(t);
    setEditFormData({
      name: t.name,
      code: t.code,
      contactEmail: t.contactEmail,
      contactPhone: t.contactPhone || '',
    });
    setFormError(null);
  };

  const handleDeleteTeam = (t: Team) => {
    if (window.confirm(`Are you sure you want to remove or archive "${t.name}"? This action safely checks for completed tournament matches.`)) {
      deleteMutation.mutate(t._id);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Athletic Teams & Rosters
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Browse registered collegiate squads, manage athlete rosters, and configure tournament participation.
          </p>
        </div>

        {(role === 'COACH' || role === 'ADMIN' || role === 'ORGANIZER') && (
          <button
            onClick={() => {
              setFormError(null);
              setIsCreateOpen(true);
            }}
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
            <Plus size={16} /> Register New Team
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-sm)',
            color: '#065f46',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Search and Filters Bar */}
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
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search team name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="#64748b" />
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              backgroundColor: '#ffffff',
            }}
          >
            <option value="">All Sports</option>
            {sports.map((sp) => (
              <option key={sp._id} value={sp._id}>
                {sp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teams Grid / List */}
      {loadingTeams ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading registered teams...
        </div>
      ) : teamsError ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          Failed to load teams. Please ensure backend services are running.
        </div>
      ) : teams.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Shield size={40} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No teams found</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {search || selectedSport
              ? 'No teams match your search filters. Try adjusting your query.'
              : 'No athletic teams have been registered yet. Create your first squad to get started.'}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1.1rem',
              backgroundColor: 'var(--color-accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <Plus size={15} /> Register New Team
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {teams.map((t: any) => (
            <div
              key={t._id}
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
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{t.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Sport: <strong>{t.sportId?.name || 'General Sport'}</strong>
                    </span>
                  </div>
                  <Badge variant="info">{t.code}</Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '1rem 0' }}>
                  <div>
                    Coach / Manager: <strong>{t.coachId?.name || 'Head Coach'}</strong>
                  </div>
                  <div>
                    Contact: <strong>{t.contactEmail}</strong>
                  </div>
                  {t.contactPhone && <div>Phone: {t.contactPhone}</div>}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '1rem',
                  marginTop: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <Link
                  to={`/coach/teams/${t._id}`}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem',
                    backgroundColor: 'var(--color-accent-subtle)',
                    color: 'var(--color-accent)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                  }}
                >
                  <Users size={14} /> Roster & Entry
                </Link>

                {(role === 'COACH' || role === 'ADMIN' || role === 'ORGANIZER') && (
                  <>
                    <button
                      onClick={() => openEditModal(t)}
                      title="Edit Team Details"
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      onClick={() => handleDeleteTeam(t)}
                      title="Delete or Archive Team"
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        color: '#ef4444',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register New Athletic Team">
        <form onSubmit={handleCreateSubmit}>
          {formError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-sm)',
                color: '#b91c1c',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Team Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Coastal Thunder"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Team Code (Unique) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. THUN"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Sport *
                </label>
                <select
                  required
                  value={formData.sportId}
                  onChange={(e) => setFormData({ ...formData, sportId: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#ffffff' }}
                >
                  <option value="">Select sport...</option>
                  {sports.map((sp) => (
                    <option key={sp._id} value={sp._id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="coach@platform.edu"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 019-0000"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                marginTop: '0.5rem',
                padding: '0.7rem',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {createMutation.isPending ? 'Registering Team...' : 'Create Team Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal isOpen={!!editingTeam} onClose={() => setEditingTeam(null)} title={`Edit Team: ${editingTeam?.name}`}>
        <form onSubmit={handleEditSubmit}>
          {formError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-sm)',
                color: '#b91c1c',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Team Name
              </label>
              <input
                type="text"
                required
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Team Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.contactEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Contact Phone
              </label>
              <input
                type="tel"
                value={editFormData.contactPhone}
                onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <button
              type="submit"
              disabled={editMutation.isPending}
              style={{
                marginTop: '0.5rem',
                padding: '0.7rem',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {editMutation.isPending ? 'Saving Changes...' : 'Update Team Information'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
