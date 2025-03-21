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
        id SERIAL PRIMARY KEY,
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
  } catch (error) {
    console.error("Error creating users table:", error);
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
        page_count INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL,
        language TEXT DEFAULT 'en' NOT NULL,
        is_public BOOLEAN DEFAULT true NOT NULL,
        uploaded_by_id INTEGER REFERENCES users(id),
        file_url TEXT,
        audio_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Books table created successfully");
  } catch (error) {
    console.error("Error creating books table:", error);
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
  } catch (error) {
    console.error("Error creating categories table:", error);
  }
}

async function createReadingPlansTable() {
  console.log("Creating reading_plans table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reading_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        total_pages INTEGER NOT NULL,
        current_page INTEGER DEFAULT 0 NOT NULL,
        frequency TEXT NOT NULL,
        pages_per_session INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Reading plans table created successfully");
  } catch (error) {
    console.error("Error creating reading_plans table:", error);
  }
}

async function createUserBooksTable() {
  console.log("Creating user_books table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_books (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  } catch (error) {
    console.error("Error creating user_books table:", error);
  }
}

async function createReadingSessionsTable() {
  console.log("Creating reading_sessions table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        reading_plan_id INTEGER REFERENCES reading_plans(id) ON DELETE SET NULL,
        pages_read INTEGER NOT NULL,
        minutes_spent INTEGER,
        koach_earned INTEGER DEFAULT 0 NOT NULL,
        session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Reading sessions table created successfully");
  } catch (error) {
    console.error("Error creating reading_sessions table:", error);
  }
}

async function createBadgesTable() {
  console.log("Creating badges table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        requirement TEXT NOT NULL,
        points INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Badges table created successfully");
  } catch (error) {
    console.error("Error creating badges table:", error);
  }
}

async function createUserBadgesTable() {
  console.log("Creating user_badges table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
        date_earned TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, badge_id)
      )
    `);
    console.log("User badges table created successfully");
  } catch (error) {
    console.error("Error creating user_badges table:", error);
  }
}

async function createCommentsTable() {
  console.log("Creating comments table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        rating INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Comments table created successfully");
  } catch (error) {
    console.error("Error creating comments table:", error);
  }
}

async function createFriendsTable() {
  console.log("Creating friends table...");
  try {
    await db.execute(sql`
      CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'declined');
      
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status friend_status DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, friend_id)
      )
    `);
    console.log("Friends table created successfully");
  } catch (error) {
    console.error("Error creating friends table:", error);
    // If the error is because the enum already exists, that's okay
    if (error.message.includes("already exists")) {
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS friends (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status friend_status DEFAULT 'pending' NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            UNIQUE(user_id, friend_id)
          )
        `);
        console.log("Friends table created successfully (second attempt)");
      } catch (error2) {
        console.error("Error creating friends table (second attempt):", error2);
      }
    }
  }
}

async function createChallengesTable() {
  console.log("Creating challenges table...");
  try {
    await db.execute(sql`
      CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'abandoned');
      
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        goal INTEGER NOT NULL,
        goal_type TEXT NOT NULL,
        book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        is_private BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Challenges table created successfully");
  } catch (error) {
    console.error("Error creating challenges table:", error);
    // If the error is because the enum already exists, that's okay
    if (error.message.includes("already exists")) {
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS challenges (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            start_date TIMESTAMP WITH TIME ZONE NOT NULL,
            end_date TIMESTAMP WITH TIME ZONE NOT NULL,
            goal INTEGER NOT NULL,
            goal_type TEXT NOT NULL,
            book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
            category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
            is_private BOOLEAN DEFAULT false NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          )
        `);
        console.log("Challenges table created successfully (second attempt)");
      } catch (error2) {
        console.error("Error creating challenges table (second attempt):", error2);
      }
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
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        progress INTEGER DEFAULT 0 NOT NULL,
        status challenge_status DEFAULT 'active' NOT NULL,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(challenge_id, user_id)
      )
    `);
    console.log("Challenge participants table created successfully");
  } catch (error) {
    console.error("Error creating challenge_participants table:", error);
  }
}

async function createNotificationsTable() {
  console.log("Creating notifications table...");
  try {
    await db.execute(sql`
      CREATE TYPE notification_type AS ENUM ('achievement', 'challenge', 'friend', 'reading', 'system');
      
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type notification_type NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT false NOT NULL,
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Notifications table created successfully");
  } catch (error) {
    console.error("Error creating notifications table:", error);
    // If the error is because the enum already exists, that's okay
    if (error.message.includes("already exists")) {
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type notification_type NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            read BOOLEAN DEFAULT false NOT NULL,
            data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          )
        `);
        console.log("Notifications table created successfully (second attempt)");
      } catch (error2) {
        console.error("Error creating notifications table (second attempt):", error2);
      }
    }
  }
}

// Push the schema to the database
async function main() {
  console.log("Pushing schema to database...");
  
  try {
    // Create all tables in order of dependency
    await createUsersTable();
    await createBooksTable();
    await createCategoriesTable();
    await createReadingPlansTable();
    await createUserBooksTable();
    await createReadingSessionsTable();
    await createBadgesTable();
    await createUserBadgesTable();
    await createCommentsTable();
    await createFriendsTable();
    await createChallengesTable();
    await createChallengeParticipantsTable();
    await createNotificationsTable();
    
    console.log("Schema push completed successfully!");
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
