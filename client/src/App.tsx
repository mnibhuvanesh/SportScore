import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext';
import { AppLayout } from './components/AppLayout';

// Auth & Status Pages
import { LoginPage } from './features/auth/LoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { AcceptInvitationPage } from './features/auth/AcceptInvitationPage';
import { SessionExpiredPage } from './features/auth/SessionExpiredPage';
import { ForbiddenPage } from './features/auth/ForbiddenPage';
import { NotFoundPage } from './features/auth/NotFoundPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';

// Public Scoreboard
import { PublicTournamentList } from './features/public/PublicTournamentList';
import { PublicTournamentView } from './features/public/PublicTournamentView';

// Admin Portal
import { AdminDashboard } from './features/admin/AdminDashboard';
import { UserManagement } from './features/admin/UserManagement';
import { InvitationsManagement } from './features/admin/InvitationsManagement';
import { SportManagement } from './features/admin/SportManagement';
import { AuditLogsViewer } from './features/admin/AuditLogsViewer';

// Organizer Portal
import { OrganizerDashboard } from './features/organizer/OrganizerDashboard';
import { TournamentList } from './features/organizer/TournamentList';
import { TournamentDetail } from './features/organizer/TournamentDetail';
import { VenueCalendar } from './features/organizer/VenueCalendar';

// Coach Portal
import { CoachDashboard } from './features/coach/CoachDashboard';
import { TeamList } from './features/coach/TeamList';
import { TeamManagement } from './features/coach/TeamManagement';
import { CoachRegistrationList } from './features/coach/CoachRegistrationList';
import { CoachAnalytics } from './features/coach/CoachAnalytics';

// Athlete Portal
import { AthleteDashboard } from './features/athlete/AthleteDashboard';
import { AthleteProfile } from './features/athlete/AthleteProfile';
import { AthleteSchedule } from './features/athlete/AthleteSchedule';

// Scorer Portal
import { ScorerConsole } from './features/scorer/ScorerConsole';

const ProtectedRoute: React.FC<{ allowedRoles?: string[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '3px solid #cbd5e1', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 600ms linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  const getHomeRedirect = () => {
    if (!isAuthenticated) return '/login';
    const map: Record<string, string> = {
      ADMIN: '/admin',
      ORGANIZER: '/organizer',
      COACH: '/coach',
      ATHLETE: '/athlete',
      SCORER: '/scorer',
    };
    return map[role || ''] || '/login';
  };

  return (
    <Routes>
      {/* Public Unauthenticated Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Public Scoreboards (Accessible without logging in) */}
      <Route path="/public/tournaments" element={<PublicTournamentList />} />
      <Route path="/public/tournaments/:id" element={<PublicTournamentView />} />

      {/* Authenticated Application Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={getHomeRedirect()} replace />} />

        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/invitations"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}>
              <InvitationsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/sports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SportManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogsViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/teams"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER', 'COACH']}>
              <TeamList />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/teams/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER', 'COACH']}>
              <TeamManagement />
            </ProtectedRoute>
          }
        />

        {/* Organizer Routes */}
        <Route
          path="organizer"
          element={
            <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/tournaments"
          element={
            <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
              <TournamentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/tournaments/:id"
          element={
            <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
              <TournamentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/registrations"
          element={
            <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
              <TournamentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/venues"
          element={
            <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
              <VenueCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/calendar"
          element={
            <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
              <VenueCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/teams"
          element={
            <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
              <TeamList />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/teams/:id"
          element={
            <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
              <TeamManagement />
            </ProtectedRoute>
          }
        />

        {/* Coach Routes */}
        <Route
          path="coach"
          element={
            <ProtectedRoute allowedRoles={['COACH', 'ADMIN']}>
              <CoachDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="coach/teams"
          element={
            <ProtectedRoute allowedRoles={['COACH', 'ADMIN', 'ORGANIZER']}>
              <TeamList />
            </ProtectedRoute>
          }
        />
        <Route
          path="coach/teams/:id"
          element={
            <ProtectedRoute allowedRoles={['COACH', 'ADMIN', 'ORGANIZER']}>
              <TeamManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="coach/registrations"
          element={
            <ProtectedRoute allowedRoles={['COACH', 'ADMIN']}>
              <CoachRegistrationList />
            </ProtectedRoute>
          }
        />
        <Route
          path="coach/analytics"
          element={
            <ProtectedRoute allowedRoles={['COACH', 'ADMIN']}>
              <CoachAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Athlete Routes */}
        <Route
          path="athlete"
          element={
            <ProtectedRoute allowedRoles={['ATHLETE', 'ADMIN']}>
              <AthleteDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="athlete/profile"
          element={
            <ProtectedRoute allowedRoles={['ATHLETE', 'ADMIN']}>
              <AthleteProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="athlete/schedule"
          element={
            <ProtectedRoute allowedRoles={['ATHLETE', 'ADMIN']}>
              <AthleteSchedule />
            </ProtectedRoute>
          }
        />

        {/* Scorer Routes */}
        <Route
          path="scorer"
          element={
            <ProtectedRoute allowedRoles={['SCORER', 'ORGANIZER', 'ADMIN']}>
              <ScorerConsole />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
