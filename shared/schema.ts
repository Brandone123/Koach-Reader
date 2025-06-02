import { relations, sql } from "drizzle-orm";
import {
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";

// Enums
export const readingFrequencyEnum = pgEnum("reading_frequency", [
  "daily",
  "weekly",
  "custom",
]);

export const readingFormatEnum = pgEnum("reading_format", ["text", "audio"]);

export const ageRangeEnum = pgEnum("age_range", [
  "child",
  "teen",
  "adult",
]);

export const friendStatusEnum = pgEnum("friend_status", [
  "pending",
  "accepted",
  "declined",
]);

export const challengeStatusEnum = pgEnum("challenge_status", [
  "active",
  "completed",
  "abandoned",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "achievement",
  "challenge",
  "friend",
  "reading",
  "system",
  "reminder",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  koachPoints: integer("koach_points").default(0).notNull(),
  readingStreak: integer("reading_streak").default(0).notNull(),
  preferences: json("preferences").$type<UserPreferences>().default({}),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
  lastLogin: timestamp("last_login").default(sql`NOW()`).notNull(),
  avatarUrl: text("avatar_url"),
});

export const userRelations = relations(users, ({ many }) => ({
  readingPlans: many(readingPlans),
  userBooks: many(userBooks),
  badges: many(userBadges),
  friendsAsUser: many(friends, { relationName: "friendsAsUser" }),
  friendsAsFriend: many(friends, { relationName: "friendsAsFriend" }),
  challengesAsCreator: many(challenges, { relationName: "challengesAsCreator" }),
  challengeParticipants: many(challengeParticipants),
  comments: many(comments),
  notifications: many(notifications),
}));

// Books table
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  pageCount: integer("page_count").notNull(),
  category: text("category").notNull(),
  language: text("language").default("en").notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  uploadedById: integer("uploaded_by_id").references(() => users.id),
  fileUrl: text("file_url"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
  isbn: text("isbn"),
});

export const bookRelations = relations(books, ({ many, one }) => ({
  uploadedBy: one(users, {
    fields: [books.uploadedById],
    references: [users.id],
  }),
  userBooks: many(userBooks),
  readingPlans: many(readingPlans),
  comments: many(comments),
}));

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  iconName: text("icon_name"),
});

// Reading plans table
export const readingPlans = pgTable("reading_plans", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  frequency: readingFrequencyEnum("frequency").notNull(),
  daysOfWeek: json("days_of_week").$type<number[]>(),
  preferredTime: text("preferred_time"),
  pagesPerSession: integer("pages_per_session").notNull(),
  totalPagesRead: integer("total_pages_read").default(0).notNull(),
  lastReadDate: timestamp("last_read_date"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  format: readingFormatEnum("format").default("text").notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});

export const readingPlanRelations = relations(readingPlans, ({ one }) => ({
  user: one(users, {
    fields: [readingPlans.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [readingPlans.bookId],
    references: [books.id],
  }),
}));

// User_Books table - tracks user's relationship with books
export const userBooks = pgTable("user_books", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  rating: integer("rating"),
  lastPageRead: integer("last_page_read").default(0).notNull(),
  completionPercentage: integer("completion_percentage").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});

export const userBookRelations = relations(userBooks, ({ one }) => ({
  user: one(users, {
    fields: [userBooks.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [userBooks.bookId],
    references: [books.id],
  }),
}));

// Reading sessions table
export const readingSessions = pgTable("reading_sessions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  readingPlanId: integer("reading_plan_id").references(() => readingPlans.id, {
    onDelete: "set null",
  }),
  pagesRead: integer("pages_read").notNull(),
  minutesSpent: integer("minutes_spent"),
  koachEarned: integer("koach_earned").default(0).notNull(),
  sessionDate: timestamp("session_date").default(sql`NOW()`).notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const readingSessionRelations = relations(readingSessions, ({ one }) => ({
  user: one(users, {
    fields: [readingSessions.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [readingSessions.bookId],
    references: [books.id],
  }),
  readingPlan: one(readingPlans, {
    fields: [readingSessions.readingPlanId],
    references: [readingPlans.id],
  }),
}));

// Badges table
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  koachReward: integer("koach_reward").default(100).notNull(),
  requirement: text("requirement").notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});

// User_Badges junction table
export const userBadges = pgTable(
  "user_badges",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: integer("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at").default(sql`NOW()`).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.badgeId] }),
  })
);

export const userBadgeRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});

export const commentRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [comments.bookId],
    references: [books.id],
  }),
}));

// Friends table
export const friends = pgTable(
  "friends",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    friendId: uuid("friend_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
    updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.friendId] }),
  })
);

export const friendRelations = relations(friends, ({ one }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
    relationName: "friendsAsUser",
  }),
  friend: one(users, {
    fields: [friends.friendId],
    references: [users.id],
    relationName: "friendsAsFriend",
  }),
}));

// Challenges table
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  target: integer("target").notNull(), // koach points, books, or pages
  targetType: text("target_type").notNull(), // "koach", "books", "pages"
  isPrivate: boolean("is_private").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});

