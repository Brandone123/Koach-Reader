import { supabase, pool } from "./utils/db";
import session from "express-session";
import * as connectPgSimple from "connect-pg-simple";
import {
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
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Book management
  getBook(id: number): Promise<Book | undefined>;
  getBooks(options?: {
    category?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Book[]>;
  getBooksByUser(userId: string): Promise<Book[]>;
  createBook(insertBook: InsertBook): Promise<Book>;
  updateBook(id: number, bookData: Partial<InsertBook>): Promise<Book | undefined>;
  
  // Reading plans
  getReadingPlan(id: number): Promise<ReadingPlan | undefined>;
  getReadingPlansByUser(userId: string): Promise<ReadingPlan[]>;
  createReadingPlan(insertReadingPlan: InsertReadingPlan): Promise<ReadingPlan>;
  updateReadingPlan(
    id: number,
    readingPlanData: Partial<InsertReadingPlan>
  ): Promise<ReadingPlan | undefined>;
  
  // Reading sessions
  createReadingSession(
    userId: string,
    bookId: number,
    readingPlanId: number | null,
    pagesRead: number,
    minutesSpent?: number
  ): Promise<number>;
  
  // Badges
  getBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<Badge[]>;
  awardBadgeToUser(userId: string, badgeId: number): Promise<boolean>;
  
  // Social features
  getFriends(userId: string): Promise<User[]>;
  getFriendRequests(userId: string): Promise<any[]>;
  sendFriendRequest(userId: string, friendId: string): Promise<boolean>;
  updateFriendStatus(
    userId: string,
    friendId: string,
    status: "accepted" | "declined"
  ): Promise<boolean>;
  
  // Challenges
  getChallenges(userId: string): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(insertChallenge: InsertChallenge): Promise<Challenge>;
  joinChallenge(challengeId: number, userId: string): Promise<boolean>;
  updateChallengeProgress(
    challengeId: number,
    userId: string,
    progress: number
  ): Promise<boolean>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(insertNotification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any;
}

// Implement the IStorage interface with Supabase
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
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(insertUser)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create user');
    return data;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  // Book management methods
  async getBook(id: number): Promise<Book | undefined> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async getBooks(options?: {
    category?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Book[]> {
    let query = supabase.from('books').select('*');

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.isPublic !== undefined) {
      query = query.eq('is_public', options.isPublic);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  async getBooksByUser(userId: string): Promise<Book[]> {
    const { data, error } = await supabase
      .from('user_books')
      .select('books:books(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data?.map(item => (item.books as unknown) as Book) || [];
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const { data, error } = await supabase
      .from('books')
      .insert(insertBook)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create book');
    return data;
  }

  async updateBook(id: number, bookData: Partial<InsertBook>): Promise<Book | undefined> {
    const { data, error } = await supabase
      .from('books')
      .update({ 
        ...bookData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  // Reading plan methods
  async getReadingPlan(id: number): Promise<ReadingPlan | undefined> {
    const { data, error } = await supabase
      .from('reading_plans')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async getReadingPlansByUser(userId: string): Promise<ReadingPlan[]> {
    const { data, error } = await supabase
      .from('reading_plans')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  async createReadingPlan(insertReadingPlan: InsertReadingPlan): Promise<ReadingPlan> {
    const { data, error } = await supabase
      .from('reading_plans')
      .insert(insertReadingPlan)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create reading plan');
    return data;
  }

  async updateReadingPlan(
    id: number,
    readingPlanData: Partial<InsertReadingPlan>
  ): Promise<ReadingPlan | undefined> {
    const { data, error } = await supabase
      .from('reading_plans')
      .update({ 
        ...readingPlanData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  // Reading session methods
  async createReadingSession(
    userId: string,
    bookId: number,
    readingPlanId: number | null,
    pagesRead: number,
    minutesSpent?: number
  ): Promise<number> {
    const { data, error } = await supabase
      .from('reading_sessions')
      .insert({
        user_id: userId,
        book_id: bookId,
        reading_plan_id: readingPlanId,
        pages_read: pagesRead,
        minutes_spent: minutesSpent,
        session_date: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create reading session');

    // Update user's koach points (5 points per page)
    const koachEarned = pagesRead * 5;
    await supabase
      .from('users')
      .update({ 
        koach_points: data.koach_points + koachEarned,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    // Update reading plan if provided
    if (readingPlanId) {
      const { data: plan } = await supabase
        .from('reading_plans')
        .select('current_page')
        .eq('id', readingPlanId)
        .single();

      if (plan) {
        await supabase
          .from('reading_plans')
          .update({ 
            current_page: plan.current_page + pagesRead,
            updated_at: new Date().toISOString()
          })
          .eq('id', readingPlanId);
      }
    }

    return koachEarned;
  }

  // Badge methods
  async getBadges(): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getUserBadges(userId: string): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badges:badges(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data?.map(item => (item.badges as unknown) as Badge) || [];
  }

  async awardBadgeToUser(userId: string, badgeId: number): Promise<boolean> {
    const { error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        awarded_at: new Date().toISOString()
      });
    
    if (!error) {
      // Get badge details
      const { data: badge } = await supabase
        .from('badges')
        .select('*')
        .eq('id', badgeId)
        .single();

      if (badge) {
        // Update user's koach points
        await supabase
          .from('users')
          .update({ 
            koach_points: badge.points,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        // Create notification
        await this.createNotification({
          user_id: userId,
          type: 'achievement',
          title: 'New Badge Earned!',
          message: `You've earned the "${badge.name}" badge and ${badge.points} Koach points!`,
          is_read: false
        });
      }
    }
    
    return !error;
  }

  // Social feature methods
  async getFriends(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('friends')
      .select('friend:users!friends_friend_id_fkey(*)')
      .eq('user_id', userId)
      .eq('status', 'accepted');
    
    if (error) throw error;
    return data?.map(item => (item.friend as unknown) as User) || [];
  }

  async getFriendRequests(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        users!friends_user_id_fkey (*),
        friend:users!friends_friend_id_fkey (*)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');
    
    if (error) throw error;
    return data || [];
  }

  async sendFriendRequest(userId: string, friendId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (!error) {
      await this.createNotification({
        user_id: friendId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: 'You have a new friend request',
        is_read: false
      });
    }
    
    return !error;
  }

  async updateFriendStatus(
    userId: string,
    friendId: string,
    status: "accepted" | "declined"
  ): Promise<boolean> {
    const { error } = await supabase
      .from('friends')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', friendId)
      .eq('friend_id', userId);

    if (!error && status === 'accepted') {
      await this.createNotification({
        user_id: friendId,
        type: 'friend_request',
        title: 'Friend Request Accepted',
        message: 'Your friend request has been accepted',
        is_read: false
      });
    }
    
    return !error;
  }

  // Challenge methods
  async getChallenges(userId: string): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .or(`created_by.eq.${userId},id.in.(${
        supabase
          .from('challenge_participants')
          .select('challenge_id')
          .eq('user_id', userId)
          .toString()
      })`);
    
    if (error) throw error;
    return data || [];
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const { data, error } = await supabase
      .from('challenges')
      .insert(insertChallenge)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create challenge');

    // Add creator as participant
    await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: data.id,
        user_id: data.created_by,
        progress: 0,
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return data;
  }

  async joinChallenge(challengeId: number, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        progress: 0,
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (!error) {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challenge) {
        await this.createNotification({
          user_id: challenge.created_by,
          type: 'challenge',
          title: 'New Challenge Participant',
          message: `Someone has joined your challenge "${challenge.title}"`,
          is_read: false
        });
      }
    }
    
    return !error;
  }

  async updateChallengeProgress(
    challengeId: number,
    userId: string,
    progress: number
  ): Promise<boolean> {
    const { error } = await supabase
      .from('challenge_participants')
      .update({ 
        progress,
        updated_at: new Date().toISOString()
      })
      .eq('challenge_id', challengeId)
      .eq('user_id', userId);

    if (!error) {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challenge && progress >= challenge.goal) {
        // Mark as completed
        await supabase
          .from('challenge_participants')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('challenge_id', challengeId)
          .eq('user_id', userId);

        // Create notification for participant
        await this.createNotification({
          user_id: userId,
          type: 'challenge',
          title: 'Challenge Completed!',
          message: `You've completed the "${challenge.title}" challenge!`,
          is_read: false
        });

        // Create notification for challenge creator
        if (challenge.created_by !== userId) {
          await this.createNotification({
            user_id: challenge.created_by,
            type: 'challenge',
            title: 'Challenge Update',
            message: `Someone has completed your challenge "${challenge.title}"`,
            is_read: false
          });
        }
      }
    }
    
    return !error;
  }

  // Notification methods
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...insertNotification,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create notification');
    return data;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    return !error;
  }
}

// Export l'instance de stockage
export const storage = new DatabaseStorage();
