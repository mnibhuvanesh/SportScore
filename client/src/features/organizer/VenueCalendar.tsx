import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Calendar as CalendarIcon } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Venue } from '../../types';
import { Badge } from '../../components/Badge';
import { formatDate } from '../../lib/formatters';

export const VenueCalendar: React.FC = () => {
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');

  const { data: venuesData } = useQuery({
    queryKey: ['organizer-venues'],
    queryFn: () => apiRequest<{ venues: Venue[] }>('/venues'),
  });

  const venues = venuesData?.venues || [];
  const currentVenueId = selectedVenueId || (venues.length > 0 ? venues[0]._id : '');

  const { data: venueDetailData } = useQuery({
    queryKey: ['organizer-venue-detail', currentVenueId],
    queryFn: () => apiRequest<{ venue: Venue; bookings: any[]; resources: any[] }>(`/venues/${currentVenueId}`),
    enabled: !!currentVenueId,
  });

  const venue = venueDetailData?.venue;
  const bookings = venueDetailData?.bookings || [];
  const resources = venueDetailData?.resources || [];

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Venues & Availability Calendar</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Inspect facility operational windows, confirmed match bookings, and equipment allocations.
        </p>
      </div>

      {/* Facility Selector */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        {venues.map((v) => (
          <button
            key={v._id}
            onClick={() => setSelectedVenueId(v._id)}
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: currentVenueId === v._id ? 'var(--color-accent)' : '#ffffff',
              color: currentVenueId === v._id ? '#ffffff' : 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Building2 size={16} /> {v.name}
          </button>
        ))}
      </div>

      {venue && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Facility Specs Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>{venue.name}</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
              Location: <strong>{venue.location}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--color-surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Capacity:</span><br />
                <strong>{venue.capacity.toLocaleString()} Spectators</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Daily Hours:</span><br />
                <strong>{venue.openingTime} &ndash; {venue.closingTime}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Slot Duration:</span><br />
                <strong>{venue.slotDurationMinutes} Minutes</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Facility Code:</span><br />
                <strong>{venue.code}</strong>
              </div>
            </div>

            {/* Resources allocated */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Equipment Stored On-Site</h4>
            {resources.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No dedicated equipment assigned.</p>
            ) : (
              <ul style={{ listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {resources.map((r: any) => (
                  <li key={r._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span>{r.name}</span>
                    <strong>Qty: {r.totalQuantity}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bookings Schedule */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={18} /> Confirmed Slot Reservations
            </h3>

            {bookings.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No active bookings currently registered for this venue.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bookings.map((b: any) => (
                  <div
                    key={b._id}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {b.matchId?.roundName || 'Facility Reservation'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {formatDate(b.slotStart)} &bull; {new Date(b.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &ndash; {new Date(b.slotEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <Badge variant="success">{b.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
