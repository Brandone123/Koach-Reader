import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../shared/schema";
import dotenv from "dotenv";
import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Load environment variables
dotenv.config();

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create a Drizzle instance with the connection pool and schema
const db = drizzle(pool, { schema });

// Create tables with proper columns
async function createUsersTable() {
  console.log("Creating users table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_premium BOOLEAN DEFAULT false NOT NULL,
        koach_points INTEGER DEFAULT 0 NOT NULL,
        reading_streak INTEGER DEFAULT 0 NOT NULL,
        preferences JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Users table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Users table already exists");
    } else {
      console.error("Error creating users table:", error);
    }
  }
}

async function createBooksTable() {
  console.log("Creating books table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        description TEXT,
        cover_url TEXT,
        total_pages INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Books table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Books table already exists");
    } else {
      console.error("Error creating books table:", error);
    }
  }
}

async function createCategoriesTable() {
  console.log("Creating categories table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Categories table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Categories table already exists");
    } else {
      console.error("Error creating categories table:", error);
    }
  }
}

async function createReadingPlansTable() {
  console.log("Creating reading_plans table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reading_plans (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        current_page INTEGER DEFAULT 0 NOT NULL,
        status reading_status DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, book_id)
      )
    `);
    console.log("Reading plans table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Reading plans table already exists");
    } else {
      console.error("Error creating reading_plans table:", error);
    }
  }
}

async function createUserBooksTable() {
  console.log("Creating user_books table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_books (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        current_page INTEGER DEFAULT 0 NOT NULL,
        is_favorite BOOLEAN DEFAULT false NOT NULL,
        is_completed BOOLEAN DEFAULT false NOT NULL,
        rating INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, book_id)
      )
    `);
    console.log("User books table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("User books table already exists");
    } else {
      console.error("Error creating user_books table:", error);
    }
  }
}

async function createReadingSessionsTable() {
  console.log("Creating reading_sessions table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        reading_plan_id INTEGER REFERENCES reading_plans(id) ON DELETE SET NULL,
        pages_read INTEGER NOT NULL,
        minutes_spent INTEGER,
        koach_earned INTEGER DEFAULT 0 NOT NULL,
        session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Reading sessions table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Reading sessions table already exists");
    } else {
      console.error("Error creating reading_sessions table:", error);
    }
  }
}

async function createBadgesTable() {
  console.log("Creating badges table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        criteria JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Badges table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Badges table already exists");
    } else {
      console.error("Error creating badges table:", error);
    }
  }
}

async function createUserBadgesTable() {
  console.log("Creating user_badges table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
        date_earned TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, badge_id)
      )
    `);
    console.log("User badges table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("User badges table already exists");
    } else {
      console.error("Error creating user_badges table:", error);
    }
  }
}

async function createCommentsTable() {
  console.log("Creating comments table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        rating INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Comments table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Comments table already exists");
    } else {
      console.error("Error creating comments table:", error);
    }
  }
}

async function createFriendsTable() {
  console.log("Creating friends table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status friend_status DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, friend_id)
      )
    `);
    console.log("Friends table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Friends table already exists");
    } else {
      console.error("Error creating friends table:", error);
    }
  }
}

async function createChallengesTable() {
  console.log("Creating challenges table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        target INTEGER NOT NULL,
        target_type challenge_target_type NOT NULL,
        is_private BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Challenges table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Challenges table already exists");
    } else {
      console.error("Error creating challenges table:", error);
    }
  }
}

async function createChallengeParticipantsTable() {
  console.log("Creating challenge_participants table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS challenge_participants (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        progress INTEGER DEFAULT 0 NOT NULL,
        status challenge_status DEFAULT 'active' NOT NULL,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(challenge_id, user_id)
      )
    `);
    console.log("Challenge participants table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Challenge participants table already exists");
    } else {
      console.error("Error creating challenge_participants table:", error);
    }
  }
}

async function createNotificationsTable() {
  console.log("Creating notifications table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Notifications table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Notifications table already exists");
    } else {
      console.error("Error creating notifications table:", error);
    }
  }
}

async function createProgressLogsTable() {
  console.log("Creating progress_logs table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS progress_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        pages_read INTEGER NOT NULL,
        minutes_read INTEGER NOT NULL,
        notes TEXT,
        logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Progress logs table created successfully");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Progress logs table already exists");
    } else {
      console.error("Error creating progress_logs table:", error);
    }
  }
}

// Main function to create all tables
async function createTables() {
  try {
    // Create custom types first
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE reading_status AS ENUM ('active', 'completed', 'abandoned');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'declined');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'abandoned');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE challenge_target_type AS ENUM ('koach', 'books', 'pages');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create tables in order of dependencies
    await createUsersTable();
    await createBooksTable();
    await createReadingPlansTable();
    await createBadgesTable();
    await createUserBadgesTable();
    await createChallengesTable();
    await createChallengeParticipantsTable();
    await createFriendsTable();
    await createProgressLogsTable();
    
    console.log("All tables created successfully");
  } catch (error: any) {
    console.error("Error creating tables:", error);
  } finally {
    await pool.end();
  }
}

// Run the creation
createTables().catch(console.error);
