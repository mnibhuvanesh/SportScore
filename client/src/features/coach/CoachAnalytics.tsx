import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Team } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const CoachAnalytics: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const { data: teamsData } = useQuery({
    queryKey: ['coach-teams-for-analytics'],
    queryFn: () => apiRequest<{ teams: Team[] }>('/teams'),
  });

  const teams = teamsData?.teams || [];
  const activeTeamId = selectedTeamId || (teams.length > 0 ? teams[0]._id : '');

  const { data: teamDetailData } = useQuery({
    queryKey: ['team-analytics-detail', activeTeamId],
    queryFn: () => apiRequest<{ team: Team; analytics: any }>(`/teams/${activeTeamId}`),
    enabled: !!activeTeamId,
  });

  const analytics = teamDetailData?.analytics;
  const team = teamDetailData?.team;

  const chartData = [
    { name: 'Won', count: analytics?.won || 0, fill: '#10b981' },
    { name: 'Drawn', count: analytics?.drawn || 0, fill: '#f59e0b' },
    { name: 'Lost', count: analytics?.lost || 0, fill: '#ef4444' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Team Performance Analytics</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Statistical metrics, win ratios, points differentials, and historical trends.
        </p>
      </div>

      {/* Team Selector */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        {teams.map((t) => (
          <button
            key={t._id}
            onClick={() => setSelectedTeamId(t._id)}
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: activeTeamId === t._id ? 'var(--color-accent)' : '#ffffff',
              color: activeTeamId === t._id ? '#ffffff' : 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {t.name} [{t.code}]
          </button>
        ))}
      </div>

      {analytics && team && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>MATCHES PLAYED</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>{analytics.played}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>WIN EFFICIENCY</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>{analytics.winRate}%</div>
            </div>
            <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>AVG POINTS SCORED</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>{analytics.avgScored}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>AVG CONCEDED</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', marginTop: '0.25rem' }}>{analytics.avgConceded}</div>
            </div>
          </div>

          {/* Bar Chart View */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              Match Outcomes Breakdown ({team.name})
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
