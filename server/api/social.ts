import { Express } from "express";
import { storage } from "../storage";
import { InsertChallenge } from "../../shared/schema";

export function setupSocialRoutes(app: Express, verifyJWT: any) {
  // -------------------- Friends endpoints --------------------
  
  // Get all friends
  app.get("/api/friends", verifyJWT, async (req, res) => {
    try {
      const userId = req.user!.id;
      const friends = await storage.getFriends(userId);
      
      res.status(200).json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Error fetching friends" });
    }
  });

  // Get pending friend requests
  app.get("/api/friend-requests", verifyJWT, async (req, res) => {
    try {
      const userId = req.user!.id;
      const requests = await storage.getFriendRequests(userId);
      
      res.status(200).json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Error fetching friend requests" });
    }
  });

  // Send a friend request
  app.post("/api/friends", verifyJWT, async (req, res) => {
    try {
      const { friendId } = req.body;
      
      if (!friendId) {
        return res.status(400).json({ message: "Friend ID is required" });
      }
      
      const targetId = parseInt(friendId);
      
      // Check if target user exists
      const targetUser = await storage.getUser(targetId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Send friend request
      const success = await storage.sendFriendRequest(req.user!.id, targetId);
      
      if (!success) {
        return res.status(400).json({ message: "Friend request could not be sent" });
      }
      
      res.status(201).json({ message: "Friend request sent" });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Error sending friend request" });
    }
  });

  // Accept or decline a friend request
  app.put("/api/friend-requests/:id", verifyJWT, async (req, res) => {
    try {
      const friendId = parseInt(req.params.id);
      if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid friend ID" });
      }
      
      const { status } = req.body;
      
      if (status !== "accepted" && status !== "declined") {
        return res.status(400).json({ message: "Status must be 'accepted' or 'declined'" });
      }
      
      const success = await storage.updateFriendStatus(req.user!.id, friendId, status);
      
      if (!success) {
        return res.status(400).json({ message: "Friend request could not be updated" });
      }
      
      res.status(200).json({ message: `Friend request ${status}` });
    } catch (error) {
      console.error("Error updating friend request:", error);
      res.status(500).json({ message: "Error updating friend request" });
    }
  });

  // -------------------- Challenges endpoints --------------------
  
  // Get all challenges for the user
  app.get("/api/challenges", verifyJWT, async (req, res) => {
    try {
      const userId = req.user!.id;
      const challenges = await storage.getChallenges(userId);
      
      res.status(200).json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Error fetching challenges" });
    }
  });

  // Get a specific challenge
  app.get("/api/challenges/:id", verifyJWT, async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      // TODO: Get participants details
      
      res.status(200).json(challenge);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      res.status(500).json({ message: "Error fetching challenge" });
    }
  });

  // Create a new challenge
  app.post("/api/challenges", verifyJWT, async (req, res) => {
    try {
      const { name, description, startDate, endDate, target, targetType, isPrivate } = req.body;
      
      // Validate required fields
      if (!name || !description || !startDate || !endDate || !target || !targetType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Validate target type
      if (!["koach", "books", "pages"].includes(targetType)) {
        return res.status(400).json({ message: "Target type must be 'koach', 'books', or 'pages'" });
      }
      
      // Calculate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
      
      const newChallenge: InsertChallenge = {
        name,
        description,
        creatorId: req.user!.id,
        startDate: start,
        endDate: end,
        target: parseInt(target),
        targetType,
        isPrivate: isPrivate || false,
      };
      
      const challenge = await storage.createChallenge(newChallenge);
      
      res.status(201).json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ message: "Error creating challenge" });
    }
  });

  // Join a challenge
  app.post("/api/challenges/:id/join", verifyJWT, async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      // Check if challenge exists
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      // Check if challenge is private
      if (challenge.isPrivate && challenge.creatorId !== req.user!.id) {
        // TODO: Check if user was invited
        return res.status(403).json({ message: "This challenge is private" });
      }
      
      // Join the challenge
      const success = await storage.joinChallenge(challengeId, req.user!.id);
      
      if (!success) {
        return res.status(400).json({ message: "Could not join challenge" });
      }
      
      res.status(200).json({ message: "Challenge joined successfully" });
    } catch (error) {
      console.error("Error joining challenge:", error);
      res.status(500).json({ message: "Error joining challenge" });
    }
  });

  // Update challenge progress
  app.put("/api/challenges/:id/progress", verifyJWT, async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const { progress } = req.body;
      
      if (progress === undefined) {
        return res.status(400).json({ message: "Progress is required" });
      }
      
      // Update the progress
      const success = await storage.updateChallengeProgress(
        challengeId,
        req.user!.id,
        parseInt(progress)
      );
      
      if (!success) {
        return res.status(400).json({ message: "Could not update challenge progress" });
      }
      
      // Check if challenge is complete
      const challenge = await storage.getChallenge(challengeId);
      const isComplete = challenge && parseInt(progress) >= challenge.target;
      
      res.status(200).json({ 
        message: "Challenge progress updated",
        isComplete: isComplete || false
      });
    } catch (error) {
      console.error("Error updating challenge progress:", error);
      res.status(500).json({ message: "Error updating challenge progress" });
    }
  });

  // Search users
  app.get("/api/users/search", verifyJWT, async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || (query as string).length < 3) {
        return res.status(400).json({ message: "Search query must be at least 3 characters" });
      }
      
      // TODO: Implement user search
      
      res.status(200).json([]);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Error searching users" });
    }
  });
}
