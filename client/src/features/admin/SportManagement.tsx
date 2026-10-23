import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Sport } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const SportManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sports'],
    queryFn: () => apiRequest<{ sports: Sport[] }>('/sports'),
  });

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    scoringType: 'POINTS',
    minPlayersPerTeam: 5,
    maxPlayersPerTeam: 15,
    matchDurationMinutes: 60,
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    description: '',
  });

  const createSportMutation = useMutation({
    mutationFn: (newSport: any) =>
      apiRequest('/sports', {
        method: 'POST',
        body: JSON.stringify(newSport),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sports'] });
      setIsModalOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSportMutation.mutate({
      ...formData,
      pointsConfig: {
        win: formData.winPoints,
        draw: formData.drawPoints,
        loss: formData.lossPoints,
      },
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Sports Configuration</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Configure active athletic disciplines, scoring systems, and standing points formulas.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            backgroundColor: 'var(--color-accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          <Plus size={16} /> Add Sport
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {isLoading ? (
          <div>Loading sports configurations...</div>
        ) : (
          data?.sports.map((sport) => (
            <div
              key={sport._id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{sport.name}</h3>
                <Badge variant="info">{sport.code}</Badge>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                {sport.description || 'Standard institutional athletics competition.'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', background: 'var(--color-surface-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Scoring Model:</span><br />
                  <strong>{sport.scoringType}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Match Duration:</span><br />
                  <strong>{sport.matchDurationMinutes} mins</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Roster Capacity:</span><br />
                  <strong>{sport.minPlayersPerTeam} &ndash; {sport.maxPlayersPerTeam} players</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Points Table:</span><br />
                  <strong>W:{sport.pointsConfig?.win} | D:{sport.pointsConfig?.draw} | L:{sport.pointsConfig?.loss}</strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure New Sport">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Sport Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Badminton"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Sport Code
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="BADM"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Scoring Model
                </label>
                <select
                  value={formData.scoringType}
                  onChange={(e) => setFormData({ ...formData, scoringType: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#ffffff' }}
                >
                  <option value="POINTS">POINTS</option>
                  <option value="GOALS">GOALS</option>
                  <option value="SETS">SETS</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Win Pts</label>
                <input
                  type="number"
                  value={formData.winPoints}
                  onChange={(e) => setFormData({ ...formData, winPoints: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Draw Pts</label>
                <input
                  type="number"
                  value={formData.drawPoints}
                  onChange={(e) => setFormData({ ...formData, drawPoints: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Loss Pts</label>
                <input
                  type="number"
                  value={formData.lossPoints}
                  onChange={(e) => setFormData({ ...formData, lossPoints: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createSportMutation.isPending}
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
              {createSportMutation.isPending ? 'Saving...' : 'Create Sport'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
