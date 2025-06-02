import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { checkDb } from "./utils/db";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  const dbStatus = await checkDb();
  res.status(200).json({
    status: "ok",
    db: dbStatus ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Register routes
const server = registerRoutes(app);

// Start server
const PORT = process.env.PORT || 8000;
server.listen(Number(PORT), () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle server shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
