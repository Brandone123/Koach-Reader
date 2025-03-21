import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Check for JWT authentication in the verifyJWT function
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // JWT will be verified in the verifyJWT middleware
  next();
}

// Check if user is premium
export function isPremiumUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (!req.user.isPremium) {
    return res.status(403).json({ message: "Premium subscription required" });
  }
  
  next();
}

// Validate that a user owns a resource
export async function isResourceOwner(
  req: Request, 
  res: Response, 
  next: NextFunction, 
  resourceType: string
) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const resourceId = parseInt(req.params.id);
  if (isNaN(resourceId)) {
    return res.status(400).json({ message: "Invalid resource ID" });
  }
  
  let isOwner = false;
  
  switch (resourceType) {
    case "book":
      const book = await storage.getBook(resourceId);
      isOwner = book?.uploadedById === req.user.id;
      break;
    case "readingPlan":
      const plan = await storage.getReadingPlan(resourceId);
      isOwner = plan?.userId === req.user.id;
      break;
    case "challenge":
      const challenge = await storage.getChallenge(resourceId);
      isOwner = challenge?.creatorId === req.user.id;
      break;
    default:
      return res.status(500).json({ message: "Invalid resource type" });
  }
  
  if (!isOwner) {
    return res.status(403).json({ message: "You don't have permission to modify this resource" });
  }
  
  next();
}
