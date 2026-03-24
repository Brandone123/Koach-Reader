import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { InsertChallenge } from "../../shared/schema";
import { asyncHandler } from "../utils/routeHandler";
import { supabase } from "../utils/db";

function toChallengeDto(challenge: any) {
  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    creatorId: challenge.created_by,
    startDate: challenge.start_date,
    endDate: challenge.end_date,
    goal: challenge.goal,
    goalType: challenge.goal_type,
    isPrivate: challenge.is_private,
    participantCount: challenge.participant_count || 0,
    myProgress: challenge.my_progress ?? 0,
    status: challenge.status || "active",
    createdAt: challenge.created_at,
    updatedAt: challenge.updated_at,
  };
}

export function setupSocialRoutes(app: Express, verifyJWT: any) {
  // -------------------- Friends endpoints --------------------
  
  // Get all friends
  app.get("/api/friends", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const friends = await storage.getFriends(userId);
    
    res.status(200).json(friends);
  }));

  // Get pending friend requests
  app.get("/api/friend-requests", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const requests = await storage.getFriendRequests(userId);
    
    res.status(200).json(requests);
  }));

  // Send a friend request
  app.post("/api/friends", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const { friendId } = req.body;
    
    if (!friendId) {
      return res.status(400).json({ message: "Friend ID is required" });
    }
    
    const targetId = String(friendId);
    
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
  }));

  // Accept or decline a friend request
  app.put("/api/friend-requests/:id", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const friendId = String(req.params.id);
    if (!friendId) {
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
  }));

  // -------------------- Challenges endpoints --------------------
  
  // Get all challenges for the user
  app.get("/api/challenges", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const challenges = await storage.getChallenges(userId);
    res.status(200).json((challenges || []).map(toChallengeDto));
  }));

  // Get current user's challenges (compat endpoint for frontend)
  app.get("/api/user/challenges", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const challenges = await storage.getChallenges(userId);
    const mine = (challenges || []).filter((c: any) => String(c.created_by) === String(userId));
    res.status(200).json(mine.map(toChallengeDto));
  }));

  // Get a specific challenge
  app.get("/api/challenges/:id", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const challengeId = parseInt(req.params.id);
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: "Invalid challenge ID" });
    }
    
    const challenge = await storage.getChallenge(challengeId);
    
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    
    // TODO: Get participants details
    
    res.status(200).json(toChallengeDto(challenge));
  }));

  // Create a new challenge
  app.post("/api/challenges", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const { name, title, description, startDate, endDate, target, goal, targetType, goalType, isPrivate } = req.body;
    const normalizedTitle = title || name;
    const normalizedGoal = goal ?? target;
    const normalizedGoalType = goalType || targetType;
    
    // Validate required fields
    if (!normalizedTitle || !description || !startDate || !endDate || !normalizedGoal || !normalizedGoalType) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Validate target type
    if (!["koach", "books", "pages", "minutes"].includes(normalizedGoalType)) {
      return res.status(400).json({ message: "Goal type must be 'koach', 'books', 'pages' or 'minutes'" });
    }
    
    // Calculate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({ message: "End date must be after start date" });
    }
    
    const newChallenge: InsertChallenge = {
      title: normalizedTitle,
      description,
      created_by: req.user!.id,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      goal: parseInt(String(normalizedGoal)),
      goal_type: normalizedGoalType,
      is_private: isPrivate || false,
    };
    
    const challenge = await storage.createChallenge(newChallenge);
    
    res.status(201).json(toChallengeDto(challenge));
  }));

  // Join a challenge
  app.post("/api/challenges/:id/join", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
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
    if (challenge.is_private && challenge.created_by !== req.user!.id) {
      // TODO: Check if user was invited
      return res.status(403).json({ message: "This challenge is private" });
    }
    
    // Join the challenge
    const success = await storage.joinChallenge(challengeId, req.user!.id);
    
    if (!success) {
      return res.status(400).json({ message: "Could not join challenge" });
    }
    
    res.status(200).json({ message: "Challenge joined successfully" });
  }));

  const updateProgressHandler = asyncHandler(async (req: Request, res: Response) => {
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
    const isComplete = challenge && parseInt(progress) >= challenge.goal;
    
    res.status(200).json({ 
      message: "Challenge progress updated",
      isComplete: isComplete || false
    });
  });

  // Update challenge progress (support both PUT and POST)
  app.put("/api/challenges/:id/progress", verifyJWT, updateProgressHandler);
  app.post("/api/challenges/:id/progress", verifyJWT, updateProgressHandler);

  // Get challenge participants
  app.get("/api/challenges/:id/participants", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const challengeId = parseInt(req.params.id);
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: "Invalid challenge ID" });
    }

    const { data, error } = await supabase
      .from("challenge_participants")
      .select("id, user_id, current_progress, status, created_at, users(username)")
      .eq("challenge_id", challengeId)
      .order("current_progress", { ascending: false });

    if (error) {
      return res.status(500).json({ message: "Failed to fetch participants" });
    }

    const participants = (data || []).map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      username: p.users?.username || "user",
      progress: p.current_progress || 0,
      progressPercentage: 0,
      status: p.status || "active",
      joinedAt: p.created_at,
    }));

    res.status(200).json(participants);
  }));

  // Get challenge comments (no dedicated table yet -> return empty array)
  app.get("/api/challenges/:id/comments", verifyJWT, asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json([]);
  }));

  // Add challenge comment (no dedicated table yet)
  app.post("/api/challenges/:id/comments", verifyJWT, asyncHandler(async (_req: Request, res: Response) => {
    res.status(501).json({ message: "Challenge comments not implemented in database yet" });
  }));

  // Search users
  app.get("/api/users/search", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;
    
    if (!query || (query as string).length < 3) {
      return res.status(400).json({ message: "Search query must be at least 3 characters" });
    }
    
    // TODO: Implement user search
    
    res.status(200).json([]);
  }));
}
