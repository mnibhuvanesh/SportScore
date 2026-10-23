import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Edit2,
  Trophy,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Team, Player, Tournament } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { formatDate } from '../../lib/formatters';

export const TeamManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'roster' | 'tournaments' | 'analytics'>('roster');

  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [playerFormError, setPlayerFormError] = useState<string | null>(null);
  const [teamFormError, setTeamFormError] = useState<string | null>(null);

  const [playerForm, setPlayerForm] = useState({
    firstName: '',
    lastName: '',
    jerseyNumber: '',
    position: '',
    isCaptain: false,
  });

  const [teamForm, setTeamForm] = useState({
    name: '',
    code: '',
    contactEmail: '',
    contactPhone: '',
  });

  const [selectedTournId, setSelectedTournId] = useState('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // 1. Fetch team details & roster
  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ['coach-team-detail', id],
    queryFn: () => apiRequest<{ team: Team; players: Player[]; analytics: any }>(`/teams/${id}`),
    enabled: !!id,
  });

  // 2. Fetch open tournaments for registration request
  const { data: openTournsData } = useQuery({
    queryKey: ['open-tournaments-for-reg'],
    queryFn: () => apiRequest<{ tournaments: Tournament[] }>('/tournaments?status=REGISTRATION_OPEN'),
  });

  // 3. Fetch existing tournament registrations for this team
  const { data: teamRegsData } = useQuery({
    queryKey: ['team-registrations', id],
    queryFn: () => apiRequest<{ registrations: any[] }>(`/registrations/team/${id}`),
    enabled: !!id,
  });

  // Add Player Mutation
  const addPlayerMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest(`/teams/${id}/players`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-team-detail', id] });
      setIsAddPlayerOpen(false);
      setPlayerFormError(null);
      setPlayerForm({ firstName: '', lastName: '', jerseyNumber: '', position: '', isCaptain: false });
    },
    onError: (err: any) => {
      setPlayerFormError(err.message || 'Failed to add player');
    },
  });

  // Remove Player Mutation
  const removePlayerMutation = useMutation({
    mutationFn: (playerId: string) =>
      apiRequest(`/teams/${id}/players/${playerId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-team-detail', id] });
    },
  });

  // Edit Team Mutation
  const editTeamMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest(`/teams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-team-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
      setIsEditTeamOpen(false);
      setTeamFormError(null);
    },
    onError: (err: any) => {
      setTeamFormError(err.message || 'Failed to update team details');
    },
  });

  // Submit Tournament Registration Mutation
  const requestRegMutation = useMutation({
    mutationFn: (tournId: string) =>
      apiRequest('/registrations', {
        method: 'POST',
        body: JSON.stringify({ tournamentId: tournId, teamId: id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-registrations', id] });
      queryClient.invalidateQueries({ queryKey: ['coach-registrations'] });
      setRegSuccess('Registration request submitted successfully to the tournament organizer!');
      setSelectedTournId('');
      setTimeout(() => setRegSuccess(null), 5000);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to submit registration request');
    },
  });

  const team = teamData?.team;
  const players = teamData?.players || [];
  const analytics = teamData?.analytics;
  const teamRegistrations = teamRegsData?.registrations || [];

  const handleAddPlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPlayerFormError(null);
    addPlayerMutation.mutate({
      ...playerForm,
      jerseyNumber: parseInt(playerForm.jerseyNumber, 10),
    });
  };

  const handleEditTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamFormError(null);
    editTeamMutation.mutate(teamForm);
  };

  const openEditTeam = () => {
    if (!team) return;
    setTeamForm({
      name: team.name,
      code: team.code,
      contactEmail: team.contactEmail,
      contactPhone: team.contactPhone || '',
    });
    setTeamFormError(null);
    setIsEditTeamOpen(true);
  };

  if (loadingTeam || !team) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading team details...</div>;
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          background: 'none',
          border: 'none',
          color: 'var(--color-accent)',
          cursor: 'pointer',
          padding: 0,
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{team.name}</h1>
            <Badge variant="info">{team.code}</Badge>
            <button
              onClick={openEditTeam}
              title="Edit Team Info"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.3rem 0.6rem',
                fontSize: '0.8rem',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Edit2 size={13} /> Edit
            </button>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Roster: {players.length} Players Registered &bull; Contact: {team.contactEmail}
          </p>
        </div>

        {activeTab === 'roster' && (
          <button
            onClick={() => setIsAddPlayerOpen(true)}
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
            <Plus size={16} /> Add Athlete to Roster
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        {(['roster', 'tournaments', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab ? 700 : 500,
              cursor: 'pointer',
              fontSize: '0.9rem',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Roster */}
      {activeTab === 'roster' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}># Jersey</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Athlete Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Position</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                      No players currently added to the roster. Click "Add Athlete to Roster" above to get started.
                    </td>
                  </tr>
                ) : (
                  players.map((p) => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-accent)', fontSize: '1rem' }}>
                        #{p.jerseyNumber}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {p.firstName} {p.lastName}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>
                        {p.position}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {p.isCaptain ? <Badge variant="warning">Captain</Badge> : <span style={{ color: '#94a3b8' }}>Member</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Badge variant={p.status === 'ACTIVE' ? 'success' : 'danger'}>{p.status}</Badge>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${p.firstName} ${p.lastName} (#${p.jerseyNumber}) from roster?`)) {
                              removePlayerMutation.mutate(p._id);
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            padding: '0.25rem',
                          }}
                          title="Remove from roster"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Tournaments Entry & History */}
      {activeTab === 'tournaments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section: Request Entry */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Request Tournament Entry</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Submit an official participation request for tournaments currently in open registration.
            </p>

            {regSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-sm)', color: '#065f46', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <CheckCircle size={16} /> {regSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '500px', flexWrap: 'wrap' }}>
              <select
                value={selectedTournId}
                onChange={(e) => setSelectedTournId(e.target.value)}
                style={{ flex: 1, minWidth: '240px', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#ffffff', fontSize: '0.9rem' }}
              >
                <option value="">Select open tournament...</option>
                {openTournsData?.tournaments.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.format})</option>
                ))}
              </select>

              <button
                onClick={() => {
                  if (selectedTournId) requestRegMutation.mutate(selectedTournId);
                }}
                disabled={!selectedTournId || requestRegMutation.isPending}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: 'var(--color-accent)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {requestRegMutation.isPending ? 'Submitting...' : 'Register Team'}
              </button>
            </div>
          </div>

          {/* Section: Active & Past Registrations */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={18} /> Tournament Registration Records
            </h3>

            {teamRegistrations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No active or past tournament registrations for this team.
              </div>
            ) : (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Tournament</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Format</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Reviewed By</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Date Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamRegistrations.map((reg: any) => (
                      <tr key={reg._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>
                          {reg.tournamentId?.name || 'Championship'}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                          {reg.tournamentId?.format || 'Standard'}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <Badge variant={reg.status === 'APPROVED' ? 'success' : reg.status === 'REJECTED' ? 'danger' : 'warning'}>
                            {reg.status}
                          </Badge>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                          {reg.reviewedBy?.name || 'Pending Review'}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          {formatDate(reg.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>MATCHES PLAYED</span>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{analytics.played}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>WIN RATE</span>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.5rem' }}>{analytics.winRate}%</div>
          </div>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>POINTS SCORED</span>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{analytics.scored}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>POINTS CONCEDED</span>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444', marginTop: '0.5rem' }}>{analytics.conceded}</div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      <Modal isOpen={isAddPlayerOpen} onClose={() => setIsAddPlayerOpen(false)} title="Add Athlete to Team Roster">
        <form onSubmit={handleAddPlayerSubmit}>
          {playerFormError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} /> {playerFormError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>First Name</label>
                <input
                  type="text"
                  required
                  value={playerForm.firstName}
                  onChange={(e) => setPlayerForm({ ...playerForm, firstName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Last Name</label>
                <input
                  type="text"
                  required
                  value={playerForm.lastName}
                  onChange={(e) => setPlayerForm({ ...playerForm, lastName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Jersey Number (Unique)</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  required
                  value={playerForm.jerseyNumber}
                  onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Position</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Forward / Setter"
                  value={playerForm.position}
                  onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id="isCaptain"
                type="checkbox"
                checked={playerForm.isCaptain}
                onChange={(e) => setPlayerForm({ ...playerForm, isCaptain: e.target.checked })}
              />
              <label htmlFor="isCaptain" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Designate as Team Captain</label>
            </div>

            <button
              type="submit"
              disabled={addPlayerMutation.isPending}
              style={{
                marginTop: '0.75rem',
                padding: '0.65rem',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {addPlayerMutation.isPending ? 'Adding...' : 'Add Player to Roster'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal isOpen={isEditTeamOpen} onClose={() => setIsEditTeamOpen(false)} title={`Edit Team Profile: ${team.name}`}>
        <form onSubmit={handleEditTeamSubmit}>
          {teamFormError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} /> {teamFormError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Team Name</label>
              <input
                type="text"
                required
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Team Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={teamForm.code}
                  onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Contact Email</label>
                <input
                  type="email"
                  required
                  value={teamForm.contactEmail}
                  onChange={(e) => setTeamForm({ ...teamForm, contactEmail: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Contact Phone</label>
              <input
                type="tel"
                value={teamForm.contactPhone}
                onChange={(e) => setTeamForm({ ...teamForm, contactPhone: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <button
              type="submit"
              disabled={editTeamMutation.isPending}
              style={{
                marginTop: '0.75rem',
                padding: '0.65rem',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {editTeamMutation.isPending ? 'Updating...' : 'Save Team Information'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
