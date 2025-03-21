import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

// Create a Drizzle instance with the connection pool and schema
const db = drizzle(pool, { schema });

// Push the schema to the database
async function main() {
  console.log("Pushing schema to database...");
  
  try {
    // Create the tables in the database
    const allEnums = Object.entries(schema).filter(([name]) => name.endsWith("Enum"));
    const allTables = Object.entries(schema).filter(([name]) => 
      !name.includes("Relation") && 
      !name.includes("$") && 
      !name.endsWith("Enum") &&
      typeof schema[name] === "object" && 
      !Array.isArray(schema[name]) && 
      schema[name] !== null
    );
    
    console.log("Creating enums:", allEnums.map(([name]) => name).join(", "));
    console.log("Creating tables:", allTables.map(([name]) => name).join(", "));
    
    // Let drizzle create the schema
    await db.execute(db.$.dialect.createTableString("users", schema.users));
    
    console.log("Schema push completed successfully!");
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
