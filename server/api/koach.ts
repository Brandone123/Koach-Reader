import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../utils/routeHandler";
import { supabase } from "../utils/db";

export function setupKoachRoutes(app: Express, verifyJWT: any) {
  // Get user's Koach points
  app.get("/api/koach", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ koachPoints: user.koach_points });
  }));

  // Get all available badges
  app.get("/api/badges", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const badges = await storage.getBadges();
    res.status(200).json(badges);
  }));

  // Get current user's badges
  app.get("/api/user/badges", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userBadges = await storage.getUserBadges(req.user!.id);
    res.status(200).json(userBadges);
  }));

  // Get badge details
  app.get("/api/badges/:id", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const badgeId = parseInt(req.params.id);
    if (isNaN(badgeId)) {
      return res.status(400).json({ message: "Invalid badge ID" });
    }
    
    // TODO: Implement get badge details
    
    res.status(200).json({});
  }));

  // General leaderboard: koach points, books, badges
  app.get("/api/leaderboard", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("id, username, koach_points, books_completed, avatar_url")
        .order("koach_points", { ascending: false })
        .limit(100);

      if (error) throw error;

      const userIds = (users || []).map((u: any) => u.id);
      let badgeCounts: Record<string, number> = {};

      try {
        const { data: userBadges } = await supabase
          .from("user_badges")
          .select("user_id");
        if (userBadges) {
          userBadges.forEach((ub: any) => {
            badgeCounts[ub.user_id] = (badgeCounts[ub.user_id] || 0) + 1;
          });
        }
      } catch {
        /* user_badges may not exist */
      }

      const leaderboardData = (users || []).map((u: any, i: number) => ({
        userId: u.id,
        username: u.username,
        points: u.koach_points ?? 0,
        booksCompleted: u.books_completed ?? 0,
        badgesCount: badgeCounts[u.id] ?? 0,
        avatarUrl: u.avatar_url ?? null,
        rank: i + 1,
      }));

      res.json(leaderboardData);
    } catch (error) {
      console.error("Leaderboard error:", error);
      res.json([]);
    }
  }));

  // Per-book leaderboard: readers of a specific book ranked by progress
  app.get("/api/leaderboard/book/:bookId", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const bookId = parseInt(req.params.bookId);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    try {
      const { data: userBooks, error } = await supabase
        .from("user_books")
        .select("user_id, current_page, is_completed, last_read_date")
        .eq("book_id", bookId)
        .order("current_page", { ascending: false })
        .order("is_completed", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!userBooks?.length) return res.json([]);

      const userIds = [...new Set(userBooks.map((ub: any) => ub.user_id))];
      const { data: users } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const userMap = new Map((users || []).map((u: any) => [u.id, u]));

      const ranked = userBooks.map((ub: any, i: number) => {
        const u = userMap.get(ub.user_id) as { username?: string; avatar_url?: string } | undefined;
        return {
          userId: ub.user_id,
          username: u?.username ?? "Unknown",
          avatarUrl: u?.avatar_url ?? null,
          currentPage: ub.current_page ?? 0,
          isCompleted: ub.is_completed ?? false,
          lastReadDate: ub.last_read_date ?? null,
          rank: i + 1,
        };
      });

      res.json(ranked);
    } catch (error) {
      console.error("Book leaderboard error:", error);
      res.json([]);
    }
  }));

  // Reading stats (progressive: works with available tables)
  app.get("/api/stats", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const range = (req.query.range as string) || "week";
    const now = new Date();
    let startDate = new Date(now);
    if (range === "week") startDate.setDate(now.getDate() - 7);
    else if (range === "month") startDate.setMonth(now.getMonth() - 1);
    else if (range === "year") startDate.setFullYear(now.getFullYear() - 1);
    const startIso = startDate.toISOString();

    const emptyStats = {
      daysActive: 0,
      totalReadingTime: 0,
      totalPagesRead: 0,
      booksStarted: 0,
      booksCompleted: 0,
      averagePagesPerDay: 0,
      averageTimePerDay: 0,
      currentStreak: 0,
      longestStreak: 0,
      preferredReadingTime: "morning",
      mostReadCategory: "General",
      readingByDay: [] as { day: string; pagesRead: number }[],
      readingByTime: [] as { time: string; percentage: number }[],
    };

    try {
      const { data: sessions } = await supabase
        .from("reading_sessions")
        .select("pages_read, minutes_spent, session_date")
        .eq("user_id", userId)
        .gte("session_date", startIso);

      if (!sessions?.length) return res.json(emptyStats);

      const totalPages = sessions.reduce((s: number, r: any) => s + (r.pages_read || 0), 0);
      const totalMins = sessions.reduce((s: number, r: any) => s + (r.minutes_spent || 0), 0);
      const daysSet = new Set(sessions.map((r: any) => r.session_date?.split("T")[0]).filter(Boolean));

      const readingByDay = Array.from(daysSet)
        .sort()
        .slice(-7)
        .map((d) => ({ day: d, pagesRead: sessions.filter((r: any) => r.session_date?.startsWith(d)).reduce((s: number, r: any) => s + (r.pages_read || 0), 0) }));

      res.json({
        ...emptyStats,
        daysActive: daysSet.size,
        totalReadingTime: totalMins,
        totalPagesRead: totalPages,
        averagePagesPerDay: daysSet.size ? Math.round(totalPages / daysSet.size) : 0,
        averageTimePerDay: daysSet.size ? Math.round(totalMins / daysSet.size) : 0,
        readingByDay,
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.json(emptyStats);
    }
  }));

  // Get user's reading goals
  app.get("/api/goals", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { data, error } = await supabase
      .from("reading_goals")
      .select("*")
      .eq("user_id", userId)
      .order("year", { ascending: false });

    if (error) {
      return res.status(500).json({ message: "Failed to fetch goals" });
    }

    res.status(200).json(data || []);
  }));

  // Check for badges to award
  app.post("/api/check-badges", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get awarded badges
    const awardedBadges = await storage.getUserBadges(user.id);
    const awardedBadgeIds = awardedBadges.map(badge => badge.id);
    
    // Check for badges based on Koach points
    const badgesToAward = [];
    
    // Example badge logic (would come from database in production)
    const koachPointBadges = [
      { id: 1, name: "Koach Starter", threshold: 100 },
      { id: 2, name: "Koach Enthusiast", threshold: 500 },
      { id: 3, name: "Koach Master", threshold: 1000 },
      { id: 4, name: "Koach Champion", threshold: 5000 },
    ];
    
    for (const badge of koachPointBadges) {
      if (user.koach_points >= badge.threshold && !awardedBadgeIds.includes(badge.id)) {
        badgesToAward.push(badge.id);
      }
    }
    
    // Award new badges
    const newlyAwarded = [];
    for (const badgeId of badgesToAward) {
      const awarded = await storage.awardBadgeToUser(user.id, badgeId);
      if (awarded) {
        newlyAwarded.push(badgeId);
      }
    }
    
    res.status(200).json({
      message: "Badge check complete",
      newBadges: newlyAwarded.length > 0,
      badgeCount: newlyAwarded.length,
    });
  }));
}
