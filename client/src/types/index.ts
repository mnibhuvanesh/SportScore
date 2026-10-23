export type UserRole = 'ADMIN' | 'ORGANIZER' | 'COACH' | 'ATHLETE' | 'SCORER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export type ScoringType = 'GOALS' | 'POINTS' | 'SETS';

export interface Sport {
  _id: string;
  name: string;
  code: string;
  scoringType: ScoringType;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  matchDurationMinutes: number;
  pointsConfig: { win: number; draw: number; loss: number };
  description?: string;
  rules?: string;
  isActive: boolean;
}

export type TournamentFormat = 'SINGLE_ELIMINATION' | 'ROUND_ROBIN' | 'DOUBLE_ROUND_ROBIN' | 'GROUP_AND_KNOCKOUT';
export type TournamentStatus = 'DRAFT' | 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface Tournament {
  _id: string;
  name: string;
  slug: string;
  sportId: Sport | string;
  organizerId: User | string;
  description?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  minTeams: number;
  isPublic: boolean;
  rules?: string;
  groupCount?: number;
  qualifiersPerGroup?: number;
  fixturesGenerated: boolean;
  winnerTeamId?: Team | string | null;
  createdAt: string;
}

export interface Team {
  _id: string;
  name: string;
  code: string;
  sportId: Sport | string;
  coachId: User | string;
  contactEmail: string;
  contactPhone?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export type PlayerStatus = 'ACTIVE' | 'INJURED' | 'SUSPENDED';

export interface Player {
  _id: string;
  teamId: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: string;
  dateOfBirth?: string;
  isCaptain: boolean;
  status: PlayerStatus;
}

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export interface TournamentRegistration {
  _id: string;
  tournamentId: Tournament | string;
  teamId: Team;
  coachId: User | string;
  status: RegistrationStatus;
  rejectionReason?: string;
  seedNumber?: number | null;
  groupIndex?: number | null;
  createdAt: string;
}

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'COMPLETED' | 'POSTPONED' | 'ABANDONED' | 'CANCELLED';
export type MatchStage = 'GROUP_STAGE' | 'KNOCKOUT' | 'REGULAR';

export interface SetScore {
  setNumber: number;
  homeScore: number;
  awayScore: number;
}

export interface Match {
  _id: string;
  tournamentId: Tournament | string;
  round: number;
  matchNumber: number;
  roundName: string;
  stage: MatchStage;
  groupIndex?: number | null;
  homeTeamId?: Team | null;
  awayTeamId?: Team | null;
  isBye: boolean;
  status: MatchStatus;
  scheduledStartTime?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  venueId?: Venue | null;
  assignedScorerId?: User | null;
  homeScore: number;
  awayScore: number;
  winnerTeamId?: Team | string | null;
  isDraw: boolean;
  sets: SetScore[];
  nextMatchId?: string | null;
  nextMatchSlot?: 'home' | 'away' | null;
  version: number;
}

export type MatchEventType =
  | 'MATCH_CREATED'
  | 'MATCH_ASSIGNED'
  | 'MATCH_STARTED'
  | 'MATCH_PAUSED'
  | 'MATCH_RESUMED'
  | 'MATCH_COMPLETED'
  | 'MATCH_POSTPONED'
  | 'MATCH_ABANDONED'
  | 'SCORE_GOAL'
  | 'SCORE_POINT'
  | 'SET_SCORE'
  | 'FOUL'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'TIMEOUT'
  | 'CORRECTION'
  | 'REVERSAL';

export interface MatchEvent {
  _id: string;
  matchId: string;
  sequenceNumber: number;
  type: MatchEventType;
  teamId?: Team | string | null;
  playerId?: Player | string | null;
  points: number;
  setNumber?: number | null;
  minute?: number | null;
  scorerUserId: User | string;
  isCorrection: boolean;
  correctionReason?: string | null;
  isReversed: boolean;
  reversalReason?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Venue {
  _id: string;
  name: string;
  code: string;
  location: string;
  capacity: number;
  supportedSportIds: (Sport | string)[];
  openingTime: string;
  closingTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface Resource {
  _id: string;
  name: string;
  code: string;
  totalQuantity: number;
  venueId?: Venue | string | null;
  sportId?: Sport | string | null;
  description?: string;
  isActive: boolean;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamCode: string;
  logoUrl?: string;
  groupIndex?: number | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface AppNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'REGISTRATION' | 'MATCH_SCHEDULED' | 'MATCH_RESULT' | 'ANNOUNCEMENT' | 'SECURITY';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    remainingSeconds?: number;
  };
}
