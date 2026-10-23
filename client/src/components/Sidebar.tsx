import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mail,
  Dumbbell,
  FileSpreadsheet,
  Trophy,
  ClipboardCheck,
  Calendar,
  Building2,
  Shield,
  Activity,
  UserCheck,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const navItemStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 0.85rem',
    borderRadius: 'var(--radius-sm)',
    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
    backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.875rem',
    textDecoration: 'none',
    transition: 'background-color 150ms ease, color 150ms ease',
    marginBottom: '0.25rem',
  });

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--color-border)',
        height: 'calc(100vh - 60px)',
        position: 'sticky',
        top: '60px',
        padding: '1.25rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <div>
        {/* Section Title */}
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)',
            padding: '0 0.85rem 0.65rem',
          }}
        >
          {role} Portal
        </div>

        <nav>
          {/* Admin Navigation */}
          {role === 'ADMIN' && (
            <>
              <NavLink to="/admin" end style={navItemStyle}>
                <LayoutDashboard size={18} /> Overview
              </NavLink>
              <NavLink to="/admin/users" style={navItemStyle}>
                <Users size={18} /> User Accounts
              </NavLink>
              <NavLink to="/admin/invitations" style={navItemStyle}>
                <Mail size={18} /> Invitations
              </NavLink>
              <NavLink to="/admin/sports" style={navItemStyle}>
                <Dumbbell size={18} /> Sports Config
              </NavLink>
              <NavLink to="/admin/teams" style={navItemStyle}>
                <Shield size={18} /> Teams & Rosters
              </NavLink>
              <NavLink to="/admin/audit-logs" style={navItemStyle}>
                <FileSpreadsheet size={18} /> Audit Logs
              </NavLink>
            </>
          )}

          {/* Organizer Navigation */}
          {role === 'ORGANIZER' && (
            <>
              <NavLink to="/organizer" end style={navItemStyle}>
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
              <NavLink to="/organizer/tournaments" style={navItemStyle}>
                <Trophy size={18} /> Tournaments
              </NavLink>
              <NavLink to="/organizer/registrations" style={navItemStyle}>
                <ClipboardCheck size={18} /> Registrations
              </NavLink>
              <NavLink to="/organizer/teams" style={navItemStyle}>
                <Shield size={18} /> Teams & Rosters
              </NavLink>
              <NavLink to="/organizer/venues" style={navItemStyle}>
                <Building2 size={18} /> Venues & Resources
              </NavLink>
              <NavLink to="/organizer/calendar" style={navItemStyle}>
                <Calendar size={18} /> Match Calendar
              </NavLink>
            </>
          )}

          {/* Coach Navigation */}
          {role === 'COACH' && (
            <>
              <NavLink to="/coach" end style={navItemStyle}>
                <LayoutDashboard size={18} /> Team Dashboard
              </NavLink>
              <NavLink to="/coach/teams" style={navItemStyle}>
                <Shield size={18} /> Teams & Rosters
              </NavLink>
              <NavLink to="/coach/registrations" style={navItemStyle}>
                <ClipboardCheck size={18} /> Tournament Requests
              </NavLink>
              <NavLink to="/coach/analytics" style={navItemStyle}>
                <Activity size={18} /> Team Analytics
              </NavLink>
            </>
          )}

          {/* Athlete Navigation */}
          {role === 'ATHLETE' && (
            <>
              <NavLink to="/athlete" end style={navItemStyle}>
                <LayoutDashboard size={18} /> Overview
              </NavLink>
              <NavLink to="/athlete/profile" style={navItemStyle}>
                <UserCheck size={18} /> My Profile
              </NavLink>
              <NavLink to="/athlete/schedule" style={navItemStyle}>
                <Calendar size={18} /> Match Schedule
              </NavLink>
            </>
          )}

          {/* Scorer Navigation */}
          {role === 'SCORER' && (
            <>
              <NavLink to="/scorer" end style={navItemStyle}>
                <Smartphone size={18} /> Assigned Matches
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Institutional Info */}
      <div
        style={{
          padding: '0.85rem',
          backgroundColor: 'var(--color-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.2rem' }}>
          Academic Athletics System
        </div>
        <div>Active Season: 2026/27</div>
      </div>
    </aside>
  );
};
