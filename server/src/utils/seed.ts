import { connectDatabase, disconnectDatabase } from '../config/database';
import { env } from '../config/env';
import { hashPassword } from './security';
import {
  User,
  Sport,
  Team,
  Player,
  Venue,
  Resource,
  Tournament,
  TournamentRegistration,
  Match,
  MatchEvent,
  Notification,
  AuditLog,
} from '../models';
import { FixtureService } from '../services/fixture.service';

export async function runSeed(): Promise<void> {
  console.log('🌱 Starting deterministic database seed with sample collegiate data...');
  const demoPasswords = {
    admin: env.ADMIN_PASSWORD || env.DEMO_ADMIN_PASSWORD,
    organizer: env.DEMO_ORGANIZER_PASSWORD,
    coach: env.DEMO_COACH_PASSWORD,
    athlete: env.DEMO_ATHLETE_PASSWORD,
    scorer: env.DEMO_SCORER_PASSWORD,
  };
  if (Object.values(demoPasswords).some((password) => !password)) {
    throw new Error('Set ADMIN_PASSWORD and all DEMO_*_PASSWORD values before running the demo seed.');
  }
  await connectDatabase();

  // Sample accounts use passwords supplied through environment variables.
  const demoUsers = [
    {
      name: env.ADMIN_NAME || 'Platform Administrator',
      email: (env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim(),
      username: 'admin',
      password: demoPasswords.admin!,
      role: 'ADMIN' as const,
    },
    {
      name: 'Sample Organizer',
      email: 'organizer@example.com',
      username: 'organizer',
      password: demoPasswords.organizer!,
      role: 'ORGANIZER' as const,
    },
    {
      name: 'Sample Coach',
      email: 'coach@example.com',
      username: 'coach',
      password: demoPasswords.coach!,
      role: 'COACH' as const,
    },
    {
      name: 'Sample Athlete',
      email: 'athlete@example.com',
      username: 'athlete',
      password: demoPasswords.athlete!,
      role: 'ATHLETE' as const,
    },
    {
      name: 'Sample Scorer',
      email: 'scorer@example.com',
      username: 'scorer',
      password: demoPasswords.scorer!,
      role: 'SCORER' as const,
    },
    {
      name: 'Sample Assistant Organizer',
      email: 'assistant-organizer@example.com',
      username: 'assistant-organizer',
      password: demoPasswords.organizer!,
      role: 'ORGANIZER' as const,
    },
    {
      name: 'Sample Assistant Coach',
      email: 'assistant-coach@example.com',
      username: 'assistant-coach',
      password: demoPasswords.coach!,
      role: 'COACH' as const,
    },
    {
      name: 'Sample Reserve Athlete',
      email: 'reserve-athlete@example.com',
      username: 'reserve-athlete',
      password: demoPasswords.athlete!,
      role: 'ATHLETE' as const,
    },
    {
      name: 'Sample Assistant Scorer',
      email: 'assistant-scorer@example.com',
      username: 'assistant-scorer',
      password: demoPasswords.scorer!,
      role: 'SCORER' as const,
    },
  ];

  const userMap = new Map<string, any>();
  for (const u of demoUsers) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      const passwordHash = await hashPassword(u.password);
      user = await User.create({
        name: u.name,
        email: u.email,
        username: u.username,
        passwordHash,
        role: u.role,
        status: 'ACTIVE',
      });
      console.log(`  + Created user: ${user.name} (${user.role})`);
    } else {
      user.name = u.name;
      user.username = u.username;
      user.role = u.role;
      user.status = 'ACTIVE';
      if (u.password) {
        user.passwordHash = await hashPassword(u.password);
      }
      await user.save();
      console.log(`  + Synchronized user: ${user.name} (${user.role})`);
    }
    userMap.set(u.email, user);
  }

  // 1. Seed 3 Sports
  const sportsData = [
    {
      name: 'Football (Soccer)',
      code: 'FOOTBALL',
      scoringType: 'GOALS' as const,
      minPlayersPerTeam: 11,
      maxPlayersPerTeam: 22,
      matchDurationMinutes: 90,
      pointsConfig: { win: 3, draw: 1, loss: 0 },
      description: 'Standard 11v11 collegiate football with two 45-minute halves.',
      rules: 'AIFF and FIFA standard laws of the game with collegiate substitutions.',
    },
    {
      name: 'Basketball',
      code: 'BASKETBALL',
      scoringType: 'POINTS' as const,
      minPlayersPerTeam: 5,
      maxPlayersPerTeam: 15,
      matchDurationMinutes: 48,
      pointsConfig: { win: 2, draw: 0, loss: 1 },
      description: 'AIU regulation collegiate basketball with 4 quarters of 12 minutes.',
      rules: 'Standard FIBA rules with 24-second shot clock and collegiate foul limits.',
    },
    {
      name: 'Volleyball',
      code: 'VOLLEYBALL',
      scoringType: 'SETS' as const,
      minPlayersPerTeam: 6,
      maxPlayersPerTeam: 14,
      matchDurationMinutes: 75,
      pointsConfig: { win: 3, draw: 0, loss: 0 },
      description: 'Inter-collegiate best-of-5 sets volleyball.',
      rules: 'Rally scoring to 25 points, deciding fifth set to 15 points.',
    },
  ];

  const sportMap = new Map<string, any>();
  for (const s of sportsData) {
    let sport = await Sport.findOne({ code: s.code });
    if (!sport) {
      sport = await Sport.create(s);
      console.log(`  + Created Sport: ${s.name}`);
    } else {
      sport.name = s.name;
      sport.rules = s.rules;
      sport.description = s.description;
      await sport.save();
    }
    sportMap.set(s.code, sport);
  }

  // 2. Seed 10 Prestigious Indian Venues with Resources
  const venuesData = [
    { name: 'Jawaharlal Nehru Multi-Sport Stadium', code: 'JLN-01', location: 'Central Sports Complex, Chennai', capacity: 40000 },
    { name: 'Ramanujan Athletic Arena', code: 'RAMA-01', location: 'North Campus Sports Quad', capacity: 5000 },
    { name: 'Sardar Patel Indoor Fieldhouse', code: 'SPTL-01', location: 'University Sports Pavilion', capacity: 3500 },
    { name: 'Dhyan Chand Center Court', code: 'DYAN-01', location: 'National Recreation Arena', capacity: 2500 },
    { name: 'C.V. Raman Gymnasium', code: 'CVRM-01', location: 'Science Quad Sports Wing', capacity: 1800 },
    { name: 'Vivekananda Turf Grounds A', code: 'VIVE-01', location: 'South Athletic Grounds', capacity: 2200 },
    { name: 'Vivekananda Turf Grounds B', code: 'VIVE-02', location: 'South Athletic Grounds', capacity: 2200 },
    { name: 'Sarvepalli Radhakrishnan Hall 1', code: 'SRAD-01', location: 'Academic Sports Complex', capacity: 1200 },
    { name: 'Sarvepalli Radhakrishnan Hall 2', code: 'SRAD-02', location: 'Academic Sports Complex', capacity: 1200 },
    { name: 'Tagore Sports Annex', code: 'TAGR-01', location: 'East Campus Hall', capacity: 800 },
  ];

  const venueMap = new Map<string, any>();
  for (const v of venuesData) {
    let venue = await Venue.findOne({ code: v.code });
    if (!venue) {
      venue = await Venue.create({
        ...v,
        supportedSportIds: [sportMap.get('FOOTBALL')._id, sportMap.get('BASKETBALL')._id, sportMap.get('VOLLEYBALL')._id],
        openingTime: '06:00',
        closingTime: '22:00',
        slotDurationMinutes: 90,
      });
      console.log(`  + Created Venue: ${v.name}`);
    } else {
      venue.name = v.name;
      venue.location = v.location;
      venue.capacity = v.capacity;
      await venue.save();
    }
    venueMap.set(v.code, venue);
  }

  // Seed Resources for venues
  const resourceData = [
    { name: 'FIFA Quality Pro Match Balls (Set of 10)', code: 'RES-FB-BALL', totalQuantity: 20, sportCode: 'FOOTBALL' },
    { name: 'Digital 24s Shot Clock Console', code: 'RES-BB-CLOCK', totalQuantity: 10, sportCode: 'BASKETBALL' },
    { name: 'Official FIVB Volleyball Net Post System', code: 'RES-VB-NET', totalQuantity: 8, sportCode: 'VOLLEYBALL' },
    { name: 'Electronic Multisport Scoreboard Display', code: 'RES-ELEC-SB', totalQuantity: 12 },
    { name: 'Emergency Sports First Aid Station', code: 'RES-MED-KIT', totalQuantity: 25 },
  ];

  for (const r of resourceData) {
    let resObj = await Resource.findOne({ code: r.code });
    if (!resObj) {
      await Resource.create({
        name: r.name,
        code: r.code,
        totalQuantity: r.totalQuantity,
        sportId: r.sportCode ? sportMap.get(r.sportCode)._id : null,
      });
    } else {
      resObj.name = r.name;
      resObj.totalQuantity = r.totalQuantity;
      await resObj.save();
    }
  }

  // 3. Seed 12 Teams (4 Football, 4 Basketball, 4 Volleyball) representing top Indian collegiate institutions
  const teamsData = [
    // Football teams
    { name: 'Sample University Titans', code: 'SUT', sport: 'FOOTBALL', coachEmail: 'coach@example.com' },
    { name: 'Institute Strikers', code: 'INST', sport: 'FOOTBALL', coachEmail: 'coach@example.com' },
    { name: 'College Hawks', code: 'COLH', sport: 'FOOTBALL', coachEmail: 'coach@example.com' },
    { name: 'Tech Warriors', code: 'TECH', sport: 'FOOTBALL', coachEmail: 'coach@example.com' },
    // Basketball teams
    { name: 'University Phoenix', code: 'UNIP', sport: 'BASKETBALL', coachEmail: 'coach@example.com' },
    { name: 'City University Lions', code: 'CUL', sport: 'BASKETBALL', coachEmail: 'coach@example.com' },
    { name: 'State University Kings', code: 'SUK', sport: 'BASKETBALL', coachEmail: 'coach@example.com' },
    { name: 'College Falcons', code: 'COLF', sport: 'BASKETBALL', coachEmail: 'coach@example.com' },
    // Volleyball teams
    { name: 'Institute Bulls', code: 'INB', sport: 'VOLLEYBALL', coachEmail: 'coach@example.com' },
    { name: 'University Knights', code: 'UNIK', sport: 'VOLLEYBALL', coachEmail: 'coach@example.com' },
    { name: 'College Crusaders', code: 'COLC', sport: 'VOLLEYBALL', coachEmail: 'coach@example.com' },
    { name: 'Academy Panthers', code: 'ACAP', sport: 'VOLLEYBALL', coachEmail: 'coach@example.com' },
  ];

  const teamMap = new Map<string, any>();
  const coachUser = userMap.get('coach@example.com');
  const athleteUser = userMap.get('athlete@example.com');

  const playerPositions: Record<string, string[]> = {
    FOOTBALL: ['Goalkeeper', 'Center Back', 'Full Back', 'Midfielder', 'Winger', 'Striker', 'Central Defensive Midfielder'],
    BASKETBALL: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
    VOLLEYBALL: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite Hitter', 'Libero'],
  };

  const indianFirstNames = [
    'Arjun', 'Rahul', 'Aditya', 'Vishal', 'Naveen', 'Sanjay', 'Karthik', 'Rohan',
    'Ananya', 'Priya', 'Divya', 'Nithya', 'Sneha', 'Meera', 'Pooja', 'Deepika', 'Lakshmi', 'Shreya'
  ];
  const indianLastNames = [
    'Kumar', 'Sharma', 'Patel', 'Verma', 'Reddy', 'Subramanian', 'Nair', 'Iyer',
    'Saminathan', 'Raman', 'Krishnan', 'Raj', 'Balaji', 'Murugan', 'Sundaram', 'Natarajan'
  ];

  for (const t of teamsData) {
    let team = await Team.findOne({ code: t.code });
    if (!team) {
      team = await Team.create({
        name: t.name,
        code: t.code,
        sportId: sportMap.get(t.sport)._id,
        coachId: coachUser._id,
        contactEmail: t.coachEmail,
      });
      console.log(`  + Created Team: ${t.name} (${t.sport})`);
    } else {
      team.name = t.name;
      team.contactEmail = t.coachEmail;
      await team.save();
    }

    // Seed/update 7 players per team
    const positions = playerPositions[t.sport];
    const existingPlayers = await Player.find({ teamId: team._id });
    if (existingPlayers.length === 0) {
      for (let j = 1; j <= 7; j++) {
        const fn = indianFirstNames[(team.code.charCodeAt(0) + j) % indianFirstNames.length];
        const ln = indianLastNames[(team.code.charCodeAt(1) + j) % indianLastNames.length];
        const pos = positions[(j - 1) % positions.length];

        // Link athlete account to the first player of Anna University Titans
        const isLinkedAthlete = t.code === 'ANNA' && j === 1;

        await Player.create({
          teamId: team._id,
          userId: isLinkedAthlete ? athleteUser._id : null,
          firstName: isLinkedAthlete ? 'Ananya' : fn,
          lastName: isLinkedAthlete ? 'Krishnan' : ln,
          jerseyNumber: j * 2 + 1,
          position: pos,
          isCaptain: j === 1,
          dateOfBirth: new Date(2003, (j * 3) % 12, (j * 5) % 28 + 1),
          status: 'ACTIVE',
        });
      }
    } else {
      // Update names to realistic Indian names
      for (let j = 0; j < existingPlayers.length; j++) {
        const p = existingPlayers[j];
        const isLinkedAthlete = t.code === 'ANNA' && j === 0;
        p.firstName = isLinkedAthlete ? 'Ananya' : indianFirstNames[(team.code.charCodeAt(0) + j + 1) % indianFirstNames.length];
        p.lastName = isLinkedAthlete ? 'Krishnan' : indianLastNames[(team.code.charCodeAt(1) + j + 1) % indianLastNames.length];
        if (isLinkedAthlete) {
          p.userId = athleteUser._id;
          p.isCaptain = true;
        }
        await p.save();
      }
    }

    teamMap.set(t.code, team);
  }

  // 4. Seed 2 Tournaments: One Completed and One In Progress
  const organizer = userMap.get('organizer@example.com');
  const scorer = userMap.get('scorer@example.com');

  // Tournament 1: All-India Inter-University Football Championship (Completed)
  let tourn1 = await Tournament.findOne({ slug: 'all-india-inter-university-football-championship-2026' });
  if (!tourn1) {
    const legacyTourn1 = await Tournament.findOne({ slug: 'collegiate-fall-football-cup-2026' });
    if (legacyTourn1) {
      legacyTourn1.name = 'All-India Inter-University Football Championship';
      legacyTourn1.slug = 'all-india-inter-university-football-championship-2026';
      legacyTourn1.rules = 'Round-robin collegiate championship under AIU regulations. 3 points for win and 1 for draw.';
      await legacyTourn1.save();
      tourn1 = legacyTourn1;
    }
  }

  if (!tourn1) {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const regDeadline = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);

    tourn1 = await Tournament.create({
      name: 'All-India Inter-University Football Championship',
      slug: 'all-india-inter-university-football-championship-2026',
      sportId: sportMap.get('FOOTBALL')._id,
      organizerId: organizer._id,
      format: 'ROUND_ROBIN',
      status: 'COMPLETED',
      startDate,
      endDate,
      registrationDeadline: regDeadline,
      maxTeams: 8,
      minTeams: 4,
      isPublic: true,
      fixturesGenerated: true,
      rules: 'Round-robin collegiate championship under AIU regulations. 3 points for win and 1 for draw.',
    });

    const fbTeams = [teamMap.get('ANNA'), teamMap.get('IITM'), teamMap.get('LOYO'), teamMap.get('PSGT')];

    // Approve registrations
    for (let i = 0; i < fbTeams.length; i++) {
      await TournamentRegistration.create({
        tournamentId: tourn1._id,
        teamId: fbTeams[i]._id,
        coachId: coachUser._id,
        status: 'APPROVED',
        seedNumber: i + 1,
        reviewedBy: organizer._id,
        reviewedAt: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000),
      });
    }

    // Generate round robin fixtures
    const fixtures = FixtureService.generateRoundRobinFixtures(fbTeams.map((t) => t._id), false);
    for (let fIdx = 0; fIdx < fixtures.length; fIdx++) {
      const f = fixtures[fIdx];
      const matchStart = new Date(startDate.getTime() + f.round * 24 * 60 * 60 * 1000);
      const homeScore = (fIdx * 2 + 1) % 4;
      const awayScore = fIdx % 3;

      let winnerId = null;
      let isDraw = false;
      if (homeScore > awayScore) winnerId = f.homeTeamId;
      else if (awayScore > homeScore) winnerId = f.awayTeamId;
      else isDraw = true;

      const match = await Match.create({
        tournamentId: tourn1._id,
        round: f.round,
        matchNumber: f.matchNumber,
        roundName: f.roundName,
        stage: 'REGULAR',
        homeTeamId: f.homeTeamId,
        awayTeamId: f.awayTeamId,
        status: 'COMPLETED',
        scheduledStartTime: matchStart,
        actualStartTime: matchStart,
        actualEndTime: new Date(matchStart.getTime() + 90 * 60 * 1000),
        venueId: venueMap.get('JLN-01')._id,
        assignedScorerId: scorer._id,
        homeScore,
        awayScore,
        winnerTeamId: winnerId,
        isDraw,
      });

      for (let s = 1; s <= homeScore; s++) {
        await MatchEvent.create({
          matchId: match._id,
          sequenceNumber: s,
          type: 'SCORE_GOAL',
          teamId: f.homeTeamId,
          points: 1,
          minute: 15 * s,
          scorerUserId: scorer._id,
        });
      }
      for (let a = 1; a <= awayScore; a++) {
        await MatchEvent.create({
          matchId: match._id,
          sequenceNumber: homeScore + a,
          type: 'SCORE_GOAL',
          teamId: f.awayTeamId,
          points: 1,
          minute: 20 * a + 5,
          scorerUserId: scorer._id,
        });
      }
    }

    tourn1.winnerTeamId = fbTeams[0]._id;
    await tourn1.save();
    console.log(`  + Created completed tournament: ${tourn1.name}`);
  }

  // Tournament 2: South Zone Inter-Collegiate Basketball Trophy (In Progress with Live Match)
  let tourn2 = await Tournament.findOne({ slug: 'south-zone-inter-collegiate-basketball-trophy-2026' });
  if (!tourn2) {
    const legacyTourn2 = await Tournament.findOne({ slug: 'inter-varsity-basketball-showcase-2026' });
    if (legacyTourn2) {
      legacyTourn2.name = 'South Zone Inter-Collegiate Basketball Trophy';
      legacyTourn2.slug = 'south-zone-inter-collegiate-basketball-trophy-2026';
      legacyTourn2.rules = 'Single-elimination championship bracket under AIU/FIBA guidelines.';
      await legacyTourn2.save();
      tourn2 = legacyTourn2;
    }
  }

  if (!tourn2) {
    const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const regDeadline = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    tourn2 = await Tournament.create({
      name: 'South Zone Inter-Collegiate Basketball Trophy',
      slug: 'south-zone-inter-collegiate-basketball-trophy-2026',
      sportId: sportMap.get('BASKETBALL')._id,
      organizerId: organizer._id,
      format: 'SINGLE_ELIMINATION',
      status: 'IN_PROGRESS',
      startDate,
      endDate,
      registrationDeadline: regDeadline,
      maxTeams: 8,
      minTeams: 4,
      isPublic: true,
      fixturesGenerated: true,
      rules: 'Single-elimination championship bracket under AIU/FIBA guidelines.',
    });

    const bbTeams = [teamMap.get('BITS'), teamMap.get('DELU'), teamMap.get('SRMU'), teamMap.get('RVCE')];

    for (let i = 0; i < bbTeams.length; i++) {
      await TournamentRegistration.create({
        tournamentId: tourn2._id,
        teamId: bbTeams[i]._id,
        coachId: coachUser._id,
        status: 'APPROVED',
        seedNumber: i + 1,
        reviewedBy: organizer._id,
        reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      });
    }

    // Semifinal Match 1: Completed
    const semi1 = await Match.create({
      tournamentId: tourn2._id,
      round: 1,
      matchNumber: 1,
      roundName: 'Semifinal 1',
      stage: 'KNOCKOUT',
      homeTeamId: bbTeams[0]._id, // BITS Pilani Phoenix
      awayTeamId: bbTeams[3]._id, // RV College Falcons
      status: 'COMPLETED',
      scheduledStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      actualStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      actualEndTime: new Date(Date.now() - 22 * 60 * 60 * 1000),
      venueId: venueMap.get('RAMA-01')._id,
      assignedScorerId: scorer._id,
      homeScore: 88,
      awayScore: 76,
      winnerTeamId: bbTeams[0]._id,
      isDraw: false,
    });

    // Semifinal Match 2: LIVE Right Now!
    const semi2 = await Match.create({
      tournamentId: tourn2._id,
      round: 1,
      matchNumber: 2,
      roundName: 'Semifinal 2',
      stage: 'KNOCKOUT',
      homeTeamId: bbTeams[1]._id, // Delhi University Lions
      awayTeamId: bbTeams[2]._id, // SRM University Kings
      status: 'LIVE',
      scheduledStartTime: new Date(Date.now() - 30 * 60 * 1000),
      actualStartTime: new Date(Date.now() - 25 * 60 * 1000),
      venueId: venueMap.get('SPTL-01')._id,
      assignedScorerId: scorer._id,
      homeScore: 48,
      awayScore: 45,
      isDraw: false,
    });

    // Append realistic live scoring events for Semifinal 2
    await MatchEvent.create({
      matchId: semi2._id,
      sequenceNumber: 1,
      type: 'MATCH_STARTED',
      scorerUserId: scorer._id,
      points: 0,
      minute: 0,
      idempotencyKey: 'seed-event-1',
    });
    await MatchEvent.create({
      matchId: semi2._id,
      sequenceNumber: 2,
      type: 'SCORE_POINT',
      teamId: bbTeams[1]._id,
      points: 3,
      minute: 2,
      scorerUserId: scorer._id,
      idempotencyKey: 'seed-event-2',
    });
    await MatchEvent.create({
      matchId: semi2._id,
      sequenceNumber: 3,
      type: 'SCORE_POINT',
      teamId: bbTeams[2]._id,
      points: 2,
      minute: 4,
      scorerUserId: scorer._id,
      idempotencyKey: 'seed-event-3',
    });

    // Final Match: Scheduled (awaiting winner of Semifinal 2)
    const finalMatch = await Match.create({
      tournamentId: tourn2._id,
      round: 2,
      matchNumber: 3,
      roundName: 'Championship Final',
      stage: 'KNOCKOUT',
      homeTeamId: bbTeams[0]._id, // Winner of Semifinal 1
      awayTeamId: null, // Winner of Semifinal 2 pending
      status: 'SCHEDULED',
      scheduledStartTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      venueId: venueMap.get('RAMA-01')._id,
      assignedScorerId: scorer._id,
      homeScore: 0,
      awayScore: 0,
    });

    semi1.nextMatchId = finalMatch._id;
    semi1.nextMatchSlot = 'home';
    await semi1.save();

    semi2.nextMatchId = finalMatch._id;
    semi2.nextMatchSlot = 'away';
    await semi2.save();

    console.log(`  + Created in-progress tournament: ${tourn2.name} with live & scheduled matches.`);
  }

  // 5. Seed Notifications & Audit Log
  await Notification.create({
    userId: athleteUser._id,
    title: 'Roster Placement Confirmed',
    message: 'You have been assigned to Anna University Titans as Team Captain for the All-India collegiate season.',
    type: 'ANNOUNCEMENT',
  });

  await AuditLog.create({
    userId: userMap.get('admin@example.com')._id,
    action: 'PLATFORM_INITIALIZATION',
    resourceType: 'System',
    details: { message: 'Deterministic Indian collegiate demo seed successfully initialized' },
  });

  console.log('✅ Deterministic Indian collegiate seed completed successfully!');
  await disconnectDatabase();
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