export const challengeRelations = relations(challenges, ({ one, many }) => ({
  creator: one(users, {
    fields: [challenges.creatorId],
    references: [users.id],
    relationName: "challengesAsCreator",
  }),
  participants: many(challengeParticipants),
}));

// Challenge_Participants junction table
export const challengeParticipants = pgTable(
  "challenge_participants",
  {
    challengeId: integer("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: challengeStatusEnum("status").default("active").notNull(),
    progress: integer("progress").default(0).notNull(),
    joinedAt: timestamp("joined_at").default(sql`NOW()`).notNull(),
    completedAt: timestamp("completed_at"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.challengeId, t.userId] }),
  })
);

export const challengeParticipantRelations = relations(
  challengeParticipants,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeParticipants.challengeId],
      references: [challenges.id],
    }),
    user: one(users, {
      fields: [challengeParticipants.userId],
      references: [users.id],
    }),
  })
);

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // Can be a book ID, challenge ID, etc.
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Types for database schema
export interface UserPreferences {
  readingFrequency?: "daily" | "weekly" | "monthly";
  ageRange?: "child" | "teen" | "adult";
  preferredCategories?: string[];
  spiritualGoals?: string[];
  preferredReadingFormat?: "text" | "audio";
  preferredReadingTime?: string;
  language?: string;
  theme?: "light" | "dark" | "system";
}

export interface User {
  id: string;
  email: string;
  username: string;
  is_premium: boolean;
  koach_points: number;
  reading_streak: number;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  avatar_url: string | null;
}

export type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;

export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  page_count: number;
  category: string;
  is_public: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  language: string;
  isbn: string | null;
}

export type InsertBook = Omit<Book, 'id' | 'created_at' | 'updated_at'>;

export interface ReadingPlan {
  id: number;
  user_id: string;
  book_id: number;
  title: string;
  start_date: string;
  end_date: string;
  frequency: string;
  pages_per_session: number;
  total_pages: number;
  current_page: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type InsertReadingPlan = Omit<ReadingPlan, 'id' | 'created_at' | 'updated_at'>;

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  requirement: string;
  created_at: string;
  updated_at: string;
}

export type InsertBadge = Omit<Badge, 'id' | 'created_at' | 'updated_at'>;

export interface Challenge {
  id: number;
  title: string;
  description: string;
  created_by: string;
  start_date: string;
  end_date: string;
  goal: number;
  goal_type: 'pages' | 'books' | 'minutes';
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export type InsertChallenge = Omit<Challenge, 'id' | 'created_at' | 'updated_at'>;

export interface Notification {
  id: number;
  user_id: string;
  type: 'achievement' | 'friend_request' | 'challenge' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

export type InsertNotification = Omit<Notification, 'id' | 'created_at'>;

// Types pour les relations
export interface UserBadge {
  user_id: string;
  badge_id: number;
  awarded_at: string;
}

export interface UserBook {
  user_id: string;
  book_id: number;
  last_page_read: number;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface ReadingSession {
  id: number;
  user_id: string;
  book_id: number;
  reading_plan_id: number | null;
  pages_read: number;
  minutes_spent: number | null;
  session_date: string;
  created_at: string;
}

export interface Friend {
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface ChallengeParticipant {
  challenge_id: number;
  user_id: string;
  progress: number;
  status: 'active' | 'completed' | 'abandoned';
  joined_at: string;
  updated_at: string;
  completed_at: string | null;
}

// Type pour la base de données Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: InsertUser;
        Update: Partial<InsertUser>;
      };
      books: {
        Row: Book;
        Insert: InsertBook;
        Update: Partial<InsertBook>;
      };
      reading_plans: {
        Row: ReadingPlan;
        Insert: InsertReadingPlan;
        Update: Partial<InsertReadingPlan>;
      };
      badges: {
        Row: Badge;
        Insert: InsertBadge;
        Update: Partial<InsertBadge>;
      };
      challenges: {
        Row: Challenge;
        Insert: InsertChallenge;
        Update: Partial<InsertChallenge>;
      };
      notifications: {
        Row: Notification;
        Insert: InsertNotification;
        Update: Partial<InsertNotification>;
      };
      user_badges: {
        Row: UserBadge;
        Insert: UserBadge;
        Update: Partial<UserBadge>;
      };
      user_books: {
        Row: UserBook;
        Insert: UserBook;
        Update: Partial<UserBook>;
      };
      reading_sessions: {
        Row: ReadingSession;
        Insert: Omit<ReadingSession, 'id' | 'created_at'>;
        Update: Partial<Omit<ReadingSession, 'id' | 'created_at'>>;
      };
      friends: {
        Row: Friend;
        Insert: Friend;
        Update: Partial<Friend>;
      };
      challenge_participants: {
        Row: ChallengeParticipant;
        Insert: ChallengeParticipant;
        Update: Partial<ChallengeParticipant>;
      };
    };
  };
}
