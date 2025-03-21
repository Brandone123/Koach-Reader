import { Express } from "express";
import { storage } from "../storage";

export function setupNotificationsRoutes(app: Express, verifyJWT: any) {
  // Get user notifications
  app.get("/api/notifications", verifyJWT, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getNotifications(userId);
      
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id", verifyJWT, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(400).json({ message: "Could not update notification" });
      }
      
      res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ message: "Error updating notification" });
    }
  });

  // Mark all notifications as read
  app.put("/api/notifications", verifyJWT, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getNotifications(userId);
      
      // Mark each notification as read
      for (const notification of notifications) {
        if (!notification.isRead) {
          await storage.markNotificationAsRead(notification.id);
        }
      }
      
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error updating notifications:", error);
      res.status(500).json({ message: "Error updating notifications" });
    }
  });

  // Create a reading reminder notification (for testing)
  app.post("/api/notifications/reminder", verifyJWT, async (req, res) => {
    try {
      const { bookId, bookTitle } = req.body;
      
      if (!bookId || !bookTitle) {
        return res.status(400).json({ message: "Book ID and title are required" });
      }
      
      const notification = await storage.createNotification({
        userId: req.user!.id,
        type: "reminder",
        title: "Reading Reminder",
        message: `Time to continue reading "${bookTitle}"`,
        relatedId: parseInt(bookId),
      });
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Error creating notification" });
    }
  });
}
