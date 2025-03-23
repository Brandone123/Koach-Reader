import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../utils/routeHandler";

// Define User interface based on how it's used
interface UserDocument {
  _id: string | number;
  username: string;
  firstName?: string;
  lastName?: string;
  readingMinutes?: number;
  profilePicUrl?: string;
}

export function setupKoachRoutes(app: Express, verifyJWT: any) {
  // Get user's Koach points
  app.get("/api/koach", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ koachPoints: user.koachPoints });
  }));

  // Get user's badges
  app.get("/api/badges", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
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

  // Get leaderboard of friends
  app.get("/api/leaderboard", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    try {
      // Using mock data as we don't have access to the actual User model
      const users = [
        { _id: 1, username: 'user1', firstName: 'John', lastName: 'Doe', readingMinutes: 120, profilePicUrl: '' },
        { _id: 2, username: 'user2', firstName: 'Jane', lastName: 'Smith', readingMinutes: 90, profilePicUrl: '' },
        { _id: 3, username: 'user3', firstName: 'Bob', lastName: 'Johnson', readingMinutes: 150, profilePicUrl: '' },
      ];
      
      const leaderboardData = users.map((user: UserDocument) => ({
        id: user._id,
        username: user.username,
        firstName: user.firstName || user.username.split(' ')[0],
        lastName: user.lastName || '',
        readingMinutes: user.readingMinutes || 0,
        profilePicUrl: user.profilePicUrl || ''
      }));
      
      // Sort by reading minutes (descending)
      leaderboardData.sort((a: { readingMinutes: number }, b: { readingMinutes: number }) => 
        b.readingMinutes - a.readingMinutes
      );
      
      res.json(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard data' });
    }
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
      if (user.koachPoints >= badge.threshold && !awardedBadgeIds.includes(badge.id)) {
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
