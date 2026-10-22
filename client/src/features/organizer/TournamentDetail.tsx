import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Play,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Tournament, TournamentRegistration, Match, TeamStanding, Venue } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { formatDate } from '../../lib/formatters';

export const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'fixtures' | 'standings'>('overview');

  // Selected match for venue scheduling
  const [schedulingMatch, setSchedulingMatch] = useState<Match | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');

  // 1. Fetch tournament details & QR Code
  const { data: tournData, isLoading: loadingTourn } = useQuery({
    queryKey: ['organizer-tourn-detail', id],
    queryFn: () => apiRequest<{ tournament: Tournament; qrCodeDataUrl: string; publicUrl: string }>(`/tournaments/${id}`),
    enabled: !!id,
  });

  // 2. Fetch registrations
  const { data: regData } = useQuery({
    queryKey: ['organizer-tourn-regs', id],
    queryFn: () => apiRequest<{ registrations: TournamentRegistration[] }>(`/registrations/tournament/${id}`),
    enabled: !!id,
  });

  // 3. Fetch fixtures / matches
  const { data: matchesData } = useQuery({
    queryKey: ['organizer-tourn-matches', id],
    queryFn: () => apiRequest<{ matches: Match[] }>(`/matches?tournamentId=${id}`),
    enabled: !!id,
  });

  // 4. Fetch standings
  const { data: standingsData } = useQuery({
    queryKey: ['organizer-tourn-standings', id],
    queryFn: () => apiRequest<{ standings: TeamStanding[] }>(`/tournaments/${id}/standings`),
    enabled: !!id,
  });

  // 5. Fetch venues for scheduling
  const { data: venuesData } = useQuery({
    queryKey: ['venues-list'],
    queryFn: () => apiRequest<{ venues: Venue[] }>('/venues'),
  });

  // Generate Fixtures Mutation
  const generateFixturesMutation = useMutation({
    mutationFn: () => apiRequest(`/tournaments/${id}/fixtures/generate`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-tourn-matches', id] });
      queryClient.invalidateQueries({ queryKey: ['organizer-tourn-detail', id] });
      setActiveTab('fixtures');
    },
  });

  // Review Registration Mutation
  const reviewMutation = useMutation({
    mutationFn: ({ regId, status }: { regId: string; status: 'APPROVED' | 'REJECTED' }) =>
      apiRequest(`/registrations/${regId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-tourn-regs', id] });
    },
  });

  // Schedule Match Mutation
  const scheduleMatchMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest(`/matches/${schedulingMatch?._id}/schedule`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-tourn-matches', id] });
      setSchedulingMatch(null);
    },
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleMatchMutation.mutate({
      venueId: selectedVenueId,
      slotStart,
      slotEnd,
    });
  };

  const tournament = tournData?.tournament;
  const registrations = regData?.registrations || [];
  const matches = matchesData?.matches || [];
  const standings = standingsData?.standings || [];

  if (loadingTourn || !tournament) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading tournament details...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{tournament.name}</h1>
            <Badge variant={tournament.status === 'IN_PROGRESS' ? 'live' : tournament.status === 'COMPLETED' ? 'success' : 'default'}>
              {tournament.status}
            </Badge>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {tournament.format.replace(/_/g, ' ')} &bull; {formatDate(tournament.startDate)} &ndash; {formatDate(tournament.endDate)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href={tournData.publicUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.85rem',
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-accent)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Public Scoreboard <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        {(['overview', 'registrations', 'fixtures', 'standings'] as const).map((tab) => (
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

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Rules & Description</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {tournament.rules || tournament.description || 'Standard collegiate regulations apply.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div>Registration Deadline: <strong>{formatDate(tournament.registrationDeadline)}</strong></div>
              <div>Team Roster Capacity: <strong>Min {tournament.minTeams} / Max {tournament.maxTeams} Teams</strong></div>
              <div>Fixtures Generated: <strong>{tournament.fixturesGenerated ? 'Yes' : 'Not yet generated'}</strong></div>
            </div>
          </div>

          {/* QR Code Card */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Public Tournament QR Code</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Athletes, fans, and coaches can scan to access live match updates without logging in.
            </p>
            {tournData.qrCodeDataUrl && (
              <img
                src={tournData.qrCodeDataUrl}
                alt="Tournament QR Code"
                style={{ width: '180px', height: '180px', margin: '0 auto', display: 'block', borderRadius: 'var(--radius-sm)' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Registrations */}
      {activeTab === 'registrations' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Team Participation Registrations</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Approved: {registrations.filter((r) => r.status === 'APPROVED').length} / {tournament.maxTeams}
            </span>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Team</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Code</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Registered At</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                      No teams registered yet.
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg) => (
                    <tr key={reg._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{reg.teamId?.name}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Badge variant="info">{reg.teamId?.code}</Badge>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Badge variant={reg.status === 'APPROVED' ? 'success' : reg.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {reg.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {formatDate(reg.createdAt)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        {reg.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => reviewMutation.mutate({ regId: reg._id, status: 'APPROVED' })}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.65rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-xs)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={() => reviewMutation.mutate({ regId: reg._id, status: 'REJECTED' })}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.65rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 'var(--radius-xs)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Fixtures & Matches */}
      {activeTab === 'fixtures' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Generated Tournament Matches</h3>
            <button
              onClick={() => {
                if (window.confirm('Generate tournament fixtures based on approved teams?')) {
                  generateFixturesMutation.mutate();
                }
              }}
              disabled={generateFixturesMutation.isPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.15rem',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <Play size={15} /> {generateFixturesMutation.isPending ? 'Generating...' : 'Generate Fixtures Engine'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {matches.map((m) => (
              <div
                key={m._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{m.roundName}</span>
                  <Badge variant={m.status === 'LIVE' ? 'live' : m.status === 'COMPLETED' ? 'success' : 'default'}>
                    {m.status}
                  </Badge>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0' }}>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: '0.95rem' }}>{m.homeTeamId?.name || 'TBD'}</div>
                  <div style={{ padding: '0.35rem 0.75rem', background: '#f1f5f9', borderRadius: 'var(--radius-xs)', fontWeight: 800, fontSize: '1.1rem' }}>
                    {m.status === 'SCHEDULED' ? 'VS' : `${m.homeScore} : ${m.awayScore}`}
                  </div>
                  <div style={{ flex: 1, textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                    {m.awayTeamId?.name || (m.isBye ? 'BYE' : 'TBD')}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>Venue: {m.venueId?.name || 'Unassigned'}</span>
                  {m.status === 'SCHEDULED' && (
                    <button
                      onClick={() => {
                        setSchedulingMatch(m);
                        setSelectedVenueId(m.venueId?._id || '');
                      }}
                      style={{
                        padding: '0.3rem 0.6rem',
                        backgroundColor: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent)',
                        border: 'none',
                        borderRadius: 'var(--radius-xs)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    >
                      Assign Venue
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Standings */}
      {activeTab === 'standings' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Championship Standings</h3>
            <a
              href={`/api/v1/tournaments/${id}/standings/csv`}
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-accent)',
                textDecoration: 'none',
              }}
            >
              <Download size={14} /> Export CSV
            </a>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>#</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Team</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>MP</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>W</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>D</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>L</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>GF</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>GA</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>GD</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>PTS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Form</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, idx) => (
                  <tr key={s.teamId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{s.teamName} [{s.teamCode}]</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{s.played}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{s.won}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{s.drawn}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{s.lost}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{s.pointsFor}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{s.pointsAgainst}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{s.pointDifference > 0 ? `+${s.pointDifference}` : s.pointDifference}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>{s.points}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        {s.form.map((res, fIdx) => (
                          <span
                            key={fIdx}
                            style={{
                              padding: '0.15rem 0.35rem',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: '2px',
                              backgroundColor: res === 'W' ? '#ecfdf5' : res === 'D' ? '#fffbeb' : '#fef2f2',
                              color: res === 'W' ? '#047857' : res === 'D' ? '#b45309' : '#b91c1c',
                            }}
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Venue Scheduling Modal */}
      <Modal
        isOpen={!!schedulingMatch}
        onClose={() => setSchedulingMatch(null)}
        title={`Schedule Venue for ${schedulingMatch?.roundName}`}
      >
        <form onSubmit={handleScheduleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Select Campus Venue
              </label>
              <select
                required
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#ffffff' }}
              >
                <option value="">Select venue...</option>
                {venuesData?.venues.map((v) => (
                  <option key={v._id} value={v._id}>{v.name} ({v.location})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Slot Start Time
              </label>
              <input
                type="datetime-local"
                required
                value={slotStart}
                onChange={(e) => setSlotStart(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Slot End Time
              </label>
              <input
                type="datetime-local"
                required
                value={slotEnd}
                onChange={(e) => setSlotEnd(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <button
              type="submit"
              disabled={scheduleMatchMutation.isPending}
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
              {scheduleMatchMutation.isPending ? 'Reserving...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
