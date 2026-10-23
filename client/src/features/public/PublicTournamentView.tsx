import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trophy, Radio, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Tournament, Match, TeamStanding } from '../../types';
import { Badge } from '../../components/Badge';
import { formatDate } from '../../lib/formatters';
import { getSocket, joinTournamentRoom, leaveTournamentRoom } from '../../lib/socket';

export const PublicTournamentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isSocketLive, setIsSocketLive] = useState(true);

  // Authoritative scoreboard state
  const { data, isLoading } = useQuery({
    queryKey: ['public-scoreboard', id],
    queryFn: () =>
      apiRequest<{
        tournament: Tournament;
        qrCode: string;
        publicUrl: string;
        matches: Match[];
        standings: TeamStanding[];
        topScorers: any[];
      }>(`/public/tournaments/${id}`),
    enabled: !!id,
    refetchInterval: 8000, // authoritative fallback interval
  });

  // Real-time Socket.IO synchronization
  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    joinTournamentRoom(id);

    const onConnect = () => setIsSocketLive(true);
    const onDisconnect = () => setIsSocketLive(false);

    const onScoreChange = () => {
      queryClient.invalidateQueries({ queryKey: ['public-scoreboard', id] });
    };

    const onStatusChange = () => {
      queryClient.invalidateQueries({ queryKey: ['public-scoreboard', id] });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('match:score', onScoreChange);
    socket.on('match:status', onStatusChange);

    return () => {
      leaveTournamentRoom(id);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('match:score', onScoreChange);
      socket.off('match:status', onStatusChange);
    };
  }, [id, queryClient]);

  if (isLoading || !data) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#070b12', color: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid #1e293b', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 600ms linear infinite', margin: '0 auto 1rem' }} />
          <span>Connecting to live championship feed...</span>
        </div>
      </div>
    );
  }

  const { tournament, qrCode, matches, standings } = data;
  const liveMatches = matches.filter((m) => m.status === 'LIVE' || m.status === 'PAUSED');
  const completedMatches = matches.filter((m) => m.status === 'COMPLETED');
  const scheduledMatches = matches.filter((m) => m.status === 'SCHEDULED');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b12', color: '#ffffff', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid #1e293b', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/public/tournaments" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <ArrowLeft size={18} />
            </Link>
            <div style={{ width: '32px', height: '32px', background: 'var(--color-accent)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Collegiate Live Scoreboard</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Academic Athletics League</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: isSocketLive ? '#34d399' : '#f87171' }}>
              {isSocketLive ? <Wifi size={13} /> : <WifiOff size={13} />}
              {isSocketLive ? 'REALTIME LIVE' : 'CONNECTING'}
            </span>
            <Link
              to="/login"
              style={{
                fontSize: '0.8rem',
                padding: '0.35rem 0.75rem',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                borderRadius: 'var(--radius-xs)',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
          </div>
        </header>

        {/* Tournament Title Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
              <Badge variant={tournament.status === 'IN_PROGRESS' ? 'live' : 'default'}>{tournament.status}</Badge>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
              {tournament.name}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Format: {tournament.format.replace(/_/g, ' ')} &bull; {formatDate(tournament.startDate)} &ndash; {formatDate(tournament.endDate)}
            </p>
          </div>

          {qrCode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0f172a', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1e293b' }}>
              <img src={qrCode} alt="Tournament QR" style={{ width: '60px', height: '60px', borderRadius: '4px' }} />
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                <strong style={{ color: '#ffffff' }}>Share Scoreboard</strong><br />
                Scan from any phone
              </div>
            </div>
          )}
        </div>

        {/* LIVE MATCHES SECTION */}
        {liveMatches.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Radio size={18} /> In-Progress Matches (Live Scoring)
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {liveMatches.map((m) => (
                <div
                  key={m._id}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #dc2626',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    boxShadow: '0 0 20px rgba(220, 38, 38, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{m.roundName}</span>
                    <Badge variant="live">LIVE</Badge>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '1.5rem 0' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{m.homeTeamId?.name}</div>
                      <div style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', color: '#38bdf8' }}>
                        {m.homeScore}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', color: '#475569', fontWeight: 800 }}>:</div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{m.awayTeamId?.name}</div>
                      <div style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', color: '#38bdf8' }}>
                        {m.awayScore}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.75rem', fontSize: '0.775rem', color: '#64748b', textAlign: 'center' }}>
                    Venue: {m.venueId?.name || 'Main Court'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STANDINGS TABLE */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Standings Table</h2>

          <div style={{ backgroundColor: '#0f172a', borderRadius: 'var(--radius-md)', border: '1px solid #1e293b', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#1e293b', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>#</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Team</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>MP</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>W</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>D</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>L</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>GF</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>GA</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>GD</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: '#38bdf8' }}>PTS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Form</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, idx) => (
                    <tr key={s.teamId} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{s.teamName} <span style={{ color: '#64748b' }}>[{s.teamCode}]</span></td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{s.played}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{s.won}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{s.drawn}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{s.lost}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{s.pointsFor}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{s.pointsAgainst}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{s.pointDifference > 0 ? `+${s.pointDifference}` : s.pointDifference}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: '#38bdf8' }}>{s.points}</td>
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
                                backgroundColor: res === 'W' ? '#065f46' : res === 'D' ? '#92400e' : '#991b1b',
                                color: '#ffffff',
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
        </section>

        {/* COMPLETED RESULTS & SCHEDULE */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {/* Completed Results */}
          <div style={{ backgroundColor: '#0f172a', borderRadius: 'var(--radius-md)', border: '1px solid #1e293b', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Final Results</h3>
            {completedMatches.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No completed fixtures yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {completedMatches.map((m) => (
                  <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: '#1e293b', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{m.homeTeamId?.name}</span>
                    <span style={{ padding: '0.2rem 0.5rem', background: '#0f172a', borderRadius: 'var(--radius-xs)', fontWeight: 800, color: '#38bdf8' }}>
                      {m.homeScore} : {m.awayScore}
                    </span>
                    <span style={{ fontWeight: 600 }}>{m.awayTeamId?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled Fixtures */}
          <div style={{ backgroundColor: '#0f172a', borderRadius: 'var(--radius-md)', border: '1px solid #1e293b', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Scheduled Fixtures</h3>
            {scheduledMatches.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No upcoming matches scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {scheduledMatches.map((m) => (
                  <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: '#1e293b', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <span>{m.homeTeamId?.name || 'TBD'} vs {m.awayTeamId?.name || 'TBD'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.roundName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
