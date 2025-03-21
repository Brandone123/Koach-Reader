import { Express } from "express";
import { storage } from "../storage";

export function setupKoachRoutes(app: Express, verifyJWT: any) {
  // Get user's Koach points
  app.get("/api/koach", verifyJWT, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ koachPoints: user.koachPoints });
    } catch (error) {
      console.error("Error fetching Koach points:", error);
      res.status(500).json({ message: "Error fetching Koach points" });
    }
  });

  // Get user's badges
  app.get("/api/badges", verifyJWT, async (req, res) => {
    try {
      const userBadges = await storage.getUserBadges(req.user!.id);
      
      res.status(200).json(userBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Error fetching badges" });
    }
  });

  // Get badge details
  app.get("/api/badges/:id", verifyJWT, async (req, res) => {
    try {
      const badgeId = parseInt(req.params.id);
      if (isNaN(badgeId)) {
        return res.status(400).json({ message: "Invalid badge ID" });
      }
      
      // TODO: Implement get badge details
      
      res.status(200).json({});
    } catch (error) {
      console.error("Error fetching badge:", error);
      res.status(500).json({ message: "Error fetching badge" });
    }
  });

  // Get leaderboard of friends
  app.get("/api/leaderboard", verifyJWT, async (req, res) => {
    try {
      // Get friends
      const friends = await storage.getFriends(req.user!.id);
      
      // Add the current user to the list
      const currentUser = await storage.getUser(req.user!.id);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const leaderboard = [
        {
          id: currentUser.id,
          username: currentUser.username,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          profilePicUrl: currentUser.profilePicUrl,
          koachPoints: currentUser.koachPoints,
          isCurrentUser: true,
        },
        ...friends.map(friend => ({
          id: friend.id,
          username: friend.username,
          firstName: friend.firstName,
          lastName: friend.lastName,
          profilePicUrl: friend.profilePicUrl,
          koachPoints: friend.koachPoints,
          isCurrentUser: false,
        })),
      ];
      
      // Sort by Koach points (descending)
      leaderboard.sort((a, b) => b.koachPoints - a.koachPoints);
      
      res.status(200).json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Error fetching leaderboard" });
    }
  });

  // Check for badges to award
  app.post("/api/check-badges", verifyJWT, async (req, res) => {
    try {
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
    } catch (error) {
      console.error("Error checking badges:", error);
      res.status(500).json({ message: "Error checking badges" });
    }
  });
}
