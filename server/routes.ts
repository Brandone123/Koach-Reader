import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth-new";
import { verifyJWT } from "./utils/auth-new";
import { setupBooksRoutes } from "./api/books";
import { setupReadingPlansRoutes } from "./api/readingPlans-new";
import { setupSocialRoutes } from "./api/social";
import { setupKoachRoutes } from "./api/koach";
import { setupNotificationsRoutes } from "./api/notifications";

export function registerRoutes(app: Express): Server {
  // Set up authentication configuration and routes
  setupAuth(app);

  // Set up other API routes with JWT verification
  setupBooksRoutes(app, verifyJWT, hashPassword);
  setupReadingPlansRoutes(app, verifyJWT);
  setupSocialRoutes(app, verifyJWT);
  setupKoachRoutes(app, verifyJWT);
  setupNotificationsRoutes(app, verifyJWT);

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
