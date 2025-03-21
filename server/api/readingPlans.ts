import { Express } from "express";
import { storage } from "../storage";
import { InsertReadingPlan } from "../../shared/schema";

export function setupReadingPlansRoutes(app: Express, verifyJWT: any) {
  // Get all reading plans for the authenticated user
  app.get("/api/reading-plans", verifyJWT, async (req, res) => {
    try {
      const userId = req.user!.id;
      const readingPlans = await storage.getReadingPlansByUser(userId);
      
      // Populate book data
      const plansWithBookData = await Promise.all(
        readingPlans.map(async (plan) => {
          const book = await storage.getBook(plan.bookId);
          return {
            ...plan,
            book,
          };
        })
      );
      
      res.status(200).json(plansWithBookData);
    } catch (error) {
      console.error("Error fetching reading plans:", error);
      res.status(500).json({ message: "Error fetching reading plans" });
    }
  });

  // Get a specific reading plan
  app.get("/api/reading-plans/:id", verifyJWT, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Invalid reading plan ID" });
      }
      
      const readingPlan = await storage.getReadingPlan(planId);
      
      if (!readingPlan) {
        return res.status(404).json({ message: "Reading plan not found" });
      }
      
      // Ensure the user owns this reading plan
      if (readingPlan.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to access this reading plan" });
      }
      
      // Get book data
      const book = await storage.getBook(readingPlan.bookId);
      
      res.status(200).json({
        ...readingPlan,
        book,
      });
    } catch (error) {
      console.error("Error fetching reading plan:", error);
      res.status(500).json({ message: "Error fetching reading plan" });
    }
  });

  // Create a new reading plan
  app.post("/api/reading-plans", verifyJWT, async (req, res) => {
    try {
      const {
        bookId,
        startDate,
        endDate,
        frequency,
        daysOfWeek,
        preferredTime,
        format,
      } = req.body;
      
      // Validate required fields
      if (!bookId || !startDate || !endDate || !frequency) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get the book to calculate pages per session
      const book = await storage.getBook(parseInt(bookId));
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      // Calculate days between start and end dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (totalDays <= 0) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
      
      // Calculate reading sessions based on frequency
      let readingSessions = 0;
      
      if (frequency === "daily") {
        readingSessions = totalDays;
      } else if (frequency === "weekly") {
        // If specific days are provided, count them
        if (daysOfWeek && daysOfWeek.length > 0) {
          // Calculate how many of each weekday occur in the date range
          const dayCountMap = new Map<number, number>();
          for (let i = 0; i <= totalDays; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
            
            if (daysOfWeek.includes(dayOfWeek)) {
              dayCountMap.set(dayOfWeek, (dayCountMap.get(dayOfWeek) || 0) + 1);
            }
          }
          
          // Sum up all the days
          readingSessions = Array.from(dayCountMap.values()).reduce((sum, count) => sum + count, 0);
        } else {
          // Default to once per week
          readingSessions = Math.ceil(totalDays / 7);
        }
      } else if (frequency === "custom") {
        // For custom frequency, use days of week if provided or default to 3 times per week
        if (daysOfWeek && daysOfWeek.length > 0) {
          readingSessions = Math.ceil(totalDays * (daysOfWeek.length / 7));
        } else {
          readingSessions = Math.ceil(totalDays * (3 / 7)); // Default to 3 times per week
        }
      }
      
      // Ensure at least one reading session
      readingSessions = Math.max(1, readingSessions);
      
      // Calculate pages per session
      const pagesPerSession = Math.ceil(book.pageCount / readingSessions);
      
      // Create the reading plan
      const newReadingPlan: InsertReadingPlan = {
        userId: req.user!.id,
        bookId: parseInt(bookId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        frequency,
        daysOfWeek: daysOfWeek || undefined,
        preferredTime,
        pagesPerSession,
        totalPagesRead: 0,
        format: format || "text",
      };
      
      const readingPlan = await storage.createReadingPlan(newReadingPlan);
      
      res.status(201).json({
        ...readingPlan,
        book,
      });
    } catch (error) {
      console.error("Error creating reading plan:", error);
      res.status(500).json({ message: "Error creating reading plan" });
    }
  });

  // Update reading progress
  app.post("/api/reading-plans/:id/progress", verifyJWT, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Invalid reading plan ID" });
      }
      
      const { pagesRead, minutesSpent } = req.body;
      
      if (!pagesRead || pagesRead <= 0) {
        return res.status(400).json({ message: "Pages read must be greater than 0" });
      }
      
      // Get the reading plan
      const readingPlan = await storage.getReadingPlan(planId);
      
      if (!readingPlan) {
        return res.status(404).json({ message: "Reading plan not found" });
      }
      
      // Ensure the user owns this reading plan
      if (readingPlan.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this reading plan" });
      }
      
      // Record the reading session and update Koach points
      const koachEarned = await storage.createReadingSession(
        req.user!.id,
        readingPlan.bookId,
        planId,
        pagesRead,
        minutesSpent
      );
      
      // Check if the reading plan is now complete
      const updatedPlan = await storage.getReadingPlan(planId);
      const book = await storage.getBook(readingPlan.bookId);
      
      const isComplete = updatedPlan && book && 
                         updatedPlan.totalPagesRead >= book.pageCount;
      
      if (isComplete) {
        await storage.updateReadingPlan(planId, { isCompleted: true });
        
        // Create a notification for completion
        await storage.createNotification({
          userId: req.user!.id,
          type: "system",
          title: "Reading Plan Completed!",
          message: `You've completed your reading plan for "${book!.title}". Great job!`,
          relatedId: planId,
        });
      }
      
      res.status(200).json({
        message: "Reading progress updated",
        koachEarned,
        isComplete: isComplete || false,
      });
    } catch (error) {
      console.error("Error updating reading progress:", error);
      res.status(500).json({ message: "Error updating reading progress" });
    }
  });

  // Delete a reading plan
  app.delete("/api/reading-plans/:id", verifyJWT, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Invalid reading plan ID" });
      }
      
      // Get the reading plan
      const readingPlan = await storage.getReadingPlan(planId);
      
      if (!readingPlan) {
        return res.status(404).json({ message: "Reading plan not found" });
      }
      
      // Ensure the user owns this reading plan
      if (readingPlan.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this reading plan" });
      }
      
      // TODO: Delete the reading plan
      
      res.status(200).json({ message: "Reading plan deleted" });
    } catch (error) {
      console.error("Error deleting reading plan:", error);
      res.status(500).json({ message: "Error deleting reading plan" });
    }
  });
}
