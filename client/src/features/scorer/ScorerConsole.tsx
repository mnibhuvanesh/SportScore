import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Pause,
  CheckCircle,
  RotateCcw,
  Wifi,
  WifiOff,
  History,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Match, MatchEvent } from '../../types';
import { Badge } from '../../components/Badge';
import { getSocket, joinMatchRoom, leaveMatchRoom } from '../../lib/socket';
import { Modal } from '../../components/Modal';

export const ScorerConsole: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(true);

  // Reversal modal state
  const [reversalEvent, setReversalEvent] = useState<MatchEvent | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // 1. Fetch assigned matches
  const { data: matchesData } = useQuery({
    queryKey: ['scorer-assigned-matches'],
    queryFn: () => apiRequest<{ matches: Match[] }>('/matches'),
  });

  const assignedMatches = matchesData?.matches || [];
  const activeMatchId = selectedMatchId || (assignedMatches.length > 0 ? assignedMatches[0]._id : '');

  // 2. Fetch active match details & live event stream
  const { data: matchDetailData } = useQuery({
    queryKey: ['scorer-match-live', activeMatchId],
    queryFn: () => apiRequest<{ match: Match; events: MatchEvent[] }>(`/matches/${activeMatchId}`),
    enabled: !!activeMatchId,
    refetchInterval: 5000, // authoritative fallback polling
  });

  // Socket.IO real-time listener for this match
  useEffect(() => {
    if (!activeMatchId) return;
    const socket = getSocket();
    joinMatchRoom(activeMatchId);

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    const onScoreUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['scorer-match-live', activeMatchId] });
    };

    const onStatusUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['scorer-match-live', activeMatchId] });
      queryClient.invalidateQueries({ queryKey: ['scorer-assigned-matches'] });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('match:score', onScoreUpdate);
    socket.on('match:status', onStatusUpdate);

    return () => {
      leaveMatchRoom(activeMatchId);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('match:score', onScoreUpdate);
      socket.off('match:status', onStatusUpdate);
    };
  }, [activeMatchId, queryClient]);

  // Mutations
  const scoreMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest(`/matches/${activeMatchId}/score`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorer-match-live', activeMatchId] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      apiRequest(`/matches/${activeMatchId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorer-match-live', activeMatchId] });
      queryClient.invalidateQueries({ queryKey: ['scorer-assigned-matches'] });
    },
  });

  const reverseMutation = useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason: string }) =>
      apiRequest(`/matches/${activeMatchId}/events/${eventId}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorer-match-live', activeMatchId] });
      setReversalEvent(null);
      setReversalReason('');
    },
  });

  const currentMatch = matchDetailData?.match;
  const events = matchDetailData?.events || [];

  const handleScoreEvent = (teamId: string, points: number) => {
    scoreMutation.mutate({
      type: points === 1 ? 'SCORE_POINT' : 'SCORE_POINT',
      teamId,
      points,
      idempotencyKey: `score-${Date.now()}-${Math.random()}`,
    });
  };

  const handleReverseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalEvent) return;
    reverseMutation.mutate({ eventId: reversalEvent._id, reason: reversalReason });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header with Connection Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Official Scoring Console</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            Touch console for certified collegiate match event entries.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
          {isSocketConnected ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#047857', background: '#ecfdf5', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-xs)', border: '1px solid #a7f3d0' }}>
              <Wifi size={14} /> LIVE WEBSOCKET
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#b91c1c', background: '#fef2f2', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-xs)', border: '1px solid #fecaca' }}>
              <WifiOff size={14} /> RECONNECTING
            </span>
          )}
        </div>
      </div>

      {/* Match Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {assignedMatches.map((m) => (
          <button
            key={m._id}
            onClick={() => setSelectedMatchId(m._id)}
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: activeMatchId === m._id ? 'var(--color-ink-950)' : '#ffffff',
              color: activeMatchId === m._id ? '#ffffff' : 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {m.homeTeamId?.name || 'TBD'} vs {m.awayTeamId?.name || 'TBD'}
            <Badge variant={m.status === 'LIVE' ? 'live' : m.status === 'COMPLETED' ? 'success' : 'default'} className="ml-2" style={{ marginLeft: '0.5rem' }}>
              {m.status}
            </Badge>
          </button>
        ))}
      </div>

      {currentMatch && (
        <div>
          {/* Main Scoring Arena Card */}
          <div
            style={{
              backgroundColor: 'var(--color-ink-950)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: '2rem 1.5rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-ink-800)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {currentMatch.roundName}
              </span>
              <div style={{ marginTop: '0.35rem' }}>
                <Badge variant={currentMatch.status === 'LIVE' ? 'live' : currentMatch.status === 'COMPLETED' ? 'success' : 'default'}>
                  {currentMatch.status}
                </Badge>
              </div>
            </div>

            {/* Scoreboard Display */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '2rem' }}>
              {/* Home Team */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {currentMatch.homeTeamId?.name || 'Home Squad'}
                </div>
                <div style={{ fontSize: '4rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', color: '#38bdf8' }}>
                  {currentMatch.homeScore}
                </div>
              </div>

              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#475569' }}>:</div>

              {/* Away Team */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {currentMatch.awayTeamId?.name || 'Away Squad'}
                </div>
                <div style={{ fontSize: '4rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', color: '#38bdf8' }}>
                  {currentMatch.awayScore}
                </div>
              </div>
            </div>

            {/* Match Status Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', borderTop: '1px solid var(--color-ink-800)', paddingTop: '1.25rem' }}>
              {currentMatch.status === 'SCHEDULED' && (
                <button
                  onClick={() => statusMutation.mutate('LIVE')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <Play size={16} /> Start Match
                </button>
              )}

              {currentMatch.status === 'LIVE' && (
                <>
                  <button
                    onClick={() => statusMutation.mutate('PAUSED')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.15rem', backgroundColor: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    <Pause size={16} /> Pause Match
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to officially finish this match?')) {
                        statusMutation.mutate('COMPLETED');
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.15rem', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    <CheckCircle size={16} /> Finalize Match
                  </button>
                </>
              )}

              {currentMatch.status === 'PAUSED' && (
                <button
                  onClick={() => statusMutation.mutate('LIVE')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <Play size={16} /> Resume Match
                </button>
              )}
            </div>
          </div>

          {/* Quick Score Action Buttons (Accessible Touch Targets >= 44px) */}
          {(currentMatch.status === 'LIVE' || currentMatch.status === 'PAUSED') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              {/* Home Team Touch Controls */}
              <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center' }}>
                  {currentMatch.homeTeamId?.name}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleScoreEvent(currentMatch.homeTeamId!._id, 1)}
                    disabled={scoreMutation.isPending}
                    style={{ minHeight: '52px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                  >
                    +1 Point / Goal
                  </button>
                  <button
                    onClick={() => handleScoreEvent(currentMatch.homeTeamId!._id, 2)}
                    disabled={scoreMutation.isPending}
                    style={{ minHeight: '52px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                  >
                    +2 Points
                  </button>
                  <button
                    onClick={() => handleScoreEvent(currentMatch.homeTeamId!._id, 3)}
                    disabled={scoreMutation.isPending}
                    style={{ minHeight: '52px', gridColumn: 'span 2', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                  >
                    +3 Points
                  </button>
                </div>
              </div>

              {/* Away Team Touch Controls */}
              <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center' }}>
                  {currentMatch.awayTeamId?.name}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleScoreEvent(currentMatch.awayTeamId!._id, 1)}
                    disabled={scoreMutation.isPending}
                    style={{ minHeight: '52px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                  >
                    +1 Point / Goal
                  </button>
                  <button
                    onClick={() => handleScoreEvent(currentMatch.awayTeamId!._id, 2)}
                    disabled={scoreMutation.isPending}
                    style={{ minHeight: '52px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                  >
                    +2 Points
                  </button>
                  <button
                    onClick={() => handleScoreEvent(currentMatch.awayTeamId!._id, 3)}
                    disabled={scoreMutation.isPending}
                    style={{ minHeight: '52px', gridColumn: 'span 2', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                  >
                    +3 Points
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Append-Only Event Log Stream with Reversal Capability */}
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} /> Official Append-Only Match Event Log
            </h3>

            {events.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No events recorded for this match yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[...events].reverse().map((ev) => (
                  <div
                    key={ev._id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: ev.isReversed ? '#fef2f2' : 'var(--color-surface-subtle)',
                      border: ev.isReversed ? '1px solid #fecaca' : '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: ev.isReversed ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', textDecoration: ev.isReversed ? 'line-through' : 'none' }}>
                        #{ev.sequenceNumber} &bull; {ev.type.replace(/_/g, ' ')}
                        {ev.points > 0 && ` (+${ev.points} pts)`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Logged by {typeof ev.scorerUserId === 'object' ? ev.scorerUserId.name : 'Official Scorer'} at {new Date(ev.createdAt).toLocaleTimeString()}
                        {ev.isReversed && ` &mdash; REVERSED: "${ev.reversalReason}"`}
                      </div>
                    </div>

                    {!ev.isReversed && ev.type !== 'REVERSAL' && ev.type !== 'MATCH_CREATED' && (
                      <button
                        onClick={() => setReversalEvent(ev)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.35rem 0.65rem',
                          background: '#ffffff',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          borderRadius: 'var(--radius-xs)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        <RotateCcw size={12} /> Correct / Reverse
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      <Modal isOpen={!!reversalEvent} onClose={() => setReversalEvent(null)} title="Submit Event Reversal">
        <form onSubmit={handleReverseSubmit}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Reversing event <strong>#{reversalEvent?.sequenceNumber} ({reversalEvent?.type})</strong> will safely reconstruct the match scores and retain the immutable audit history.
          </p>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Official Reversal Reason (Mandatory)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inadvertent double tap on score console"
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={!reversalReason.trim() || reverseMutation.isPending}
            style={{
              width: '100%',
              padding: '0.65rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {reverseMutation.isPending ? 'Reversing...' : 'Confirm Non-Destructive Reversal'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
