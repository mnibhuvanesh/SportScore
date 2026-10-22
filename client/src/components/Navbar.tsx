import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Search,
  Bell,
  LogOut,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { NotificationDrawer } from './NotificationDrawer';
import { apiRequest } from '../lib/api';

export const Navbar: React.FC = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);

  // Initial fetch of unread count
  useEffect(() => {
    async function loadCount() {
      try {
        const res = await apiRequest<{ unreadCount: number }>('/notifications');
        setUnreadCount(res.unreadCount);
      } catch {
        // Ignore
      }
    }
    loadCount();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiRequest<any>(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res);
        setShowSearchDropdown(true);
      } catch {
        // Ignore
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardHome = () => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'ORGANIZER') return '/organizer';
    if (role === 'COACH') return '/coach';
    if (role === 'ATHLETE') return '/athlete';
    if (role === 'SCORER') return '/scorer';
    return '/';
  };

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: 'var(--color-ink-950)',
        color: '#ffffff',
        borderBottom: '1px solid var(--color-ink-800)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link
          to={getDashboardHome()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '-0.01em',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'var(--color-accent)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Trophy size={18} />
          </div>
          <span>Sports Platform</span>
        </Link>
      </div>

      {/* Global Search Bar */}
      <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--color-ink-900)',
            border: '1px solid var(--color-ink-800)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.35rem 0.75rem',
            gap: '0.5rem',
          }}
        >
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search tournaments, teams, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              width: '100%',
            }}
          />
          {isSearching && (
            <div
              style={{
                width: '12px',
                height: '12px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: '#38bdf8',
                borderRadius: '50%',
                animation: 'spin 600ms linear infinite',
              }}
            />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && searchResults && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.4rem',
              backgroundColor: '#ffffff',
              color: 'var(--color-text-primary)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-border)',
              maxHeight: '360px',
              overflowY: 'auto',
              zIndex: 100,
              fontSize: '0.85rem',
            }}
          >
            {/* Tournaments */}
            {searchResults.tournaments?.length > 0 && (
              <div>
                <div style={{ padding: '0.4rem 0.75rem', background: '#f8fafc', fontWeight: 600, fontSize: '0.75rem', color: '#64748b' }}>
                  TOURNAMENTS
                </div>
                {searchResults.tournaments.map((t: any) => (
                  <div
                    key={t._id}
                    onClick={() => {
                      setShowSearchDropdown(false);
                      navigate(`/public/tournaments/${t._id}`);
                    }}
                    style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <strong>{t.name}</strong> <span style={{ color: '#64748b', fontSize: '0.75rem' }}>({t.format})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Teams */}
            {searchResults.teams?.length > 0 && (
              <div>
                <div style={{ padding: '0.4rem 0.75rem', background: '#f8fafc', fontWeight: 600, fontSize: '0.75rem', color: '#64748b' }}>
                  TEAMS
                </div>
                {searchResults.teams.map((tm: any) => (
                  <div
                    key={tm._id}
                    onClick={() => {
                      setShowSearchDropdown(false);
                      navigate(`/coach/teams/${tm._id}`);
                    }}
                    style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <strong>{tm.name}</strong> <span style={{ color: '#64748b', fontSize: '0.75rem' }}>[{tm.code}]</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Live Scoreboard Link */}
        <Link
          to="/public/tournaments"
          target="_blank"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.65rem',
            backgroundColor: 'var(--color-ink-850)',
            color: '#38bdf8',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid var(--color-ink-700)',
            textDecoration: 'none',
          }}
        >
          <Radio size={14} color="#ef4444" /> Live Scoreboard <ExternalLink size={12} />
        </Link>

        {/* Notifications Icon */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="View notifications"
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              padding: '0.4rem',
            }}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                }}
              />
            )}
          </button>
          <NotificationDrawer
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onUpdateCount={setUnreadCount}
          />
        </div>

        {/* User Info & Role Pill */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>{user.name}</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--color-ink-900)',
                border: '1px solid var(--color-ink-800)',
                color: '#cbd5e1',
                padding: '0.4rem',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
