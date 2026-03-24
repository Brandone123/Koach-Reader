import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { InsertReadingPlan } from "../../shared/schema";
import { asyncHandler } from "../utils/routeHandler";

export function setupReadingPlansRoutes(app: Express, verifyJWT: any) {
  app.get("/api/reading-plans", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(400).json({ message: "Missing user context" });
    }

    const plans = await storage.getReadingPlansByUser(String(userId));
    res.status(200).json(plans);
  }));

  app.get("/api/reading-plans/:id", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid reading plan id" });
    }

    const plan = await storage.getReadingPlan(id);
    if (!plan) {
      return res.status(404).json({ message: "Reading plan not found" });
    }

    res.status(200).json(plan);
  }));

  app.post("/api/reading-plans", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const {
      book_id,
      title,
      start_date,
      end_date,
      frequency = "daily",
      pages_per_session,
      total_pages,
      notes = null
    } = req.body;

    if (!userId || !book_id || !title || !start_date || !end_date || !pages_per_session || !total_pages) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payload: InsertReadingPlan = {
      user_id: String(userId),
      book_id: Number(book_id),
      title: String(title),
      start_date: String(start_date),
      end_date: String(end_date),
      frequency: String(frequency),
      pages_per_session: Number(pages_per_session),
      total_pages: Number(total_pages),
      current_page: 0,
      notes: notes === null ? null : String(notes)
    };

    const created = await storage.createReadingPlan(payload);
    res.status(201).json(created);
  }));
}
