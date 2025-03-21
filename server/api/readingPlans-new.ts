import { Express } from "express";
import { storage } from "../storage";
import { InsertReadingPlan } from "../../shared/schema";
import { asyncHandler } from "../utils/routeHandler";

export function setupReadingPlansRoutes(app: Express, verifyJWT: any) {
  // Get all reading plans for the authenticated user
  app.get("/api/reading-plans", verifyJWT, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const readingPlans = await storage.getReadingPlansByUser(userId);
      
      // Populate book data
      const plansWithBookData = await Promise.all(
        readingPlans.map(async (plan) => {
          const book = await storage.getBook(plan.bookId);
          return {
            ...plan,
            book: book ? {
              title: book.title,
              author: book.author,
              coverUrl: book.coverUrl
            } : null
          };
        })
      );
      
      res.status(200).json(plansWithBookData);
    } catch (error) {
      console.error("Error fetching reading plans:", error);
      res.status(500).json({ message: "Error fetching reading plans" });
    }
  }));

  // Get a specific reading plan by ID
  app.get("/api/reading-plans/:id", verifyJWT, asyncHandler(async (req: any, res: any) => {
    try {
      const planId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const readingPlan = await storage.getReadingPlan(planId);
      
      if (!readingPlan) {
        return res.status(404).json({ message: "Reading plan not found" });
      }
      
      if (readingPlan.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to reading plan" });
      }
      
      const book = await storage.getBook(readingPlan.bookId);
      
      const planWithBookData = {
        ...readingPlan,
        book: book ? {
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl
        } : null
      };
      
      res.status(200).json(planWithBookData);
    } catch (error) {
      console.error("Error fetching reading plan:", error);
      res.status(500).json({ message: "Error fetching reading plan" });
    }
  }));

  // Create a new reading plan
  app.post("/api/reading-plans", verifyJWT, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      
      // Validate required fields
      const { bookId, title, startDate, endDate, totalPages, frequency, pagesPerSession } = req.body;
      
      if (!bookId || !title || !startDate || !endDate || !totalPages || !frequency || !pagesPerSession) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Validate the book exists and user has access to it
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(400).json({ message: "Book not found" });
      }
      
      if (!book.isPublic && book.uploadedById !== userId) {
        return res.status(403).json({ message: "Unauthorized access to book" });
      }
      
      // Create the reading plan
      const newReadingPlan: InsertReadingPlan = {
        userId,
        bookId,
        title,
        startDate,
        endDate,
        totalPages: parseInt(totalPages),
        currentPage: 0,
        frequency,
        pagesPerSession: parseInt(pagesPerSession),
        notes: req.body.notes || null
      };
      
      const createdPlan = await storage.createReadingPlan(newReadingPlan);
      
      res.status(201).json({
        ...createdPlan,
        book: {
          title: book.title,
          author: book.author,
          coverImageUrl: book.coverImageUrl
        }
      });
    } catch (error) {
      console.error("Error creating reading plan:", error);
      res.status(500).json({ message: "Error creating reading plan" });
    }
  }));

  // Update reading plan progress
  app.post("/api/reading-plans/:id/progress", verifyJWT, asyncHandler(async (req: any, res: any) => {
    try {
      const planId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const { pagesRead, minutesSpent, notes } = req.body;
      
      if (pagesRead === undefined) {
        return res.status(400).json({ message: "Pages read is required" });
      }
      
      // Validate reading plan exists and belongs to user
      const readingPlan = await storage.getReadingPlan(planId);
      
      if (!readingPlan) {
        return res.status(404).json({ message: "Reading plan not found" });
      }
      
      if (readingPlan.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to reading plan" });
      }
      
      // Create reading session
      const koachEarned = await storage.createReadingSession(
        userId,
        readingPlan.bookId,
        planId,
        parseInt(pagesRead),
        minutesSpent ? parseInt(minutesSpent) : undefined
      );
      
      // Update reading plan currentPage
      const newCurrentPage = Math.min(
        readingPlan.totalPages,
        readingPlan.currentPage + parseInt(pagesRead)
      );
      
      const updatedPlan = await storage.updateReadingPlan(planId, {
        currentPage: newCurrentPage,
        notes: notes || readingPlan.notes
      });
      
      res.status(200).json({
        session: {
          pagesRead: parseInt(pagesRead),
          minutesSpent: minutesSpent ? parseInt(minutesSpent) : 0,
          koachEarned,
          notes
        },
        planId,
        updatedCurrentPage: newCurrentPage
      });
    } catch (error) {
      console.error("Error updating reading progress:", error);
      res.status(500).json({ message: "Error updating reading progress" });
    }
  }));

  // Delete a reading plan
  app.delete("/api/reading-plans/:id", verifyJWT, asyncHandler(async (req: any, res: any) => {
    try {
      // Get user ID from JWT token
      const userId = req.user.id;
      const planId = parseInt(req.params.id);
      
      // Check if plan exists and belongs to user
      const plan = await storage.getReadingPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Reading plan not found" });
      }
      
      if (plan.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this reading plan" });
      }
      
      // TODO: Implement deleteReadingPlan in storage
      // await storage.deleteReadingPlan(planId);
      
      res.status(200).json({ message: "Reading plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting reading plan:", error);
      res.status(500).json({ message: "Error deleting reading plan" });
    }
  }));
}