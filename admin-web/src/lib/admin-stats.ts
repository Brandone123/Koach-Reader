import {
  adminRestGet,
  getBooks,
  getTableCount,
  getUsers,
  type AdminProfile,
} from "./supabase";

export interface OverviewStats {
  users: number;
  books: number;
  readingSessions: number;
  readingPlans: number;
  challenges: number;
  challengeParticipants: number;
  friends: number;
  communities: number;
  readingGroups: number;
  notifications: number;
}

const COUNT_TABLES: [keyof OverviewStats, string][] = [
  ["users", "users"],
  ["books", "books"],
  ["readingSessions", "reading_sessions"],
  ["readingPlans", "reading_plans"],
  ["challenges", "challenges"],
  ["challengeParticipants", "challenge_participants"],
  ["friends", "friends"],
  ["communities", "communities"],
  ["readingGroups", "reading_groups"],
  ["notifications", "notifications"],
];

export async function loadOverviewCounts(): Promise<Partial<OverviewStats>> {
  const out: Partial<OverviewStats> = {};
  await Promise.all(
    COUNT_TABLES.map(async ([prop, table]) => {
      try {
        out[prop] = await getTableCount(table);
      } catch {
        out[prop] = undefined;
      }
    }),
  );
  return out;
}

/** Derniers jours avec au moins un last_login enregistre (proxy frequence connexion) */
export function loginActivityByDay(
  users: AdminProfile[],
  days = 14,
): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const u of users) {
    if (!u.last_login) continue;
    const d = new Date(u.last_login).toISOString().slice(0, 10);
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
}

export interface ReadingSessionRow {
  id: string;
  user_id: string;
  book_id: number;
  pages_read: number;
  koach_earned: number;
  session_date: string;
  created_at?: string;
}

export interface ReadingPlanRow {
  id: number;
  user_id: string;
  book_id: number;
  current_page: number;
  daily_goal: number;
  status: string;
  updated_at: string;
  last_read_date: string | null;
}

export interface ChallengeRow {
  id: number;
  title: string;
  target_type: string;
  target_value: number;
  status: string;
  start_date: string;
  end_date: string;
}

export interface ChallengeParticipantRow {
  id: number;
  challenge_id: number;
  user_id: string;
  current_progress: number;
  status: string;
  updated_at: string;
}

export async function loadAnalyticsPayload(): Promise<{
  sessions: ReadingSessionRow[];
  plans: ReadingPlanRow[];
  challenges: ChallengeRow[];
  participants: ChallengeParticipantRow[];
}> {
  const [sessions, plans, challenges, participants] = await Promise.all([
    adminRestGet<ReadingSessionRow[]>(
      "reading_sessions?select=id,user_id,book_id,pages_read,koach_earned,session_date,created_at&order=session_date.desc&limit=250",
    ).catch(() => []),
    adminRestGet<ReadingPlanRow[]>(
      "reading_plans?select=id,user_id,book_id,current_page,daily_goal,status,updated_at,last_read_date&order=updated_at.desc&limit=200",
    ).catch(() => []),
    adminRestGet<ChallengeRow[]>(
      "challenges?select=id,title,target_type,target_value,status,start_date,end_date&order=created_at.desc&limit=80",
    ).catch(() => []),
    adminRestGet<ChallengeParticipantRow[]>(
      "challenge_participants?select=id,challenge_id,user_id,current_progress,status,updated_at&order=updated_at.desc&limit=250",
    ).catch(() => []),
  ]);

  return { sessions, plans, challenges, participants };
}

export function plansWithProgress(
  plans: ReadingPlanRow[],
  bookPages: Map<number, number>,
  usersById: Map<string, AdminProfile>,
) {
  return plans.map((p) => {
    const total = bookPages.get(p.book_id) ?? 0;
    const pct =
      total > 0 ? Math.min(100, Math.round((p.current_page / total) * 100)) : 0;
    const u = usersById.get(p.user_id);
    return {
      ...p,
      bookTotalPages: total,
      progressPercent: pct,
      username: u?.username ?? p.user_id.slice(0, 8),
    };
  });
}

export function aggregateSessionsByUser(sessions: ReadingSessionRow[], topN = 15) {
  const map = new Map<
    string,
    { pages: number; koach: number; sessions: number; lastAt: string }
  >();
  for (const s of sessions) {
    const cur = map.get(s.user_id) ?? {
      pages: 0,
      koach: 0,
      sessions: 0,
      lastAt: s.session_date,
    };
    cur.pages += s.pages_read;
    cur.koach += s.koach_earned;
    cur.sessions += 1;
    if (s.session_date > cur.lastAt) cur.lastAt = s.session_date;
    map.set(s.user_id, cur);
  }
  return Array.from(map.entries())
    .map(([userId, v]) => ({ userId, ...v }))
    .sort((a, b) => b.pages - a.pages)
    .slice(0, topN);
}

export async function loadDashboardBundle() {
  const [counts, users, books, analytics] = await Promise.all([
    loadOverviewCounts(),
    getUsers(),
    getBooks(),
    loadAnalyticsPayload(),
  ]);

  const bookPages = new Map(books.map((b) => [b.id, b.total_pages]));
  const usersById = new Map(users.map((u) => [u.id, u]));
  const loginBuckets = loginActivityByDay(users, 14);
  const planProgress = plansWithProgress(
    analytics.plans,
    bookPages,
    usersById,
  );
  const sessionLeaders = aggregateSessionsByUser(analytics.sessions, 12);

  return {
    counts,
    users,
    books,
    analytics,
    loginBuckets,
    planProgress,
    sessionLeaders,
  };
}
