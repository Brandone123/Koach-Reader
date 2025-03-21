import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

// Create a new PostgreSQL connection pool
export const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

// Create a Drizzle instance with the connection pool and schema
export const db = drizzle(pool, { schema });

// Export a function to check if the database is connected
export async function checkDb() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}
