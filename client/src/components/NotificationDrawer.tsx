import React, { useEffect, useState } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { AppNotification } from '../types';

export const NotificationDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUpdateCount: (count: number) => void;
}> = ({ isOpen, onClose, onUpdateCount }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ notifications: AppNotification[]; unreadCount: number }>('/notifications');
      setNotifications(res.notifications);
      onUpdateCount(res.unreadCount);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      onUpdateCount(notifications.filter((n) => !n.isRead && n._id !== id).length);
    } catch {
      // Ignore
    }
  };

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onUpdateCount(0);
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: '0',
        marginTop: '0.5rem',
        width: '360px',
        maxHeight: '480px',
        background: '#ffffff',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface-subtle)',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
        <button
          onClick={markAllRead}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-accent)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Mark all read
        </button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            No notifications
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '0.4rem',
                backgroundColor: n.isRead ? 'transparent' : '#f0f9ff',
                borderLeft: n.isRead ? '2px solid transparent' : '2px solid var(--color-accent)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                  {n.title}
                </span>
                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n._id)}
                    title="Mark as read"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                {n.message}
              </p>
              {n.link && (
                <Link
                  to={n.link}
                  onClick={onClose}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', marginTop: '0.25rem' }}
                >
                  View details <ExternalLink size={12} />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
