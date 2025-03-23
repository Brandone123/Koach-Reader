import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../utils/routeHandler";

// Define allowed notification types to include 'reminder'
type NotificationType = 'achievement' | 'challenge' | 'friend' | 'reading' | 'system' | 'reminder';

export function setupNotificationsRoutes(app: Express, verifyJWT: any) {
  // Get user notifications
  app.get("/api/notifications", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const notifications = await storage.getNotifications(userId);
    
    res.status(200).json(notifications);
  }));

  // Mark notification as read
  app.put("/api/notifications/:id", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    const success = await storage.markNotificationAsRead(notificationId);
    
    if (!success) {
      return res.status(400).json({ message: "Could not update notification" });
    }
    
    res.status(200).json({ message: "Notification marked as read" });
  }));

  // Mark all notifications as read
  app.put("/api/notifications", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const notifications = await storage.getNotifications(userId);
    
    // Mark each notification as read
    for (const notification of notifications) {
      if (!notification.isRead) {
        await storage.markNotificationAsRead(notification.id);
      }
    }
    
    res.status(200).json({ message: "All notifications marked as read" });
  }));

  // Create a reminder notification for the user to continue reading
  app.post("/api/notifications/reminder", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const { bookId, bookTitle } = req.body;
    
    if (!bookId || !bookTitle) {
      return res.status(400).json({ message: "Book ID and title are required" });
    }
    
    const notification = await storage.createNotification({
      userId: req.user!.id,
      type: "reminder" as NotificationType,
      title: "Reading Reminder",
      message: `Time to continue reading "${bookTitle}"`,
      relatedId: parseInt(bookId),
    });
    
    res.status(201).json(notification);
  }));
}