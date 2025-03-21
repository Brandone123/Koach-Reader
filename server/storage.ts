import { eq, and, or, sql } from "drizzle-orm";
import { db, pool } from "./db";
import session from "express-session";
import * as connectPgSimple from "connect-pg-simple";
import {
  users,
  books,
  readingPlans,
  badges,
  challenges,
  friends,
  userBadges,
  notifications,
  userBooks,
  readingSessions,
  challengeParticipants,
  comments,
  type User,
  type InsertUser,
  type Book,
  type InsertBook,
  type ReadingPlan,
  type InsertReadingPlan,
  type Badge,
  type InsertBadge,
  type Challenge,
  type InsertChallenge,
  type Notification,
  type InsertNotification,
} from "../shared/schema";

// Create a PostgreSQL session store
const PgSessionStore = connectPgSimple.default(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Book management
  getBook(id: number): Promise<Book | undefined>;
  getBooks(options?: {
    category?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Book[]>;
  getBooksByUser(userId: number): Promise<Book[]>;
  createBook(insertBook: InsertBook): Promise<Book>;
  updateBook(id: number, bookData: Partial<InsertBook>): Promise<Book | undefined>;
  
  // Reading plans
  getReadingPlan(id: number): Promise<ReadingPlan | undefined>;
  getReadingPlansByUser(userId: number): Promise<ReadingPlan[]>;
  createReadingPlan(insertReadingPlan: InsertReadingPlan): Promise<ReadingPlan>;
  updateReadingPlan(
    id: number,
    readingPlanData: Partial<InsertReadingPlan>
  ): Promise<ReadingPlan | undefined>;
  
  // Reading sessions
  createReadingSession(
    userId: number,
    bookId: number,
    readingPlanId: number | null,
    pagesRead: number,
    minutesSpent?: number
  ): Promise<number>; // Returns koachEarned
  
  // Badges
  getBadges(): Promise<Badge[]>;
  getUserBadges(userId: number): Promise<Badge[]>;
  awardBadgeToUser(userId: number, badgeId: number): Promise<boolean>;
  
  // Social features
  getFriends(userId: number): Promise<User[]>;
  getFriendRequests(userId: number): Promise<any[]>;
  sendFriendRequest(userId: number, friendId: number): Promise<boolean>;
  updateFriendStatus(
    userId: number,
    friendId: number,
    status: "accepted" | "declined"
  ): Promise<boolean>;
  
  // Challenges
  getChallenges(userId: number): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(insertChallenge: InsertChallenge): Promise<Challenge>;
  joinChallenge(
    challengeId: number,
    userId: number
  ): Promise<boolean>;
  updateChallengeProgress(
    challengeId: number,
    userId: number,
    progress: number
  ): Promise<boolean>;
  
  // Notifications
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(insertNotification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any;
}

// Implement the IStorage interface with PostgreSQL/Drizzle
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PgSessionStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    });
  }

  // User management methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: sql`NOW()` })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Book management methods
  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async getBooks(options?: {
    category?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Book[]> {
    const whereConditions = [];

    if (options?.category) {
      whereConditions.push(eq(books.category, options.category));
    }

    if (options?.isPublic !== undefined) {
      whereConditions.push(eq(books.isPublic, options.isPublic));
    }

    // Build and execute query based on conditions
    let results: Book[];
    
    if (whereConditions.length > 0) {
      results = await db
        .select()
        .from(books)
        .where(and(...whereConditions))
        .limit(options?.limit || 100)
        .offset(options?.offset || 0);
    } else {
      results = await db
        .select()
        .from(books)
        .limit(options?.limit || 100)
        .offset(options?.offset || 0);
    }
    
    return results;
  }

  async getBooksByUser(userId: number): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(
        or(
          eq(books.uploadedById, userId),
          eq(books.isPublic, true)
        )
      );
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db.insert(books).values(insertBook).returning();
    return book;
  }

  async updateBook(id: number, bookData: Partial<InsertBook>): Promise<Book | undefined> {
    const [updatedBook] = await db
      .update(books)
      .set({ ...bookData, updatedAt: sql`NOW()` })
      .where(eq(books.id, id))
      .returning();
    return updatedBook;
  }

  // Reading plan methods
  async getReadingPlan(id: number): Promise<ReadingPlan | undefined> {
    const [plan] = await db.select().from(readingPlans).where(eq(readingPlans.id, id));
    return plan;
  }

  async getReadingPlansByUser(userId: number): Promise<ReadingPlan[]> {
    return await db
      .select()
      .from(readingPlans)
      .where(eq(readingPlans.userId, userId));
  }

  async createReadingPlan(insertReadingPlan: InsertReadingPlan): Promise<ReadingPlan> {
    const [plan] = await db
      .insert(readingPlans)
      .values(insertReadingPlan)
      .returning();
    return plan;
  }
  
  // Méthode alternative qui utilise uniquement les colonnes existantes
  async createReadingPlanSimple(planData: {
    userId: number;
    bookId: number;
    startDate: Date;
    endDate: Date;
    frequency: string;
    pagesPerSession: number;
    title?: string;
    total_pages?: number;
    current_page?: number;
    notes?: string;
  }): Promise<any> {
    // Construction de la requête SQL directe pour éviter les problèmes de schéma
    const query = `
      INSERT INTO reading_plans (
        user_id, book_id, start_date, end_date, frequency, 
        pages_per_session, title, total_pages, current_page, notes,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) RETURNING *
    `;
    
    const values = [
      planData.userId,
      planData.bookId,
      planData.startDate,
      planData.endDate,
      planData.frequency,
      planData.pagesPerSession,
      planData.title || `Plan de lecture: ${planData.bookId}`,
      planData.total_pages || 100,
      planData.current_page || 0,
      planData.notes || ''
    ];
    
    // Importer le pool depuis db.ts
    const { pool } = await import('./db');
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async updateReadingPlan(
    id: number,
    readingPlanData: Partial<InsertReadingPlan>
  ): Promise<ReadingPlan | undefined> {
    const [updatedPlan] = await db
      .update(readingPlans)
      .set({ ...readingPlanData, updatedAt: sql`NOW()` })
      .where(eq(readingPlans.id, id))
      .returning();
    return updatedPlan;
  }

  // Reading sessions methods
  async createReadingSession(
    userId: number,
    bookId: number,
    readingPlanId: number | null,
    pagesRead: number,
    minutesSpent?: number
  ): Promise<number> {
    // Calculate Koach points (simplified formula: 5 points per page)
    const koachEarned = pagesRead * 5;

    // Create reading session
    const [session] = await db
      .insert(readingSessions)
      .values({
        userId,
        bookId,
        readingPlanId: readingPlanId || undefined,
        pagesRead,
        minutesSpent,
        koachEarned,
      })
      .returning();

    // Update user's Koach points
    await db
      .update(users)
      .set({
        koachPoints: sql`${users.koachPoints} + ${koachEarned}`,
      })
      .where(eq(users.id, userId));

    // Update reading plan if provided
    if (readingPlanId) {
      await db
        .update(readingPlans)
        .set({
          totalPagesRead: sql`${readingPlans.totalPagesRead} + ${pagesRead}`,
          lastReadDate: sql`NOW()`,
        })
        .where(eq(readingPlans.id, readingPlanId));
    }

    // Update user_books table
    const [userBook] = await db
      .select()
      .from(userBooks)
      .where(
        and(
          eq(userBooks.userId, userId),
          eq(userBooks.bookId, bookId)
        )
      );

    if (userBook) {
      // Get book to calculate completion percentage
      const book = await this.getBook(bookId);
      if (book) {
        const newLastPage = userBook.lastPageRead + pagesRead;
        const newPercentage = Math.min(
          Math.floor((newLastPage / book.pageCount) * 100),
          100
        );

        await db
          .update(userBooks)
          .set({
            lastPageRead: newLastPage,
            completionPercentage: newPercentage,
            updatedAt: sql`NOW()`,
          })
          .where(eq(userBooks.id, userBook.id));
      }
    } else {
      // Create new user_book entry
      const book = await this.getBook(bookId);
      if (book) {
        const percentage = Math.min(
          Math.floor((pagesRead / book.pageCount) * 100),
          100
        );

        await db.insert(userBooks).values({
          userId,
          bookId,
          lastPageRead: pagesRead,
          completionPercentage: percentage,
        });
      }
    }

    return koachEarned;
  }

  // Badge methods
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getUserBadges(userId: number): Promise<Badge[]> {
    return await db
      .select({
        id: badges.id,
        name: badges.name,
        description: badges.description,
        iconName: badges.iconName,
        koachReward: badges.koachReward,
        earnedAt: userBadges.earnedAt,
      })
      .from(badges)
      .innerJoin(
        userBadges,
        and(
          eq(badges.id, userBadges.badgeId),
          eq(userBadges.userId, userId)
        )
      );
  }

  async awardBadgeToUser(userId: number, badgeId: number): Promise<boolean> {
    try {
      // Check if user already has this badge
      const [existingBadge] = await db
        .select()
        .from(userBadges)
        .where(
          and(
            eq(userBadges.userId, userId),
            eq(userBadges.badgeId, badgeId)
          )
        );

      if (existingBadge) {
        return false; // User already has this badge
      }

      // Award badge to user
      await db.insert(userBadges).values({
        userId,
        badgeId,
      });

      // Add Koach points to user
      const [badge] = await db.select().from(badges).where(eq(badges.id, badgeId));
      
      if (badge) {
        await db
          .update(users)
          .set({
            koachPoints: sql`${users.koachPoints} + ${badge.koachReward}`,
          })
          .where(eq(users.id, userId));

        // Create notification
        await this.createNotification({
          userId,
          type: "achievement",
          title: "New Badge Earned!",
          message: `You've earned the "${badge.name}" badge and ${badge.koachReward} Koach points!`,
          relatedId: badgeId,
        });
      }

      return true;
    } catch (error) {
      console.error("Error awarding badge:", error);
      return false;
    }
  }

  // Friend methods
  async getFriends(userId: number): Promise<User[]> {
    // Get all accepted friends (both directions)
    const friendRows = await db
      .select({
        friendId: friends.friendId,
        userId: friends.userId,
      })
      .from(friends)
      .where(
        and(
          or(
            eq(friends.userId, userId),
            eq(friends.friendId, userId)
          ),
          eq(friends.status, "accepted")
        )
      );

    // Extract the IDs of friends
    const friendIds = friendRows.map(row => 
      row.userId === userId ? row.friendId : row.userId
    );

    if (friendIds.length === 0) {
      return [];
    }

    // Get user details for friends
    return await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        profilePicUrl: users.profilePicUrl,
        koachPoints: users.koachPoints,
        isPremium: users.isPremium,
        preferences: users.preferences,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(sql`${users.id} IN (${friendIds.join(', ')})`);
  }

  async getFriendRequests(userId: number): Promise<any[]> {
    // Get pending friend requests sent to the user
    const requests = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profilePicUrl: users.profilePicUrl,
        createdAt: friends.createdAt,
      })
      .from(friends)
      .innerJoin(users, eq(friends.userId, users.id))
      .where(
        and(
          eq(friends.friendId, userId),
          eq(friends.status, "pending")
        )
      );

    return requests;
  }

  async sendFriendRequest(userId: number, friendId: number): Promise<boolean> {
    if (userId === friendId) {
      return false; // Can't add yourself as a friend
    }

    try {
      // Check if a request already exists in either direction
      const [existingRequest] = await db
        .select()
        .from(friends)
        .where(
          or(
            and(
              eq(friends.userId, userId),
              eq(friends.friendId, friendId)
            ),
            and(
              eq(friends.userId, friendId),
              eq(friends.friendId, userId)
            )
          )
        );

      if (existingRequest) {
        return false; // Request already exists
      }

      // Create a new friend request
      await db.insert(friends).values({
        userId,
        friendId,
        status: "pending",
      });

      // Create a notification for the friend
      await this.createNotification({
        userId: friendId,
        type: "friend",
        title: "New Friend Request",
        message: `You have a new friend request.`,
        relatedId: userId,
      });

      return true;
    } catch (error) {
      console.error("Error sending friend request:", error);
      return false;
    }
  }

  async updateFriendStatus(
    userId: number,
    friendId: number,
    status: "accepted" | "declined"
  ): Promise<boolean> {
    try {
      // Update the friend request
      const [updatedFriend] = await db
        .update(friends)
        .set({
          status,
          updatedAt: sql`NOW()`,
        })
        .where(
          and(
            eq(friends.userId, friendId),
            eq(friends.friendId, userId),
            eq(friends.status, "pending")
          )
        )
        .returning();

      if (!updatedFriend) {
        return false; // Request not found or not pending
      }

      if (status === "accepted") {
        // Create a notification for the original requester
        await this.createNotification({
          userId: friendId,
          type: "friend",
          title: "Friend Request Accepted",
          message: `Your friend request has been accepted.`,
          relatedId: userId,
        });
      }

      return true;
    } catch (error) {
      console.error("Error updating friend status:", error);
      return false;
    }
  }

  // Challenge methods
  async getChallenges(userId: number): Promise<Challenge[]> {
    // Get challenges created by the user
    const createdChallenges = await db
      .select()
      .from(challenges)
      .where(eq(challenges.creatorId, userId));

    // Get challenges the user is participating in
    const participatingChallenges = await db
      .select({
        id: challenges.id,
        name: challenges.name,
        description: challenges.description,
        creatorId: challenges.creatorId,
        startDate: challenges.startDate,
        endDate: challenges.endDate,
        target: challenges.target,
        targetType: challenges.targetType,
        isPrivate: challenges.isPrivate,
        createdAt: challenges.createdAt,
        updatedAt: challenges.updatedAt,
        status: challengeParticipants.status,
        progress: challengeParticipants.progress,
      })
      .from(challenges)
      .innerJoin(
        challengeParticipants,
        and(
          eq(challenges.id, challengeParticipants.challengeId),
          eq(challengeParticipants.userId, userId)
        )
      )
      .where(
        or(
          eq(challengeParticipants.status, "active"),
          eq(challengeParticipants.status, "completed")
        )
      );

    return [...createdChallenges, ...participatingChallenges];
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db
      .insert(challenges)
      .values(insertChallenge)
      .returning();
    
    // Add creator as a participant
    await db.insert(challengeParticipants).values({
      challengeId: challenge.id,
      userId: challenge.creatorId,
      status: "active",
    });
    
    return challenge;
  }

  async joinChallenge(
    challengeId: number,
    userId: number
  ): Promise<boolean> {
    try {
      // Check if user is already participating
      const [existing] = await db
        .select()
        .from(challengeParticipants)
        .where(
          and(
            eq(challengeParticipants.challengeId, challengeId),
            eq(challengeParticipants.userId, userId)
          )
        );

      if (existing) {
        return false; // Already participating
      }

      // Add user as participant
      await db.insert(challengeParticipants).values({
        challengeId,
        userId,
        status: "active",
      });

      // Get challenge info for notification
      const challenge = await this.getChallenge(challengeId);
      if (challenge) {
        // Notify challenge creator
        await this.createNotification({
          userId: challenge.creatorId,
          type: "challenge",
          title: "New Challenge Participant",
          message: `Someone has joined your challenge "${challenge.name}".`,
          relatedId: challengeId,
        });
      }

      return true;
    } catch (error) {
      console.error("Error joining challenge:", error);
      return false;
    }
  }

  async updateChallengeProgress(
    challengeId: number,
    userId: number,
    progress: number
  ): Promise<boolean> {
    try {
      // Update progress
      const [participant] = await db
        .update(challengeParticipants)
        .set({
          progress,
        })
        .where(
          and(
            eq(challengeParticipants.challengeId, challengeId),
            eq(challengeParticipants.userId, userId)
          )
        )
        .returning();

      if (!participant) {
        return false; // Not found
      }

      // Check if challenge is completed
      const challenge = await this.getChallenge(challengeId);
      if (challenge && progress >= challenge.target) {
        // Mark as completed
        await db
          .update(challengeParticipants)
          .set({
            status: "completed",
            completedAt: sql`NOW()`,
          })
          .where(
            and(
              eq(challengeParticipants.challengeId, challengeId),
              eq(challengeParticipants.userId, userId)
            )
          );

        // Create notification
        await this.createNotification({
          userId,
          type: "challenge",
          title: "Challenge Completed!",
          message: `You've completed the "${challenge.name}" challenge!`,
          relatedId: challengeId,
        });

        // Notify challenge creator if not the same user
        if (challenge.creatorId !== userId) {
          await this.createNotification({
            userId: challenge.creatorId,
            type: "challenge",
            title: "Challenge Update",
            message: `Someone has completed your challenge "${challenge.name}".`,
            relatedId: challengeId,
          });
        }
      }

      return true;
    } catch (error) {
      console.error("Error updating challenge progress:", error);
      return false;
    }
  }

  // Notification methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(sql`${notifications.createdAt} DESC`);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
